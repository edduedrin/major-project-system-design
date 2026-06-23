import { and, asc, count, desc, eq, gte, lt, lte, sql } from "drizzle-orm";
import { format, addDays } from "date-fns";
import { database } from "../server";
import { CustomError, PassbookHistoryPayload, PassbookMetaDataColumn, UserDetails } from "../types";
import { PassbookAuditModel, UserPassbookFilesModel, UserModel, MechanicModel, DealerModel, RetailerModel, RoleModel } from "../schemas";
import { transactionActionEnum } from "../schemas/passbook-audit-model";
import { REDEMPTION_REASON } from "../utils/constant";
import { fileMiddleware } from "../middlewares/file-middleware";
import { pdfMiddleware } from "../middlewares/pdf-middleware";
import { parseDate } from "../utils/random";

export class PassbookRepository {
    customError: CustomError;
    constructor() {
        this.customError = new CustomError({
            responseMessage: "",
            responseCode: 400
        })
    }

    async addTransaction(
        userId: number,
        action: typeof transactionActionEnum.enumValues[number],
        amount: number,
        meta: PassbookMetaDataColumn,
        tran: Parameters<Parameters<typeof database.transaction>[0]>[0]
    ) {
        const exec = tran ?? database;
        const [result] = await exec
            .select({
                balance: PassbookAuditModel.closingBalance
            })
            .from(PassbookAuditModel)
            .where(eq(PassbookAuditModel.userId, userId))
            .orderBy(desc(PassbookAuditModel.auditId))
            .limit(1);

        const openingBalance = Number(result?.balance) || 0;
        const closingBalance = Number(openingBalance) + Number(amount);

        await exec.insert(PassbookAuditModel).values({
            userId: userId,
            type: amount > 0 ? "Earn" : meta?.reason === REDEMPTION_REASON.REDEMPTION_FAILED ? "Refund" : "Redeem",
            action: action,
            amount: String(amount),
            openingBalance: String(openingBalance),
            closingBalance: String(closingBalance),
            meta
        });

        return closingBalance;
    }

    async getPassbook(userDetails: UserDetails, payload: PassbookHistoryPayload) {
        const whereClauses = [eq(PassbookAuditModel.userId, userDetails.userId)];

        if (payload?.fromDate) {
            whereClauses.push(gte(PassbookAuditModel.createdAt, parseDate({ date: payload.fromDate, start: true })));
        }

        if (payload?.toDate) {
            whereClauses.push(lte(PassbookAuditModel.createdAt, parseDate({ date: payload.toDate, end: true })));
        }

        const totalCount = (await database
            .select({
                totalCount: count()
            })
            .from(PassbookAuditModel)
            .where(and(...whereClauses))
        )?.[0]?.totalCount;

        const result = await database
            .select({
                slno: sql`row_number() over (order by ${asc(PassbookAuditModel.createdAt)})`,
                action: PassbookAuditModel.action,
                closingBalance: PassbookAuditModel.closingBalance,
                amount: PassbookAuditModel.amount,
                createdAt: PassbookAuditModel.createdAt
            })
            .from(PassbookAuditModel)
            .where(and(...whereClauses))
            .limit(!payload?.export ? payload?.limit : totalCount)
            .offset(!payload?.export ? payload?.skip : 0)
            .orderBy(asc(PassbookAuditModel.createdAt));

        return {
            reportList: result,
            totalCount,
        }
    }

    async checkExistingStatement(userId: number, payload: PassbookHistoryPayload) {
        // If filters are provided, we don't use cached files because they might not match the date range
        if (payload?.fromDate || payload?.toDate) {
            return null;
        }

        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');

        const [existingFile] = await database
            .select()
            .from(UserPassbookFilesModel)
            .where(
                and(
                    eq(UserPassbookFilesModel.userId, userId),
                    gte(UserPassbookFilesModel.generatedDate, todayStr),
                    lt(UserPassbookFilesModel.generatedDate, tomorrowStr)
                )
            )
            .limit(1);

        return existingFile;
    }

    async downloadStatement(userId: number, payload: PassbookHistoryPayload) {
        const todayStr = format(new Date(), 'yyyy-MM-dd');

        // Fetch user details with firm name and role name
        const [user] = await database
            .select({
                userId: UserModel.userId,
                name: UserModel.userName,
                role: sql<string>`COALESCE(${RoleModel.roleName}, '')`,
                firmName: sql<string>`COALESCE(${MechanicModel.workshopName}, ${DealerModel.firmName}, ${RetailerModel.storeName}, 'N/A')`,
            })
            .from(UserModel)
            .leftJoin(MechanicModel, eq(UserModel.userId, MechanicModel.userId))
            .leftJoin(DealerModel, eq(UserModel.userId, DealerModel.userId))
            .leftJoin(RetailerModel, eq(UserModel.userId, RetailerModel.retailerId))
            .leftJoin(RoleModel, eq(UserModel.userRole, RoleModel.roleId))
            .where(eq(UserModel.userId, userId))
            .limit(1);

        if (!user) {
            throw new CustomError({
                responseMessage: "User not found",
                responseCode: 404,
            });
        }

        const whereClauses = [eq(PassbookAuditModel.userId, userId)];

        if (payload?.fromDate) {
            whereClauses.push(gte(PassbookAuditModel.createdAt, parseDate({ date: payload.fromDate, start: true })));
        }

        if (payload?.toDate) {
            whereClauses.push(lte(PassbookAuditModel.createdAt, parseDate({ date: payload.toDate, end: true })));
        }

        // Fetch all passbook transactions for the user
        const transactions = await database
            .select({
                auditId: PassbookAuditModel.auditId,
                type: PassbookAuditModel.type,
                action: PassbookAuditModel.action,
                amount: PassbookAuditModel.amount,
                openingBalance: PassbookAuditModel.openingBalance,
                closingBalance: PassbookAuditModel.closingBalance,
                createdAt: PassbookAuditModel.createdAt,
                meta: PassbookAuditModel.meta,
            })
            .from(PassbookAuditModel)
            .where(and(...whereClauses))
            .orderBy(PassbookAuditModel.auditId);

        if (transactions.length === 0) {
            throw new CustomError({
                responseMessage: "No transactions found",
                responseCode: 404,
            });
        }

        // Calculate totals
        const totalEarned = transactions
            .filter((t) => t.type === "Earn")
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const totalRedeemed = transactions
            .filter((t) => t.type === "Redeem")
            .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

        const totalBalance =
            transactions[transactions.length - 1]?.closingBalance || "0";

        // Generate PDF and Upload to S3 inside middleware
        const uploadedFileName = await pdfMiddleware.generatePassbookStatement({
            userId,
            user: {
                name: user.name,
                role: user.role,
                firmName: user.firmName,
            },
            summary: {
                totalBalance: Number(totalBalance),
                totalEarned,
                totalRedeemed,
            },
            transactions: transactions.map((t, index) => ({
                sno: index + 1,
                remarks: this.getRemarks(t.type as string, t.action as string),
                dr: t.type === "Redeem" ? Math.abs(Number(t.amount)) : 0,
                cr: t.type === "Earn" ? Number(t.amount) : 0,
                balance: Number(t.closingBalance),
                date: t.createdAt as Date,
            })),
        });

        // Save file record to database (store S3 key)
        await database.insert(UserPassbookFilesModel).values({
            userId,
            fileUrl: uploadedFileName,
            generatedDate: todayStr,
        });

        return {
            fileUrl: uploadedFileName,
            isNew: true,
        };
    }

    private getRemarks(type: string, action: string): string {
        // if (type === "Earn") {
        //     return "Joining points earned";
        // }

        switch (action) {
            case "UPI":
                return "Redeemed via UPI";
            case "BANK_TRANSFER":
                return "Redeemed via Bank";
            case "VOUCHER":
                return "Redeemed via Voucher";
            case "MARKETPLACE":
                return "Redeemed via Marketplace";
            case "REFUND":
                return "Points has been refunded";
            case "TDS_DEDUCTED":
                return "TDS deducted on Earnings";
            case "REGISTRATION":
                return "Registration bonus";
            case "REFERRAL":
                return "Referral bonus";
            case "QR_SCAN":
                return "Scanned a new coupon";
            default:
                return "Other transactions";
        }
    }
}

export const passbookRepository = new PassbookRepository();

// Earn: QR Scan
// await addTransaction(userId, "QR_SCAN", +50, { qrId: "QR1234" });

// Earn: Registration
// await addTransaction(userId, "REGISTRATION", +100);

// Redeem: Bank Transfer
// await addTransaction(userId, "BANK_TRANSFER", -500, { txnId: "TXN123456" });

// Redeem: Voucher
// await addTransaction(userId, "VOUCHER", -200, { voucherCode: "ABCD" });
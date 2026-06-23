import { and, count, desc, eq, getTableColumns, gte, ilike, lte, sql } from "drizzle-orm";
import { AddressModel, MechanicModel, TicketCategoryModel, TicketModel, TransactionModel, UserModel, AccountDetailModel, UserKycDetailsModel, SkuMasterModel, CategoryModel, NotificationModel, NotificationLogModel, RedemptionModel } from "../schemas";
import { database } from "../server";
import { CustomError, ReferralHistoryPayload, TicketFilter, UserDetails } from "../types";
import { fileMiddleware } from "../middlewares/file-middleware";
import { ReferralModel } from "../schemas/referral-model";
import { AdminReferalHistoryPayload, ApplicationLoginPayload, QRTransactionPayload, RegisteredUsersPayload, BankDetailsPayload, KycReportPayload, ProductWiseReportPayload, CategoryReportPayload, ErrorTransactionReportPayload, NotificationReportPayload, BlockedMemberReportPayload, BlockedMemberQrScanReportPayload, AnomalyTransactionsReportPayload } from "../types/reports";
import { alias } from "drizzle-orm/pg-core";
import { ROLES } from "../utils/constant";

class ReportRepository {
    customError!: CustomError;
    constructor() {
        this.customError = new CustomError({
            responseCode: 400,
            responseMessage: ""
        })
    }

    async ticketHistory(payload: TicketFilter, userDetails: UserDetails) {

        const totalCount = (await database.select({ totalCount: count() })
            .from(TicketModel)
            .leftJoin(
                TicketCategoryModel,
                eq(TicketModel.ticketId, TicketCategoryModel.ticketId)
            )
            .where(
                and(
                    eq(TicketModel.userId, userDetails?.userId),
                    payload?.ticketId ? eq(TicketModel.ticketId, payload?.ticketId) : undefined
                )
            ))?.[0]?.totalCount

        const res = await database.select({
            slno: sql`row_number() over (order by ${desc(TicketModel.ticketId)})`.as('slno'),
            ...getTableColumns(TicketCategoryModel),
            ...getTableColumns(TicketModel),
        })
            .from(TicketModel)
            .leftJoin(
                TicketCategoryModel,
                eq(TicketModel.ticketId, TicketCategoryModel.ticketId)
            )
            .where(
                and(
                    eq(TicketModel.userId, userDetails?.userId),
                    payload?.ticketId ? eq(TicketModel.ticketCategoryId, payload?.ticketId) : undefined
                )
            )
            .limit(payload.export ? totalCount : payload.limit)
            .offset(payload.export ? 0 : payload.skip)
            .orderBy(desc(TicketModel.ticketId))

        for await (let ele of res) {
            if (ele?.imgUrl) {
                ele.imgUrl = await fileMiddleware.getFileSignedUrl(ele?.imgUrl, 'ticket');
            }
            // return ele;
        }
        return {
            reportList: res, totalCount
        }
    }

    async referralHistory(payload: ReferralHistoryPayload, userDetails: UserDetails) {
        const totalCount = (await database
            .select({
                totalCount: count()
            })
            .from(ReferralModel)
            .leftJoin(UserModel, eq(ReferralModel.refereeUserId, UserModel.userId))
            .where(
                and(
                    eq(ReferralModel.referrerUserId, userDetails.userId),
                    eq(ReferralModel.isActive, true)
                )
            ))?.[0]?.totalCount

        const result = await database
            .select({
                slno: sql`row_number() over (order by ${desc(ReferralModel.referralId)})`,
                points: ReferralModel.refereePoints,
                createdBy: UserModel.userName,
                createdAt: ReferralModel.createdAt
            })
            .from(ReferralModel)
            .leftJoin(UserModel, eq(ReferralModel.refereeUserId, UserModel.userId))
            .where(
                and(
                    eq(ReferralModel.referrerUserId, userDetails.userId),
                    eq(ReferralModel.isActive, true)
                )
            )
            .limit(payload?.limit)
            .offset(payload?.skip)
            .orderBy(desc(ReferralModel.referralId))

        return {
            totalCount,
            reportList: result
        }
    }

    async applicationLogin(payload: ApplicationLoginPayload, userDetails: UserDetails) {
        const totalCount = (await database
            .select({ totalCount: count() })
            .from(UserModel)
            .leftJoin(MechanicModel, eq(UserModel.userId, MechanicModel.userId))
            .where(
                and(
                    gte(UserModel.createdAt, payload?.fromDate ?? new Date(0)),
                    lte(UserModel.createdAt, payload?.toDate ?? new Date()),
                    eq(UserModel.userRole, ROLES.MECHANIC),
                    payload?.userName ? ilike(UserModel.userName, `%${payload.userName}%`) : undefined,
                    payload?.userMobile ? ilike(UserModel.userMobile, `%${payload.userMobile}%`) : undefined,
                )
            ))?.[0]?.totalCount;
        const result = await database
            .select({
                slno: sql`row_number() over (order by ${desc(UserModel.userId)})`,
                userCode: UserModel.userCode,
                userName: UserModel.userName,
                userMobile: UserModel.userMobile,
                userEmail: UserModel.userEmail,
                firstLogin: UserModel.createdAt,
                lastLogin: UserModel.lastLoginAt,
                loginDevice: sql<string>`'android'`,
                logoutAt: UserModel.lastLogoutAt,
                welcomePoints: MechanicModel.bonusPoints,
                scannedPoints: MechanicModel.scannedPoints,
                rewardPoints: MechanicModel.earnedPoints,
                redeemedPoints: MechanicModel.redeemedPoints,
                balancePoints: MechanicModel.balancePoints,
            })
            .from(UserModel)
            .leftJoin(MechanicModel, eq(UserModel.userId, MechanicModel.userId))
            .where(
                and(
                    gte(UserModel.createdAt, payload?.fromDate ?? new Date(0)),
                    lte(UserModel.createdAt, payload?.toDate ?? new Date()),
                    eq(UserModel.userRole, ROLES.MECHANIC),
                    payload?.userName ? ilike(UserModel.userName, `%${payload.userName}%`) : undefined,
                    payload?.userMobile ? ilike(UserModel.userMobile, `%${payload.userMobile}%`) : undefined,
                )
            )
            .limit(payload?.limit)
            .offset(payload?.skip)
            .orderBy(desc(UserModel.userId))
        return {
            totalCount,
            reportList: result
        }
    }

    async registeredUsers(payload: RegisteredUsersPayload) {
        const totalCount = (await database
            .select({ totalCount: count() })
            .from(UserModel)
            .leftJoin(MechanicModel, eq(UserModel.userId, MechanicModel.userId))
            .where(
                and(
                    gte(UserModel.createdAt, payload?.fromDate ?? new Date(0)),
                    lte(UserModel.createdAt, payload?.toDate ?? new Date()),
                    eq(UserModel.userRole, ROLES.MECHANIC),
                    payload?.userName ? ilike(UserModel.userName, `%${payload.userName}%`) : undefined,
                    payload?.userMobile ? ilike(UserModel.userMobile, `%${payload.userMobile}%`) : undefined,
                    payload?.status ? eq(UserModel.blockStatus, payload.status) : undefined
                )
            ))?.[0]?.totalCount;
        const result = await database
            .select({
                slno: sql`row_number() over (order by ${desc(UserModel.userId)})`,
                userId: UserModel.userId,
                uniqueCode: UserModel.userCode,
                roleName: sql<string>`CASE 
                WHEN ${UserModel.userRole} = 1 THEN 'mechanic'
                WHEN ${UserModel.userRole} = 2 THEN 'admin'
                WHEN ${UserModel.userRole} = 3 THEN 'call_centre_executive'
                WHEN ${UserModel.userRole} = 4 THEN 'manager'
                WHEN ${UserModel.userRole} = 5 THEN 'operator'
                WHEN ${UserModel.userRole} = 6 THEN 'viewer'
                ELSE 'unknown'
            END`,
                status: UserModel.blockStatus,
                email: UserModel.userEmail,
                mobile: UserModel.userMobile,
                fullName: UserModel.userName,
                aadhaarNumberMasked: MechanicModel.maskedAadhaarNumber,
                panNumber: MechanicModel.panNumber,
                aadhaarStatus: MechanicModel.tdsAadhaarLinkage,
                gender: MechanicModel.gender,
                age: MechanicModel.age,
                country: sql<string>`'India'`,
                state: AddressModel.currentState,
                city: AddressModel.currentCity,
                pincode: AddressModel.currentPincode,
                zone: AddressModel.zoneName,
                mappedRetailers: MechanicModel.mappedRetailers
            })
            .from(UserModel)
            .leftJoin(MechanicModel, eq(UserModel.userId, MechanicModel.userId))
            .leftJoin(AddressModel, eq(UserModel.userId, AddressModel.userId))
            .where(
                and(
                    gte(UserModel.createdAt, payload?.fromDate ?? new Date(0)),
                    lte(UserModel.createdAt, payload?.toDate ?? new Date()),
                    eq(UserModel.userRole, ROLES.MECHANIC),
                    payload?.userName ? ilike(UserModel.userName, `%${payload.userName}%`) : undefined,
                    payload?.userMobile ? ilike(UserModel.userMobile, `%${payload.userMobile}%`) : undefined,
                    payload?.status ? eq(UserModel.blockStatus, payload.status) : undefined
                )
            )
            .limit(payload?.limit)
            .offset(payload?.skip)
            .orderBy(desc(UserModel.userId));
        return {
            totalCount,
            reportList: result
        }
    }

    async qrTransaction(payload: QRTransactionPayload) {
        const totalCount = (await database
            .select({ totalCount: count() })
            .from(TransactionModel)
            .leftJoin(UserModel, eq(TransactionModel.userId, UserModel.userId))
            .leftJoin(MechanicModel, eq(TransactionModel.userId, MechanicModel.userId))
            .where(
                and(
                    gte(TransactionModel.createdAt, payload?.fromDate ?? new Date(0)),
                    lte(TransactionModel.createdAt, payload?.toDate ?? new Date()),
                    payload?.userName ? ilike(UserModel.userName, `%${payload.userName}%`) : undefined,
                    payload?.userMobile ? ilike(UserModel.userMobile, `%${payload.userMobile}%`) : undefined,
                    payload?.status ? eq(TransactionModel.transactionStatus, payload.status as any) : undefined
                )
            ))?.[0]?.totalCount;
        const result = await database
            .select({
                slno: sql`row_number() over (order by ${desc(TransactionModel.transactionId)})`,
                transactionId: TransactionModel.transactionId,
                transactionDate: TransactionModel.createdAt,
                amount: TransactionModel.totalPoints,
                paymentStatus: TransactionModel.transactionStatus,
                qrCodeId: TransactionModel.serialNumber,
                userCode: UserModel.userCode,
                userName: UserModel.userName,
                email: UserModel.userEmail,
                phone: UserModel.userMobile,
                latitude: TransactionModel.latitude,
                longitude: TransactionModel.longitude,
                address: AddressModel.currentAddress,
                city: AddressModel.currentCity,
                country: sql<string>`'India'`
            })
            .from(TransactionModel)
            .leftJoin(UserModel, eq(TransactionModel.userId, UserModel.userId))
            .leftJoin(MechanicModel, eq(TransactionModel.userId, MechanicModel.userId))
            .leftJoin(AddressModel, eq(MechanicModel.userId, AddressModel.userId))
            .where(
                and(
                    gte(TransactionModel.createdAt, payload?.fromDate ?? new Date(0)),
                    lte(TransactionModel.createdAt, payload?.toDate ?? new Date()),
                    payload?.userName ? ilike(UserModel.userName, `%${payload.userName}%`) : undefined,
                    payload?.userMobile ? ilike(UserModel.userMobile, `%${payload.userMobile}%`) : undefined,
                    payload?.status ? eq(TransactionModel.transactionStatus, payload.status as any) : undefined
                )
            )
            .limit(payload?.limit)
            .offset(payload?.skip)
            .orderBy(desc(TransactionModel.transactionId))
        return {
            totalCount,
            reportList: result
        }
    }

    async adminReferalHistory(payload: AdminReferalHistoryPayload) {
        const senderUser = alias(UserModel, "senderUser");
        const receiverUser = alias(UserModel, "receiverUser");
        const senderMech = alias(MechanicModel, "senderMech");
        const receiverMech = alias(MechanicModel, "receiverMech");
        const totalCount = (await database
            .select({ totalCount: count() })
            .from(ReferralModel)
            .leftJoin(receiverUser, eq(ReferralModel.referrerUserId, receiverUser.userId))
            .where(
                and(
                    gte(ReferralModel.createdAt, payload?.fromDate ?? new Date(0)),
                    lte(ReferralModel.createdAt, payload?.toDate ?? new Date()),
                    eq(ReferralModel.isActive, true),
                    payload?.receiverMobileNumber ? ilike(receiverUser.userMobile, `%${payload.receiverMobileNumber}%`) : undefined,
                    payload?.referralCode ? ilike(ReferralModel.referralCode, `%${payload.referralCode}%`) : undefined
                )
            ))?.[0]?.totalCount;
        const result = await database
            .select({
                slno: sql`row_number() over (order by ${desc(ReferralModel.referralId)})`,
                senderUniqueCode: senderUser.userCode,
                senderMobileNumber: senderUser.userMobile,
                senderName: senderUser.displayName,
                receiverUniqueCode: receiverUser.userCode,
                receiverMobileNumber: receiverUser.userMobile,
                receiverName: receiverUser.displayName,
                referralCode: ReferralModel.referralCode,
                pointsEarnedBySender: ReferralModel.referrerPoints,
                pointsEarnedByReceiver: ReferralModel.refereePoints,
                dateOfReferral: ReferralModel.createdAt,
            })
            .from(ReferralModel)
            .leftJoin(senderUser, eq(ReferralModel.referrerUserId, senderUser.userId))
            .leftJoin(senderMech, eq(senderUser.userId, senderMech.userId))
            .leftJoin(receiverUser, eq(ReferralModel.refereeUserId, receiverUser.userId))
            .leftJoin(receiverMech, eq(receiverUser.userId, receiverMech.userId))
            .where(
                and(
                    gte(ReferralModel.createdAt, payload?.fromDate ?? new Date(0)),
                    lte(ReferralModel.createdAt, payload?.toDate ?? new Date()),
                    eq(ReferralModel.isActive, true),
                    payload?.receiverMobileNumber ? ilike(receiverUser.userMobile, `%${payload.receiverMobileNumber}%`) : undefined,
                    payload?.referralCode ? ilike(ReferralModel.referralCode, `%${payload.referralCode}%`) : undefined
                )
            )
            .limit(payload?.limit)
            .offset(payload?.skip)
            .orderBy(desc(ReferralModel.referralId));
        return {
            totalCount,
            reportList: result
        };
    }
    async bankDetailsReport(payload: BankDetailsPayload) {
        const totalCount = (await database
            .select({ totalCount: count() })
            .from(UserModel)
            .leftJoin(AccountDetailModel, eq(UserModel.userId, AccountDetailModel.userId))
            .where(
                and(
                    gte(UserModel.createdAt, payload?.fromDate ?? new Date(0)),
                    lte(UserModel.createdAt, payload?.toDate ?? new Date()),
                    payload?.uniqueCode ? ilike(UserModel.userCode, `%${payload.uniqueCode}%`) : undefined,
                    payload?.name ? ilike(UserModel.userName, `%${payload.name}%`) : undefined,
                    payload?.roleName ? eq(UserModel.userRole, payload.roleName.toLowerCase() === 'mechanic' ? 1 : payload.roleName.toLowerCase() === 'admin' ? 2 : payload.roleName.toLowerCase() === 'call_centre_executive' ? 3 : payload.roleName.toLowerCase() === 'manager' ? 4 : payload.roleName.toLowerCase() === 'operator' ? 5 : payload.roleName.toLowerCase() === 'viewer' ? 6 : -1) : undefined,
                    payload?.mobileNumber ? ilike(UserModel.userMobile, `%${payload.mobileNumber}%`) : undefined,
                    payload?.bankName ? ilike(AccountDetailModel.bankName, `%${payload.bankName}%`) : undefined,
                    payload?.accountNumber ? eq(AccountDetailModel.accountNumber, payload.accountNumber) : undefined,
                    payload?.ifscCode ? ilike(AccountDetailModel.accountIfsc, `%${payload.ifscCode}%`) : undefined,
                    payload?.accountType ? ilike(AccountDetailModel.accountType, `%${payload.accountType}%`) : undefined,
                    payload?.upiId ? ilike(AccountDetailModel.upiId, `%${payload.upiId}%`) : undefined
                )
            ))?.[0]?.totalCount;

        const result = await database
            .select({
                slno: sql`row_number() over (order by ${desc(UserModel.userId)})`,
                userId: UserModel.userId,
                uniqueCode: UserModel.userCode,
                name: UserModel.userName,
                roleName: sql<string>`CASE 
                    WHEN ${UserModel.userRole} = 1 THEN 'mechanic'
                    WHEN ${UserModel.userRole} = 2 THEN 'admin'
                    WHEN ${UserModel.userRole} = 3 THEN 'call_centre_executive'
                    WHEN ${UserModel.userRole} = 4 THEN 'manager'
                    WHEN ${UserModel.userRole} = 5 THEN 'operator'
                    WHEN ${UserModel.userRole} = 6 THEN 'viewer'
                    ELSE 'unknown'
                END`,
                mobileNumber: UserModel.userMobile,
                bankName: AccountDetailModel.bankName,
                accountNumber: AccountDetailModel.accountNumber,
                ifscCode: AccountDetailModel.accountIfsc,
                accountType: AccountDetailModel.accountType,
                branchName: AccountDetailModel.bankBranch,
                bankAddress: sql<string>`''`, // Not available in schema explicitly
                upiId: AccountDetailModel.upiId
            })
            .from(UserModel)
            .leftJoin(AccountDetailModel, eq(UserModel.userId, AccountDetailModel.userId))
            .where(
                and(
                    gte(UserModel.createdAt, payload?.fromDate ?? new Date(0)),
                    lte(UserModel.createdAt, payload?.toDate ?? new Date()),
                    payload?.uniqueCode ? ilike(UserModel.userCode, `%${payload.uniqueCode}%`) : undefined,
                    payload?.name ? ilike(UserModel.userName, `%${payload.name}%`) : undefined,
                    payload?.roleName ? eq(UserModel.userRole, payload.roleName.toLowerCase() === 'mechanic' ? 1 : payload.roleName.toLowerCase() === 'admin' ? 2 : payload.roleName.toLowerCase() === 'call_centre_executive' ? 3 : payload.roleName.toLowerCase() === 'manager' ? 4 : payload.roleName.toLowerCase() === 'operator' ? 5 : payload.roleName.toLowerCase() === 'viewer' ? 6 : -1) : undefined,
                    payload?.mobileNumber ? ilike(UserModel.userMobile, `%${payload.mobileNumber}%`) : undefined,
                    payload?.bankName ? ilike(AccountDetailModel.bankName, `%${payload.bankName}%`) : undefined,
                    payload?.accountNumber ? eq(AccountDetailModel.accountNumber, payload.accountNumber) : undefined,
                    payload?.ifscCode ? ilike(AccountDetailModel.accountIfsc, `%${payload.ifscCode}%`) : undefined,
                    payload?.accountType ? ilike(AccountDetailModel.accountType, `%${payload.accountType}%`) : undefined,
                    payload?.upiId ? ilike(AccountDetailModel.upiId, `%${payload.upiId}%`) : undefined
                )
            )
            .limit(payload?.limit)
            .offset(payload?.skip)
            .orderBy(desc(UserModel.userId));

        return { totalCount, reportList: result };
    }

    async kycReport(payload: KycReportPayload) {
        const kycDocStatusSql = sql<string>`
            CASE
                WHEN bool_or(${UserKycDetailsModel.docStatus} = 'Pending') THEN 'Pending'
                WHEN bool_or(${UserKycDetailsModel.docStatus} = 'Rejected') THEN 'Rejected'
                WHEN bool_and(${UserKycDetailsModel.docStatus} = 'Completed') THEN 'Approved By Market Head'
                WHEN bool_and(${UserKycDetailsModel.docStatus} IN ('Approved', 'Completed')) THEN 'Approved By Regional Head'
                ELSE 'Pending'
            END
        `.as('kyc_doc_status');

        const whereClause = and(
            gte(UserModel.createdAt, payload?.fromDate ?? new Date(0)),
            lte(UserModel.createdAt, payload?.toDate ?? new Date()),
            eq(UserModel.userRole, ROLES.MECHANIC),
            payload?.uniqueCode ? ilike(UserModel.userCode, `%${payload.uniqueCode}%`) : undefined,
            payload?.name ? ilike(UserModel.userName, `%${payload.name}%`) : undefined,
            payload?.roleName ? eq(UserModel.userRole, payload.roleName.toLowerCase() === 'mechanic' ? 1 : payload.roleName.toLowerCase() === 'admin' ? 2 : payload.roleName.toLowerCase() === 'call_centre_executive' ? 3 : payload.roleName.toLowerCase() === 'manager' ? 4 : payload.roleName.toLowerCase() === 'operator' ? 5 : payload.roleName.toLowerCase() === 'viewer' ? 6 : -1) : undefined,
            payload?.mobileNumber ? ilike(UserModel.userMobile, `%${payload.mobileNumber}%`) : undefined,
            payload?.emailId ? ilike(UserModel.userEmail, `%${payload.emailId}%`) : undefined,
            payload?.status ? eq(UserModel.blockStatus, payload.status as any) : undefined,
            payload?.aadhaarNumber ? ilike(MechanicModel.aadhaarNumber, `%${payload.aadhaarNumber}%`) : undefined,
            // payload?.kycDocStatus == "Pending" ? eq(UserKycDetailsModel.docStatus, 'Pending') :
            //     payload?.kycDocStatus == "Rejected" ? eq(UserKycDetailsModel.docStatus, 'Rejected') :
            //         payload?.kycDocStatus == "Completed" ? eq(UserKycDetailsModel.docStatus, 'Completed') :
            //             payload?.kycDocStatus == "Approved" ? eq(UserKycDetailsModel.docStatus, 'Approved') : undefined,
        );

        const sq = database
            .select({
                userId: UserModel.userId,
                kycDocStatus: kycDocStatusSql,
            })
            .from(UserModel)
            .leftJoin(UserKycDetailsModel, eq(UserModel.userId, UserKycDetailsModel.userId))
            .leftJoin(MechanicModel, eq(UserModel.userId, MechanicModel.userId))
            .where(whereClause)
            .groupBy(UserModel.userId)
            .as("sq");

        const subqueryConditions = [];
        if (payload?.kycDocStatus) {
            subqueryConditions.push(
                eq(sq.kycDocStatus, payload.kycDocStatus)
            );
        }

        const totalCountResult = await database
            .select({ totalCount: count() })
            .from(sq)
            .where(and(...subqueryConditions));

        const totalCount = Number(totalCountResult?.[0]?.totalCount || 0);

        const result = await database
            .select({
                slno: sql`row_number() over (order by ${desc(UserModel.userId)})`,
                userId: UserModel.userId,
                uniqueCode: UserModel.userCode,
                name: UserModel.userName,
                roleName: sql<string>`CASE 
                    WHEN ${UserModel.userRole} = 1 THEN 'mechanic'
                    WHEN ${UserModel.userRole} = 2 THEN 'admin'
                    WHEN ${UserModel.userRole} = 3 THEN 'call_centre_executive'
                    WHEN ${UserModel.userRole} = 4 THEN 'manager'
                    WHEN ${UserModel.userRole} = 5 THEN 'operator'
                    WHEN ${UserModel.userRole} = 6 THEN 'viewer'
                    ELSE 'unknown'
                END`,
                mobileNumber: UserModel.userMobile,
                emailId: UserModel.userEmail,
                status: UserModel.blockStatus,
                kycVerified: MechanicModel.kycApproval,
                dateOfBirth: MechanicModel.dob,
                createdAt: UserModel.createdAt,
                aadhaarNumber: MechanicModel.maskedAadhaarNumber,
                aadhaarFrontImage: MechanicModel.aadhaarFrontUrl,
                aadhaarBackImage: MechanicModel.aadhaarBackUrl,
                panFrontImage: MechanicModel.panFrontUrl,
                profileImage: MechanicModel.profileUrl,
                kycDocStatus: sq.kycDocStatus
            })
            .from(UserModel)
            .leftJoin(MechanicModel, eq(UserModel.userId, MechanicModel.userId))
            .innerJoin(sq, eq(UserModel.userId, sq.userId))
            .where(and(...subqueryConditions))
            .limit(payload?.limit)
            .offset(payload?.skip)
            .orderBy(desc(UserModel.userId));

        for await (let ele of result) {
            if (ele?.aadhaarFrontImage) ele.aadhaarFrontImage = await fileMiddleware.getFileSignedUrl(ele.aadhaarFrontImage, 'aadhaar-front');
            if (ele?.aadhaarBackImage) ele.aadhaarBackImage = await fileMiddleware.getFileSignedUrl(ele.aadhaarBackImage, 'aadhaar-back');
            if (ele?.panFrontImage) ele.panFrontImage = await fileMiddleware.getFileSignedUrl(ele.panFrontImage, 'pan-front');
            if (ele?.profileImage) ele.profileImage = await fileMiddleware.getFileSignedUrl(ele.profileImage, 'user-profile');
        }

        return { totalCount, reportList: result };
    }
    async productWiseReport(payload: ProductWiseReportPayload) {
        const totalCount = (await database
            .select({ totalCount: count() })
            .from(TransactionModel)
            .leftJoin(UserModel, eq(TransactionModel.userId, UserModel.userId))
            .leftJoin(AddressModel, eq(UserModel.userId, AddressModel.userId))
            .leftJoin(SkuMasterModel, eq(TransactionModel.skuCode, SkuMasterModel.skuCode))
            .leftJoin(CategoryModel, eq(SkuMasterModel.categoryId, CategoryModel.categoryId))
            .where(
                and(
                    gte(TransactionModel.createdAt, payload?.fromDate ?? new Date(0)),
                    lte(TransactionModel.createdAt, payload?.toDate ?? new Date()),
                    payload?.memberName ? ilike(UserModel.userName, `%${payload.memberName}%`) : undefined,
                    payload?.productCode ? ilike(TransactionModel.skuCode, `%${payload.productCode}%`) : undefined,
                    payload?.productCategory ? ilike(CategoryModel.categoryName, `%${payload.productCategory}%`) : undefined,
                    payload?.userType ? eq(UserModel.userRole, payload.userType.toLowerCase() === 'mechanic' ? 1 : payload.userType.toLowerCase() === 'admin' ? 2 : payload.userType.toLowerCase() === 'call_centre_executive' ? 3 : payload.userType.toLowerCase() === 'manager' ? 4 : payload.userType.toLowerCase() === 'operator' ? 5 : payload.userType.toLowerCase() === 'viewer' ? 6 : -1) : undefined,
                    payload?.district ? ilike(AddressModel.currentDistrict, `%${payload.district}%`) : undefined,
                    payload?.state ? ilike(AddressModel.currentState, `%${payload.state}%`) : undefined,
                    payload?.scandate ? and(gte(TransactionModel.createdAt, payload.scandate), lte(TransactionModel.createdAt, new Date(payload.scandate.getTime() + 86400000))) : undefined
                )
            ))?.[0]?.totalCount;

        const result = await database
            .select({
                slno: sql`row_number() over (order by ${desc(TransactionModel.transactionId)})`,
                userId: UserModel.userId,
                memberName: UserModel.userName,
                productCode: TransactionModel.skuCode,
                productCategory: CategoryModel.categoryName,
                productType: sql<string>`''`, // Not explicitly available
                productDescription: SkuMasterModel.skuDescription,
                userType: sql<string>`CASE 
                    WHEN ${UserModel.userRole} = 1 THEN 'mechanic'
                    WHEN ${UserModel.userRole} = 2 THEN 'admin'
                    WHEN ${UserModel.userRole} = 3 THEN 'call_centre_executive'
                    WHEN ${UserModel.userRole} = 4 THEN 'manager'
                    WHEN ${UserModel.userRole} = 5 THEN 'operator'
                    WHEN ${UserModel.userRole} = 6 THEN 'viewer'
                    ELSE 'unknown'
                END`,
                district: AddressModel.currentDistrict,
                state: AddressModel.currentState,
                scanDate: TransactionModel.createdAt,
                pointsEarned: TransactionModel.totalPoints
            })
            .from(TransactionModel)
            .leftJoin(UserModel, eq(TransactionModel.userId, UserModel.userId))
            .leftJoin(AddressModel, eq(UserModel.userId, AddressModel.userId))
            .leftJoin(SkuMasterModel, eq(TransactionModel.skuCode, SkuMasterModel.skuCode))
            .leftJoin(CategoryModel, eq(SkuMasterModel.categoryId, CategoryModel.categoryId))
            .where(
                and(
                    gte(TransactionModel.createdAt, payload?.fromDate ?? new Date(0)),
                    lte(TransactionModel.createdAt, payload?.toDate ?? new Date()),
                    payload?.memberName ? ilike(UserModel.userName, `%${payload.memberName}%`) : undefined,
                    payload?.productCode ? ilike(TransactionModel.skuCode, `%${payload.productCode}%`) : undefined,
                    payload?.productCategory ? ilike(CategoryModel.categoryName, `%${payload.productCategory}%`) : undefined,
                    payload?.userType ? eq(UserModel.userRole, payload.userType.toLowerCase() === 'mechanic' ? 1 : payload.userType.toLowerCase() === 'admin' ? 2 : payload.userType.toLowerCase() === 'call_centre_executive' ? 3 : payload.userType.toLowerCase() === 'manager' ? 4 : payload.userType.toLowerCase() === 'operator' ? 5 : payload.userType.toLowerCase() === 'viewer' ? 6 : -1) : undefined,
                    payload?.district ? ilike(AddressModel.currentDistrict, `%${payload.district}%`) : undefined,
                    payload?.state ? ilike(AddressModel.currentState, `%${payload.state}%`) : undefined,
                    payload?.scandate ? and(gte(TransactionModel.createdAt, payload.scandate), lte(TransactionModel.createdAt, new Date(payload.scandate.getTime() + 86400000))) : undefined
                )
            )
            .limit(payload?.limit)
            .offset(payload?.skip)
            .orderBy(desc(TransactionModel.transactionId));

        return { totalCount, reportList: result };
    }

    async categoryReport(payload: CategoryReportPayload) {
        // Aggregate SKUs under particular categories
        const totalCount = (await database
            .select({ totalCount: count() })
            .from(CategoryModel)
            .where(
                and(
                    gte(CategoryModel.createdAt, payload?.fromDate ?? new Date(0)),
                    lte(CategoryModel.createdAt, payload?.toDate ?? new Date()),
                    payload?.categoryName ? ilike(CategoryModel.categoryName, `%${payload.categoryName}%`) : undefined
                )
            ))?.[0]?.totalCount;

        const result = await database
            .select({
                slno: sql`row_number() over (order by ${desc(CategoryModel.categoryId)})`,
                categoryName: CategoryModel.categoryName,
                userType: sql<string>`'mechanic'`, // Standard user type associated generally
                productsInThisCategory: count(SkuMasterModel.skuId),
                bonusPoints: sql<string>`'0.00'`, // Typically configured dynamically or another schema
                bonusPointsActive: sql<string>`'No'`
            })
            .from(CategoryModel)
            .leftJoin(SkuMasterModel, eq(CategoryModel.categoryId, SkuMasterModel.categoryId))
            .where(
                and(
                    gte(CategoryModel.createdAt, payload?.fromDate ?? new Date(0)),
                    lte(CategoryModel.createdAt, payload?.toDate ?? new Date()),
                    payload?.categoryName ? ilike(CategoryModel.categoryName, `%${payload.categoryName}%`) : undefined
                )
            )
            .groupBy(CategoryModel.categoryId)
            .limit(payload?.limit)
            .offset(payload?.skip)
            .orderBy(desc(CategoryModel.categoryId));

        return { totalCount, reportList: result };
    }
    async errorTransactionReport(payload: ErrorTransactionReportPayload) {
        const totalCount = (await database
            .select({ totalCount: count() })
            .from(TransactionModel)
            .leftJoin(UserModel, eq(TransactionModel.userId, UserModel.userId))
            .leftJoin(AddressModel, eq(UserModel.userId, AddressModel.userId))
            .leftJoin(SkuMasterModel, eq(TransactionModel.skuCode, SkuMasterModel.skuCode))
            .where(
                and(
                    eq(TransactionModel.transactionStatus, 'Failure'),
                    gte(TransactionModel.createdAt, payload?.fromDate ?? new Date(0)),
                    lte(TransactionModel.createdAt, payload?.toDate ?? new Date()),
                    payload?.username ? ilike(UserModel.userName, `%${payload.username}%`) : undefined,
                    payload?.userMobileNumber ? ilike(UserModel.userMobile, `%${payload.userMobileNumber}%`) : undefined,
                    payload?.userType ? eq(UserModel.userRole, payload.userType.toLowerCase() === 'mechanic' ? 1 : payload.userType.toLowerCase() === 'admin' ? 2 : payload.userType.toLowerCase() === 'call_centre_executive' ? 3 : payload.userType.toLowerCase() === 'manager' ? 4 : payload.userType.toLowerCase() === 'operator' ? 5 : payload.userType.toLowerCase() === 'viewer' ? 6 : -1) : undefined,
                    payload?.district ? ilike(AddressModel.currentDistrict, `%${payload.district}%`) : undefined,
                    payload?.state ? ilike(AddressModel.currentState, `%${payload.state}%`) : undefined,
                    payload?.serialNumber ? ilike(TransactionModel.serialNumber, `%${payload.serialNumber}%`) : undefined,
                    payload?.productCode ? ilike(TransactionModel.skuCode, `%${payload.productCode}%`) : undefined,
                    payload?.productStatus ? ilike(TransactionModel.transactionStatus, `%${payload.productStatus as any}%`) : undefined
                )
            ))?.[0]?.totalCount;

        const result = await database
            .select({
                slno: sql`row_number() over (order by ${desc(TransactionModel.transactionId)})`,
                userName: UserModel.userName,
                userMobileNumber: UserModel.userMobile,
                dateOfJoining: UserModel.createdAt,
                userType: sql<string>`CASE 
                    WHEN ${UserModel.userRole} = 1 THEN 'mechanic'
                    WHEN ${UserModel.userRole} = 2 THEN 'admin'
                    WHEN ${UserModel.userRole} = 3 THEN 'call_centre_executive'
                    WHEN ${UserModel.userRole} = 4 THEN 'manager'
                    WHEN ${UserModel.userRole} = 5 THEN 'operator'
                    WHEN ${UserModel.userRole} = 6 THEN 'viewer'
                    ELSE 'unknown'
                END`,
                district: AddressModel.currentDistrict,
                state: AddressModel.currentState,
                scanDate: TransactionModel.createdAt,
                qrDetails: TransactionModel.serialNumber,
                productCode: TransactionModel.skuCode,
                productDescription: SkuMasterModel.skuDescription,
                message: TransactionModel.transactionMessage,
                productStatus: TransactionModel.transactionStatus,
                actionTaken: sql<string>`'No Action'`
            })
            .from(TransactionModel)
            .leftJoin(UserModel, eq(TransactionModel.userId, UserModel.userId))
            .leftJoin(AddressModel, eq(UserModel.userId, AddressModel.userId))
            .leftJoin(SkuMasterModel, eq(TransactionModel.skuCode, SkuMasterModel.skuCode))
            .where(
                and(
                    eq(TransactionModel.transactionStatus, 'Failure'),
                    gte(TransactionModel.createdAt, payload?.fromDate ?? new Date(0)),
                    lte(TransactionModel.createdAt, payload?.toDate ?? new Date()),
                    payload?.username ? ilike(UserModel.userName, `%${payload.username}%`) : undefined,
                    payload?.userMobileNumber ? ilike(UserModel.userMobile, `%${payload.userMobileNumber}%`) : undefined,
                    payload?.userType ? eq(UserModel.userRole, payload.userType.toLowerCase() === 'mechanic' ? 1 : payload.userType.toLowerCase() === 'admin' ? 2 : payload.userType.toLowerCase() === 'call_centre_executive' ? 3 : payload.userType.toLowerCase() === 'manager' ? 4 : payload.userType.toLowerCase() === 'operator' ? 5 : payload.userType.toLowerCase() === 'viewer' ? 6 : -1) : undefined,
                    payload?.district ? ilike(AddressModel.currentDistrict, `%${payload.district}%`) : undefined,
                    payload?.state ? ilike(AddressModel.currentState, `%${payload.state}%`) : undefined,
                    payload?.serialNumber ? ilike(TransactionModel.serialNumber, `%${payload.serialNumber}%`) : undefined,
                    payload?.productCode ? ilike(TransactionModel.skuCode, `%${payload.productCode}%`) : undefined,
                    payload?.productStatus ? ilike(TransactionModel.transactionStatus, `%${payload.productStatus as any}%`) : undefined
                )
            )
            .limit(payload?.limit)
            .offset(payload?.skip)
            .orderBy(desc(TransactionModel.transactionId));

        return { totalCount, reportList: result };
    }

    async notificationReport(payload: NotificationReportPayload) {
        const totalCount = (await database
            .select({ totalCount: count() })
            .from(NotificationModel)
            .leftJoin(NotificationLogModel, eq(NotificationModel.id, NotificationLogModel.notificationId))
            .leftJoin(UserModel, eq(NotificationLogModel.userId, UserModel.userId))
            .where(
                and(
                    gte(NotificationModel.createdAt, payload?.fromDate ?? new Date(0)),
                    lte(NotificationModel.createdAt, payload?.toDate ?? new Date()),
                    lte(NotificationModel.createdAt, payload?.toDate ?? new Date())
                )
            ))?.[0]?.totalCount;

        const result = await database
            .select({
                slno: sql`row_number() over (order by ${desc(NotificationModel.id)})`,
                notificationTitle: NotificationModel.title,
                notificationMessage: NotificationModel.body,
                userMobileNumber: UserModel.userMobile,
                userName: UserModel.userName,
                userType: sql<string>`CASE 
                    WHEN ${UserModel.userRole} = 1 THEN 'mechanic'
                    WHEN ${UserModel.userRole} = 2 THEN 'admin'
                    WHEN ${UserModel.userRole} = 3 THEN 'call_centre_executive'
                    WHEN ${UserModel.userRole} = 4 THEN 'manager'
                    WHEN ${UserModel.userRole} = 5 THEN 'operator'
                    WHEN ${UserModel.userRole} = 6 THEN 'viewer'
                    ELSE 'unknown'
                END`,
                sentVia: sql<string>`'Push Notification'`,
                deliveredDate: NotificationLogModel.processedAt,
                sentDate: NotificationModel.scheduledAt,
            })
            .from(NotificationModel)
            .leftJoin(NotificationLogModel, eq(NotificationModel.id, NotificationLogModel.notificationId))
            .leftJoin(UserModel, eq(NotificationLogModel.userId, UserModel.userId))
            .where(
                and(
                    gte(NotificationModel.createdAt, payload?.fromDate ?? new Date(0)),
                    lte(NotificationModel.createdAt, payload?.toDate ?? new Date())
                )
            )
            .limit(payload?.limit)
            .offset(payload?.skip)
            .orderBy(desc(NotificationModel.id));

        return { totalCount, reportList: result };
    }

    async blockedMemberReport(payload: BlockedMemberReportPayload) {
        const totalCount = (await database
            .select({ totalCount: count() })
            .from(UserModel)
            .leftJoin(MechanicModel, eq(UserModel.userId, MechanicModel.userId))
            .leftJoin(AddressModel, eq(UserModel.userId, AddressModel.userId))
            .leftJoin(AccountDetailModel, eq(UserModel.userId, AccountDetailModel.userId))
            .leftJoin(RedemptionModel, eq(UserModel.userId, RedemptionModel.userId))
            .where(
                and(
                    sql`${UserModel.blockStatus} != 'none'`,
                    gte(UserModel.createdAt, payload?.fromDate ?? new Date(0)),
                    lte(UserModel.createdAt, payload?.toDate ?? new Date()),
                    payload?.username ? ilike(UserModel.userName, `%${payload.username}%`) : undefined,
                    payload?.mobileNumber ? ilike(UserModel.userMobile, `%${payload.mobileNumber}%`) : undefined,
                    payload?.userType ? eq(UserModel.userRole, payload.userType.toLowerCase() === 'mechanic' ? 1 : payload.userType.toLowerCase() === 'admin' ? 2 : payload.userType.toLowerCase() === 'call_centre_executive' ? 3 : payload.userType.toLowerCase() === 'manager' ? 4 : payload.userType.toLowerCase() === 'operator' ? 5 : payload.userType.toLowerCase() === 'viewer' ? 6 : -1) : undefined,
                    payload?.district ? ilike(AddressModel.currentDistrict, `%${payload.district}%`) : undefined,
                    payload?.state ? ilike(AddressModel.currentState, `%${payload.state}%`) : undefined,
                    payload?.upiId ? ilike(AccountDetailModel.upiId, `%${payload.upiId}%`) : undefined,
                    payload?.accountNumber ? eq(AccountDetailModel.accountNumber, payload.accountNumber) : undefined,
                    payload?.accountHolderName ? ilike(AccountDetailModel.accountHolderName, `%${payload.accountHolderName}%`) : undefined,
                    payload?.ifscCode ? ilike(AccountDetailModel.accountIfsc, `%${payload.ifscCode}%`) : undefined,
                    payload?.bankName ? ilike(AccountDetailModel.bankName, `%${payload.bankName}%`) : undefined,
                    payload?.status ? eq(UserModel.blockStatus, payload.status as any) : undefined
                )
            ))?.[0]?.totalCount;

        const result = await database
            .select({
                slno: sql`row_number() over (order by ${desc(UserModel.userId)})`,
                userName: UserModel.userName,
                mobileNumber: UserModel.userMobile,
                userType: sql<string>`CASE 
                    WHEN ${UserModel.userRole} = 1 THEN 'mechanic'
                    WHEN ${UserModel.userRole} = 2 THEN 'admin'
                    WHEN ${UserModel.userRole} = 3 THEN 'call_centre_executive'
                    WHEN ${UserModel.userRole} = 4 THEN 'manager'
                    WHEN ${UserModel.userRole} = 5 THEN 'operator'
                    WHEN ${UserModel.userRole} = 6 THEN 'viewer'
                    ELSE 'unknown'
                END`,
                district: AddressModel.currentDistrict,
                state: AddressModel.currentState,
                dateOfJoining: UserModel.createdAt,
                totalEarnedPoints: MechanicModel.earnedPoints,
                redeemedPoints: MechanicModel.redeemedPoints,
                redemptionRequestDate: RedemptionModel.createdAt,
                redemptionProcessedDate: sql<string>`''`, // Database lacks processed_at column currently.
                redemptionDetails: RedemptionModel.redemptionRef,
                upiId: AccountDetailModel.upiId,
                accountNumber: AccountDetailModel.accountNumber,
                accountHolderName: AccountDetailModel.accountHolderName,
                ifscCode: AccountDetailModel.accountIfsc,
                bankName: AccountDetailModel.bankName,
                status: UserModel.blockStatus
            })
            .from(UserModel)
            .leftJoin(MechanicModel, eq(UserModel.userId, MechanicModel.userId))
            .leftJoin(AddressModel, eq(UserModel.userId, AddressModel.userId))
            .leftJoin(AccountDetailModel, eq(UserModel.userId, AccountDetailModel.userId))
            .leftJoin(RedemptionModel, eq(UserModel.userId, RedemptionModel.userId))
            .where(
                and(
                    sql`${UserModel.blockStatus} != 'none'`,
                    gte(UserModel.createdAt, payload?.fromDate ?? new Date(0)),
                    lte(UserModel.createdAt, payload?.toDate ?? new Date()),
                    payload?.username ? ilike(UserModel.userName, `%${payload.username}%`) : undefined,
                    payload?.mobileNumber ? ilike(UserModel.userMobile, `%${payload.mobileNumber}%`) : undefined,
                    payload?.userType ? eq(UserModel.userRole, payload.userType.toLowerCase() === 'mechanic' ? 1 : payload.userType.toLowerCase() === 'admin' ? 2 : payload.userType.toLowerCase() === 'call_centre_executive' ? 3 : payload.userType.toLowerCase() === 'manager' ? 4 : payload.userType.toLowerCase() === 'operator' ? 5 : payload.userType.toLowerCase() === 'viewer' ? 6 : -1) : undefined,
                    payload?.district ? ilike(AddressModel.currentDistrict, `%${payload.district}%`) : undefined,
                    payload?.state ? ilike(AddressModel.currentState, `%${payload.state}%`) : undefined,
                    payload?.upiId ? ilike(AccountDetailModel.upiId, `%${payload.upiId}%`) : undefined,
                    payload?.accountNumber ? eq(AccountDetailModel.accountNumber, payload.accountNumber) : undefined,
                    payload?.accountHolderName ? ilike(AccountDetailModel.accountHolderName, `%${payload.accountHolderName}%`) : undefined,
                    payload?.ifscCode ? ilike(AccountDetailModel.accountIfsc, `%${payload.ifscCode}%`) : undefined,
                    payload?.bankName ? ilike(AccountDetailModel.bankName, `%${payload.bankName}%`) : undefined,
                    payload?.status ? eq(UserModel.blockStatus, payload.status as any) : undefined
                )
            )
            .limit(payload?.limit)
            .offset(payload?.skip)
            .orderBy(desc(UserModel.userId));

        return { totalCount, reportList: result };
    }

    async blockedMemberQrScanReport(payload: BlockedMemberQrScanReportPayload) {
        const totalCount = (await database
            .select({ totalCount: count() })
            .from(TransactionModel)
            .leftJoin(UserModel, eq(TransactionModel.userId, UserModel.userId))
            .leftJoin(AddressModel, eq(UserModel.userId, AddressModel.userId))
            .leftJoin(SkuMasterModel, eq(TransactionModel.skuCode, SkuMasterModel.skuCode))
            .leftJoin(CategoryModel, eq(SkuMasterModel.categoryId, CategoryModel.categoryId))
            .where(
                and(
                    sql`${UserModel.blockStatus} != 'none'`,
                    gte(TransactionModel.createdAt, payload?.fromDate ?? new Date(0)),
                    lte(TransactionModel.createdAt, payload?.toDate ?? new Date()),
                    payload?.username ? ilike(UserModel.userName, `%${payload.username}%`) : undefined,
                    payload?.mobileNumber ? ilike(UserModel.userMobile, `%${payload.mobileNumber}%`) : undefined,
                    payload?.district ? ilike(AddressModel.currentDistrict, `%${payload.district}%`) : undefined,
                    payload?.state ? ilike(AddressModel.currentState, `%${payload.state}%`) : undefined,
                    payload?.serialNumber ? ilike(TransactionModel.serialNumber, `%${payload.serialNumber}%`) : undefined,
                    payload?.productCategory ? ilike(CategoryModel.categoryName, `%${payload.productCategory}%`) : undefined,
                    payload?.productCode ? ilike(TransactionModel.skuCode, `%${payload.productCode}%`) : undefined,
                    payload?.productName ? ilike(SkuMasterModel.skuName, `%${payload.productName}%`) : undefined,
                    payload?.scanStatus ? ilike(TransactionModel.transactionStatus, `%${payload.scanStatus as any}%`) : undefined
                )
            ))?.[0]?.totalCount;

        const result = await database
            .select({
                slno: sql`row_number() over (order by ${desc(TransactionModel.transactionId)})`,
                userName: UserModel.userName,
                mobileNumber: UserModel.userMobile,
                district: AddressModel.currentDistrict,
                state: AddressModel.currentState,
                dateOfJoining: UserModel.createdAt,
                scanId: TransactionModel.serialNumber,
                dateOfScan: TransactionModel.createdAt,
                productCategory: CategoryModel.categoryName,
                productCode: TransactionModel.skuCode,
                productName: SkuMasterModel.skuName,
                productDescription: SkuMasterModel.skuDescription,
                qrDetails: TransactionModel.serialNumber,
                basePoint: TransactionModel.baseSchemePoints,
                extraBonusPoint: sql<number>`${TransactionModel.totalPoints} - ${TransactionModel.baseSchemePoints}`,
                totalPoints: TransactionModel.totalPoints,
                scanStatus: TransactionModel.transactionStatus
            })
            .from(TransactionModel)
            .leftJoin(UserModel, eq(TransactionModel.userId, UserModel.userId))
            .leftJoin(AddressModel, eq(UserModel.userId, AddressModel.userId))
            .leftJoin(SkuMasterModel, eq(TransactionModel.skuCode, SkuMasterModel.skuCode))
            .leftJoin(CategoryModel, eq(SkuMasterModel.categoryId, CategoryModel.categoryId))
            .where(
                and(
                    sql`${UserModel.blockStatus} != 'none'`,
                    gte(TransactionModel.createdAt, payload?.fromDate ?? new Date(0)),
                    lte(TransactionModel.createdAt, payload?.toDate ?? new Date()),
                    payload?.username ? ilike(UserModel.userName, `%${payload.username}%`) : undefined,
                    payload?.mobileNumber ? ilike(UserModel.userMobile, `%${payload.mobileNumber}%`) : undefined,
                    payload?.district ? ilike(AddressModel.currentDistrict, `%${payload.district}%`) : undefined,
                    payload?.state ? ilike(AddressModel.currentState, `%${payload.state}%`) : undefined,
                    payload?.serialNumber ? ilike(TransactionModel.serialNumber, `%${payload.serialNumber}%`) : undefined,
                    payload?.productCategory ? ilike(CategoryModel.categoryName, `%${payload.productCategory}%`) : undefined,
                    payload?.productCode ? ilike(TransactionModel.skuCode, `%${payload.productCode}%`) : undefined,
                    payload?.productName ? ilike(SkuMasterModel.skuName, `%${payload.productName}%`) : undefined,
                    payload?.scanStatus ? ilike(TransactionModel.transactionStatus, `%${payload.scanStatus as any}%`) : undefined
                )
            )
            .limit(payload?.limit)
            .offset(payload?.skip)
            .orderBy(desc(TransactionModel.transactionId));

        return { totalCount, reportList: result };
    }

    async anomalyTransactionsReport(payload: AnomalyTransactionsReportPayload) {
        // As discussed, anomaly transactions don't have a specific anomaly mapping explicitly
        // We evaluate an 'anomaly' conceptually by highlighting potentially suspect behaviors (like multiple high point failed scans, or block list mappings over transactions)
        // Here we'll default to transactions triggered by unverified users or failures pending a concrete mapping table over Anomaly Models.

        const totalCount = (await database
            .select({ totalCount: count() })
            .from(TransactionModel)
            .leftJoin(UserModel, eq(TransactionModel.userId, UserModel.userId))
            .leftJoin(AddressModel, eq(UserModel.userId, AddressModel.userId))
            .leftJoin(MechanicModel, eq(UserModel.userId, MechanicModel.userId))
            .leftJoin(SkuMasterModel, eq(TransactionModel.skuCode, SkuMasterModel.skuCode))
            .leftJoin(CategoryModel, eq(SkuMasterModel.categoryId, CategoryModel.categoryId))
            .where(
                and(
                    eq(TransactionModel.transactionStatus, 'Failure'),
                    gte(TransactionModel.createdAt, payload?.fromDate ?? new Date(0)),
                    lte(TransactionModel.createdAt, payload?.toDate ?? new Date()),
                    payload?.referenceId ? eq(TransactionModel.transactionId, payload.referenceId) : undefined,
                    payload?.district ? ilike(AddressModel.currentDistrict, `%${payload.district}%`) : undefined,
                    payload?.state ? ilike(AddressModel.currentState, `%${payload.state}%`) : undefined,
                    payload?.influencerName ? ilike(UserModel.userName, `%${payload.influencerName}%`) : undefined,
                    payload?.userMobileNumber ? ilike(UserModel.userMobile, `%${payload.userMobileNumber}%`) : undefined,
                    payload?.productQR ? ilike(TransactionModel.serialNumber, `%${payload.productQR}%`) : undefined
                )
            ))?.[0]?.totalCount;

        const result = await database
            .select({
                slno: sql`row_number() over (order by ${desc(TransactionModel.transactionId)})`,
                referenceId: TransactionModel.transactionId,
                district: AddressModel.currentDistrict,
                state: AddressModel.currentState,
                influencerName: UserModel.userName,
                userMobileNumber: UserModel.userMobile,
                dateOfJoining: UserModel.createdAt,
                productQR: TransactionModel.serialNumber,
                productCategoryScanned: CategoryModel.categoryName,
                dateOfScan: TransactionModel.createdAt,
                frequencyOfAnomaly: sql<number>`(SELECT COUNT(transaction_id) FROM tbl_transactions WHERE user_id = ${TransactionModel.userId} AND transaction_status = 'Failure')::int`,
                anomalyValueScanned: TransactionModel.productValue,
                totalPointsEarned: MechanicModel.earnedPoints,
                totalPointsRedeemed: MechanicModel.redeemedPoints,
                totalPointsScanned: MechanicModel.scannedPoints,
                firstScanDate: sql<Date>`(SELECT MIN(created_at) FROM tbl_transactions WHERE user_id = ${TransactionModel.userId})`,
                lastScanDate: sql<Date>`(SELECT MAX(created_at) FROM tbl_transactions WHERE user_id = ${TransactionModel.userId})`,
                lastScanId: sql<number>`(SELECT transaction_id FROM tbl_transactions WHERE user_id = ${TransactionModel.userId} ORDER BY created_at DESC LIMIT 1)`,
                updatedAt: TransactionModel.createdAt,
                actionTaken: sql<string>`'none'`
            })
            .from(TransactionModel)
            .leftJoin(UserModel, eq(TransactionModel.userId, UserModel.userId))
            .leftJoin(AddressModel, eq(UserModel.userId, AddressModel.userId))
            .leftJoin(MechanicModel, eq(UserModel.userId, MechanicModel.userId))
            .leftJoin(SkuMasterModel, eq(TransactionModel.skuCode, SkuMasterModel.skuCode))
            .leftJoin(CategoryModel, eq(SkuMasterModel.categoryId, CategoryModel.categoryId))
            .where(
                and(
                    // Conceptual anomaly representation: Failed scans
                    eq(TransactionModel.transactionStatus, 'Failure'),
                    gte(TransactionModel.createdAt, payload?.fromDate ?? new Date(0)),
                    lte(TransactionModel.createdAt, payload?.toDate ?? new Date()),
                    payload?.referenceId ? eq(TransactionModel.transactionId, payload.referenceId) : undefined,
                    payload?.district ? ilike(AddressModel.currentDistrict, `%${payload.district}%`) : undefined,
                    payload?.state ? ilike(AddressModel.currentState, `%${payload.state}%`) : undefined,
                    payload?.influencerName ? ilike(UserModel.userName, `%${payload.influencerName}%`) : undefined,
                    payload?.userMobileNumber ? ilike(UserModel.userMobile, `%${payload.userMobileNumber}%`) : undefined,
                    payload?.productQR ? ilike(TransactionModel.serialNumber, `%${payload.productQR}%`) : undefined
                )
            )
            .limit(payload?.limit)
            .offset(payload?.skip)
            .orderBy(desc(TransactionModel.transactionId));

        return { totalCount, reportList: result };
    }
}

export const reportRepository = new ReportRepository();
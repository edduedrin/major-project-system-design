// repositories/user-repository.ts
import { AccountDetailModel, ActivityLogModel, AddressModel, AdminModel, CityModel, DistrictModel, MechanicModel, OtpModel, PincodeModel, PointConfigurationModel, RoleModel, StateModel, TicketModel, TicketTrailModel, UserPassbookFilesModel, PassbookAuditModel, DealerModel, RetailerModel, SelectedShockReplacementModel, UserKycDetailsModel, ShockReplacementSkusModel } from "../schemas";
import { genderEnum, UserModel } from "../schemas/user-model";
import { database } from "../server";
import { assignTicket, CustomError, OtpInsert, registerUserPayload, ResetPassword, TenacioMobileToBankData, TicketFilter, TicketPayload, UserDetails, UserProfileUpdate, UserSearch } from "../types";
import { and, desc, asc, eq, getTableColumns, gt, gte, ilike, inArray, InferInsertModel, InferSelectModel, isNotNull, lte, or, sql, SQL, ne, isNull, lt } from "drizzle-orm";
import { compareHash, generateRandomToken } from "../utils/random";
import { TicketCategoryModel } from "../schemas/ticket-categories-model";
import { ROLES } from "../utils/constant";
import { fileMiddleware } from "../middlewares/file-middleware";
import { pdfMiddleware } from "../middlewares/pdf-middleware";
import { userController } from "../controllers";
import { blockLevelEnum } from "../schemas/user-model";
import { ReferralModel } from "../schemas/referral-model";
import { kycRepository } from "./kyc-repository";


export type UserCountFilters = {
    status?: (typeof blockLevelEnum.enumValues)[number];
    role?: number;
};

export class UserRepository {
    customError: CustomError;
    constructor() {
        this.customError = new CustomError({
            responseCode: 400,
            responseMessage: "",
        });
    }

    async createUser(payload: registerUserPayload) {
        const result = await database
            .insert(UserModel)
            .values({
                userName: payload.userName,
                userEmail: payload.userEmail,
                displayName: payload.displayName,
                userPassword: payload.userPassword, // already hashed
                userMobile: payload.userMobile,
                userRole: payload.userRole,
                createdBy: payload.createdBy ?? null,
                updatedBy: payload.updatedBy ?? null,
            })
            .returning(getTableColumns(UserModel));

        return result[0];
    }

    async getUserByMobile(mobile: string) {
        const result = await database
            .select()
            .from(UserModel)
            .where(eq(UserModel.userMobile, mobile)) // ✅ use eq
            .limit(1);

        return result[0] || null;
    }

    async getUserByEmail(email: string) {
        const result = await database
            .select()
            .from(UserModel)
            .where(eq(UserModel.userEmail, email))
            .limit(1);

        return result[0] || null;
    }

    async getHashedPassword(userSearch: UserSearch): Promise<string> {
        const [userData] = await database
            .select({ password: UserModel.userPassword })
            .from(UserModel)
            .where(
                or(
                    userSearch?.mobile ? eq(UserModel.userMobile, userSearch.mobile) : undefined,
                    userSearch?.email ? ilike(UserModel.userEmail, userSearch.email) : undefined
                )
            )
            .limit(1);

        if (!userData) {
            this.customError.responseMessage =
                "User not found, Please provide valid email or mobile";

            throw this.customError;
        }
        return userData.password || "";
    }
    async getUserDetails(payload: UserSearch, userRequest: boolean = false): Promise<UserDetails> {

        const userDetails = database
            .select()
            .from(UserModel)
            .where(
                or(
                    payload?.mobile ? eq(UserModel.userMobile, payload?.mobile) : undefined,
                    payload?.email ? ilike(UserModel.userEmail, payload?.email) : undefined,
                    payload?.userId ? eq(UserModel.userId, payload?.userId) : undefined,
                    payload?.userCode ? eq(UserModel.userCode, payload?.userCode) : undefined,
                )
            )
            .as("userDetails");

        const [result]: any = await database
            .select({
                userId: userDetails.userId,
                userName: userDetails.userName,
                userEmail: userDetails.userEmail,
                displayName: userDetails.displayName,
                userMobile: userDetails.userMobile,
                userRoleId: userDetails.userRole,
                blockStatus: userDetails.blockStatus,
                userRole: RoleModel.roleName,
                roleName: RoleModel.roleName,
                userCode: userDetails.userCode,
                language: MechanicModel.language,
                referralCode: MechanicModel.referralCode,
                preferredRetailerId: MechanicModel.mappedRetailers,
                gender: MechanicModel.gender,
                age: MechanicModel.age,
                dob: MechanicModel.dob,
                workshopName: MechanicModel.workshopName,
                workshopId: MechanicModel.mappedRetailers,
                aadhaarNumber: MechanicModel.aadhaarNumber,
                profileUrl: MechanicModel.profileUrl,
                aadhaarProfileUrl: MechanicModel.aadhaarProfileUrl,
                aadhaarFrontUrl: MechanicModel.aadhaarFrontUrl,
                aadhaarBackUrl: MechanicModel.aadhaarBackUrl,
                panUrl: MechanicModel.panFrontUrl,
                panNumber: MechanicModel.panNumber,
                tdsSlabs: MechanicModel.tdsSlabs,
                kycApproval: MechanicModel.kycApproval,
                tdsAadhaarLinkage: MechanicModel.tdsAadhaarLinkage,
                tdsPanVerification: MechanicModel.tdsPanVerification,
                tdsITRVerification: MechanicModel.tdsITRVerification,
                tdsConsent: MechanicModel.tdsConsent,
                tier: MechanicModel.tier,

                earnedPoints: MechanicModel.earnedPoints,
                redeemedPoints: MechanicModel.redeemedPoints,
                balancePoints: MechanicModel.balancePoints,
                scannedPoints: MechanicModel.scannedPoints,
                bonusPoints: MechanicModel.bonusPoints,
                tdsKitty: MechanicModel.tdsKitty,
                tdsDeducted: MechanicModel.tdsDeducted,
                redeemablePoints: MechanicModel.redeemablePoints,
                pointConversion: sql`0`,

                currentAddress: AddressModel.currentAddress,
                workshopAddress: AddressModel.workshopAddress,
                currentCity: AddressModel.currentCity,
                currentDistrict: AddressModel.currentDistrict,
                currentPincode: AddressModel.currentPincode,
                currentState: AddressModel.currentState,
                zoneName: AddressModel.zoneName,

                lastLoginAt: userDetails.lastLoginAt,
                lastLogoutAt: userDetails.lastLogoutAt,
                fcmToken: userDetails.fcmToken,
                createdAt: userDetails.createdAt,
                createdBy: userDetails.createdBy,
                updatedAt: userDetails.updatedAt,
                updatedBy: userDetails.updatedBy,
                isPinSet: sql<boolean>`case when ${or(isNull(userDetails.pinHash), eq(userDetails.pinHash, ''))} then false else true end`.as("isPinSet"),
            })
            .from(userDetails)
            .leftJoin(
                MechanicModel,
                eq(MechanicModel.userId, userDetails.userId)
            )
            .leftJoin(
                AddressModel,
                eq(MechanicModel.userId, AddressModel.userId)
            )
            .leftJoin(RoleModel, eq(userDetails.userRole, RoleModel.roleId))
            .limit(1);

        if (!result?.userId) {
            throw new CustomError({
                responseMessage: "User not found",
                statusCode: 401,
            })
        }

        const shockReplacementDetails = await database.select()
            .from(SelectedShockReplacementModel)
            .where(
                and(
                    eq(SelectedShockReplacementModel.userId, result?.userId as number),
                    sql`date_trunc('month', ${SelectedShockReplacementModel.createdAt}) = date_trunc('month', now())`
                )
            )
            .limit(1)

        // const [isShockReplacement] = await database.select({
        //     isActive: ShockReplacementSkusModel.isActive,
        // }).from(ShockReplacementSkusModel).where(
        //     and(
        //         eq(ShockReplacementSkusModel.isActive, true),
        //     )
        // ).limit(1)

        if (!shockReplacementDetails?.length && result?.blockStatus == 'none') {
            (result as { isShockReplacement?: boolean }).isShockReplacement = true;
        } else {
            (result as { isShockReplacement?: boolean }).isShockReplacement = false;
        }

        const selectedRetailerId = Number(String(result?.preferredRetailerId || "").split(",")?.[0]);
        if (Number.isFinite(selectedRetailerId) && selectedRetailerId > 0) {
            const [selectedRetailer] = await database
                .select({
                    retailerId: RetailerModel.retailerId,
                    storeName: RetailerModel.storeName,
                    currentAddress: RetailerModel.currentAddress
                })
                .from(RetailerModel)
                .where(
                    and(
                        eq(RetailerModel.retailerId, selectedRetailerId),
                        eq(RetailerModel.isActive, true)
                    )
                )
                .limit(1);

            if (selectedRetailer?.retailerId) {
                (result as { preferredRetailerId: number | string }).preferredRetailerId = selectedRetailer.retailerId;
                result.workshopName = selectedRetailer.storeName || result.workshopName;
                result.workshopAddress = selectedRetailer.currentAddress || result.workshopAddress;
            } else {
                (result as { preferredRetailerId: number | string }).preferredRetailerId = selectedRetailerId;
            }
        }

        if (userRequest && result?.profileUrl) {
            result.profileUrl = result?.profileUrl ? await fileMiddleware.getFileSignedUrl(result?.profileUrl, "user-profile") : "";
            result.pointConversion = (await database.select({ points: PointConfigurationModel.points }).from(PointConfigurationModel).where(
                and(
                    eq(PointConfigurationModel.configType, "Point-Conversion"),
                    eq(PointConfigurationModel.isActive, true),
                )
            ))?.[0]?.points
        }

        return new UserDetails({
            ...result,
            isShockReplacement: (result as { isShockReplacement?: boolean }).isShockReplacement ?? false,
        })
    }

    async getUserDetailsByUserCode(userCode: string): Promise<UserDetails> {
        const userDetails = database
            .select()
            .from(UserModel)
            .where(eq(UserModel.userCode, userCode))
            .as("userDetails");

        const [result] = await database
            .select({
                userId: userDetails.userId,
                userName: userDetails.userName,
                userEmail: userDetails.userEmail,
                displayName: userDetails.displayName,
                userMobile: userDetails.userMobile,
                userRoleId: userDetails.userRole,
                blockStatus: userDetails.blockStatus,
                userRole: RoleModel.roleName,
                roleName: RoleModel.roleName,
                userCode: userDetails.userCode,
                language: MechanicModel.language,
                referralCode: MechanicModel.referralCode,
                gender: MechanicModel.gender,
                age: MechanicModel.age,
                workshopName: MechanicModel.workshopName,
                aadhaarNumber: MechanicModel.aadhaarNumber,
                profileUrl: MechanicModel.profileUrl,
                aadhaarProfileUrl: MechanicModel.aadhaarProfileUrl,
                aadhaarFrontUrl: MechanicModel.aadhaarFrontUrl,
                aadhaarBackUrl: MechanicModel.aadhaarBackUrl,
                panUrl: MechanicModel.panFrontUrl,
                panNumber: MechanicModel.panNumber,
                tdsSlabs: MechanicModel.tdsSlabs,
                kycApproval: MechanicModel.kycApproval,
                tdsAadhaarLinkage: MechanicModel.tdsAadhaarLinkage,
                tdsPanVerification: MechanicModel.tdsPanVerification,
                tdsITRVerification: MechanicModel.tdsITRVerification,
                tdsConsent: MechanicModel.tdsConsent,
                tier: MechanicModel.tier,

                earnedPoints: MechanicModel.earnedPoints,
                redeemedPoints: MechanicModel.redeemedPoints,
                balancePoints: MechanicModel.balancePoints,
                scannedPoints: MechanicModel.scannedPoints,
                bonusPoints: MechanicModel.bonusPoints,
                tdsKitty: MechanicModel.tdsKitty,

                currentAddress: AddressModel.currentAddress,
                workshopAddress: AddressModel.workshopAddress,
                currentCity: AddressModel.currentCity,
                currentDistrict: AddressModel.currentDistrict,
                currentPincode: AddressModel.currentPincode,
                currentState: AddressModel.currentState,
                zoneName: AddressModel.zoneName,

                lastLoginAt: userDetails.lastLoginAt,
                lastLogoutAt: userDetails.lastLogoutAt,
                fcmToken: userDetails.fcmToken,
                createdAt: userDetails.createdAt,
                createdBy: userDetails.createdBy,
                updatedAt: userDetails.updatedAt,
                updatedBy: userDetails.updatedBy,
            })
            .from(userDetails)
            .leftJoin(
                MechanicModel,
                eq(MechanicModel.userId, userDetails.userId)
            )
            .leftJoin(
                AddressModel,
                eq(MechanicModel.userId, AddressModel.userId)
            )
            .leftJoin(RoleModel, eq(userDetails.userRole, RoleModel.roleId))
            .limit(1);

        if (!result?.userId) {
            throw new CustomError({
                responseMessage: "User not found",
                statusCode: 401,
            })
        }

        if (result?.profileUrl) {
            result.profileUrl = await fileMiddleware.getFileSignedUrl(result?.profileUrl, "user-profile");
        }

        return new UserDetails(result)
    }

    async getUserDetailsByUserId(userId: number): Promise<UserDetails> {
        const userDetails = database
            .select()
            .from(UserModel)
            .where(eq(UserModel.userId, userId))
            .as("userDetails");

        const [result] = await database
            .select({
                userId: userDetails.userId,
                userName: userDetails.userName,
                userEmail: userDetails.userEmail,
                displayName: userDetails.displayName,
                userMobile: userDetails.userMobile,
                userRoleId: userDetails.userRole,
                blockStatus: userDetails.blockStatus,
                userRole: RoleModel.roleName,
                roleName: RoleModel.roleName,
                userCode: userDetails.userCode,
                language: MechanicModel.language,
                referralCode: MechanicModel.referralCode,
                gender: MechanicModel.gender,
                age: MechanicModel.age,
                workshopName: MechanicModel.workshopName,
                aadhaarNumber: MechanicModel.aadhaarNumber,
                profileUrl: MechanicModel.profileUrl,
                aadhaarProfileUrl: MechanicModel.aadhaarProfileUrl,
                aadhaarFrontUrl: MechanicModel.aadhaarFrontUrl,
                aadhaarBackUrl: MechanicModel.aadhaarBackUrl,
                panUrl: MechanicModel.panFrontUrl,
                panNumber: MechanicModel.panNumber,
                tdsSlabs: MechanicModel.tdsSlabs,
                kycApproval: MechanicModel.kycApproval,
                tdsAadhaarLinkage: MechanicModel.tdsAadhaarLinkage,
                tdsPanVerification: MechanicModel.tdsPanVerification,
                tdsITRVerification: MechanicModel.tdsITRVerification,
                tdsConsent: MechanicModel.tdsConsent,
                tier: MechanicModel.tier,

                earnedPoints: MechanicModel.earnedPoints,
                redeemedPoints: MechanicModel.redeemedPoints,
                balancePoints: MechanicModel.balancePoints,
                scannedPoints: MechanicModel.scannedPoints,
                bonusPoints: MechanicModel.bonusPoints,
                tdsKitty: MechanicModel.tdsKitty,

                currentAddress: AddressModel.currentAddress,
                workshopAddress: AddressModel.workshopAddress,
                currentCity: AddressModel.currentCity,
                currentDistrict: AddressModel.currentDistrict,
                currentPincode: AddressModel.currentPincode,
                currentState: AddressModel.currentState,
                zoneName: AddressModel.zoneName,

                lastLoginAt: userDetails.lastLoginAt,
                lastLogoutAt: userDetails.lastLogoutAt,
                fcmToken: userDetails.fcmToken,
                createdAt: userDetails.createdAt,
                createdBy: userDetails.createdBy,
                updatedAt: userDetails.updatedAt,
                updatedBy: userDetails.updatedBy,
            })
            .from(userDetails)
            .leftJoin(
                MechanicModel,
                eq(MechanicModel.userId, userDetails.userId)
            )
            .leftJoin(
                AddressModel,
                eq(MechanicModel.userId, AddressModel.userId)
            )
            .leftJoin(RoleModel, eq(userDetails.userRole, RoleModel.roleId))
            .limit(1);

        if (!result?.userId) {
            throw new CustomError({
                responseMessage: "User not found",
                statusCode: 401,
            })
        }

        if (result?.profileUrl) {
            result.profileUrl = await fileMiddleware.getFileSignedUrl(result?.profileUrl, "user-profile");
        }

        return new UserDetails(result)
    }

    async setNewPassword(resetPwdPayload: ResetPassword) {
        const [result] = await database
            .select({
                userPassword: UserModel.userPassword,
                userId: UserModel.userId,
            })
            .from(UserModel)
            .where(eq(UserModel.userMobile, resetPwdPayload.mobile));

        const previousPassword = await compareHash({
            hashedValue: result.userPassword || "",
            originalValue: resetPwdPayload.passwordRaw,
        });

        if (previousPassword) {
            this.customError.responseMessage =
                "Old Password and New Password cannot be the same";
            this.customError.responseCode = 400;
            throw this.customError;
        }
        await database
            .update(UserModel)
            .set({
                userPassword: resetPwdPayload.password,
                updatedAt: new Date(),
            })
            .where(eq(UserModel.userId, result.userId));

        if (resetPwdPayload?.type != "reset") {
            await database
                .update(OtpModel)
                .set({
                    expiryAt: new Date(),
                    isVerified: true,
                    otpAttempt: 0,
                })
                .where(and(eq(OtpModel.userId, result.userId)));
        }
    }

    async getRecentOtp(payload: UserSearch, filter: string) {
        const userTable = database.$with("userTable").as(
            database
                .select()
                .from(UserModel)
                .where(
                    or(
                        eq(UserModel.userMobile, payload.mobile),
                        eq(UserModel.userId, payload.userId),
                        eq(UserModel.userCode, payload.userCode)
                    )
                )
        );

        const otpTable = database.select().from(OtpModel).as("otpTable");

        const [data] = await database
            .with(userTable)
            .select()
            .from(userTable)
            .where(
                filter == "active"
                    ? and(
                        eq(otpTable.isVerified, false),
                        gt(otpTable.expiryAt, new Date()),
                        gte(otpTable.otpAttempt, 1)
                    )
                    : gt(otpTable.expiryAt, new Date())
            )
            .leftJoin(otpTable, eq(userTable.userId, otpTable.userId))
            .orderBy(desc(otpTable.createdAt)) // order by is mandatory
            .limit(1);

        return data;
    }

    async insertOtp(payload: OtpInsert) {
        const { userMobile, otp, expiryAt, createdAt } = payload;

        const [userData] = await database
            .select()
            .from(UserModel)
            .where(eq(UserModel.userMobile, userMobile));

        if (!userData) {
            this.customError.responseCode = 404;
            this.customError.responseMessage = "User not found";
            throw this.customError;
        }

        await database
            .update(OtpModel)
            .set({ expiryAt: new Date() })
            .where(
                and(
                    eq(OtpModel.userId, userData.userId),
                    gt(OtpModel.expiryAt, new Date())
                )
            );

        await database.insert(OtpModel).values({
            otp: otp,
            userId: userData?.userId,
            expiryAt,
            createdAt,
        });
    }

    async updateOtp(payload: any, type: string) {
        await database
            .update(OtpModel)
            .set(
                type == "verified"
                    ? { isVerified: true }
                    : type == "expired"
                        ? { expiryAt: new Date() }
                        : {
                            otpAttempt:
                                Number(payload.otpAttempt || 0) > 0
                                    ? Number(payload?.otpAttempt) - 1
                                    : 0,
                        }
            )
            .where(and(eq(OtpModel.otp, payload?.otp)));
    }

    async getPincodeDetails(pincode: number) {
        const [res] = await database.select()
            .from(PincodeModel)
            .where(
                and(
                    eq(PincodeModel.pincode, pincode),
                    eq(PincodeModel.isActive, true)
                )
            )
        return res;
    }

    async updateUserProfile(payload: UserProfileUpdate, userDetails: UserDetails) {
        return await database.transaction(async (tran) => { // get approval for update profile

            if (payload?.referralCode) {
                await this.insertReferral(payload, userDetails, tran);
            }

            const [userData] = await tran.update(UserModel).set({
                userName: payload?.userName,
                blockStatus: "kyc-admin"
            }).where(
                and(
                    eq(UserModel.userId, userDetails.userId)
                )
            ).returning(getTableColumns(UserModel))

            await tran.update(MechanicModel).set({
                gender: (payload?.gender as typeof genderEnum.enumValues[number]) || null,
                age: Number(payload?.age) ? Number(payload?.age) : null,
                workshopName: payload?.workshopName || userDetails.workshopName || null,
                profileUrl: payload?.userProfile || payload?.userProfile || null,
                dob: payload?.dob,
            }).where(
                and(
                    eq(MechanicModel.userId, userDetails.userId)
                )
            )

            const [pincodeDetails] = await tran.select()
                .from(PincodeModel)
                .where(
                    eq(PincodeModel.pincode, payload?.currentPincode as number)
                )
                .limit(1)

            await tran.update(AddressModel).set({
                currentAddress: payload?.currentAddress as string,
                workshopAddress: payload?.workshopAddress as string,
                currentCity: pincodeDetails?.cityName,
                currentDistrict: pincodeDetails?.districtName,
                currentPincode: pincodeDetails?.pincode,
                currentState: pincodeDetails?.stateName,
                zoneName: pincodeDetails?.zoneName || ""
            }).where(
                and(
                    eq(AddressModel.userId, userDetails.userId)
                )
            )

            return userData;
        })
    }

    async insertReferral(payload: UserProfileUpdate, userDetails: UserDetails, tran: Parameters<Parameters<typeof database.transaction>[0]>[0]) {

        if (userDetails?.blockStatus != "incomplete-registration") {
            this.customError.responseMessage = "Referral cannot be done at this moment";
            this.customError.responseCode = 400;
            throw this.customError;
        }

        const [referralDetails] = await tran.select().from(MechanicModel).where(
            and(
                eq(MechanicModel.referralCode, payload?.referralCode)
            )
        )

        if (!referralDetails?.referralCode) {
            this.customError.responseMessage = "Referral code doesn't exist";
            this.customError.responseCode = 400;
            throw this.customError;
        }

        if (!referralDetails?.kycApproval) {
            this.customError.responseMessage = "Referral code cannot be used since referred user is not verified";
            this.customError.responseCode = 400;
            throw this.customError;
        }

        const configuredPoints = await tran
            .select()
            .from(PointConfigurationModel)
            .where(
                and(
                    eq(PointConfigurationModel.isActive, true),
                    inArray(PointConfigurationModel.configType, ["Referee", "Referrer"])
                )
            )

        const REFERRER_POINTS = Number(configuredPoints?.find((ele) => ele?.configType == "Referrer")?.points || 0) || 0;
        const REFEREE_POINTS = Number(configuredPoints?.find((ele) => ele?.configType == "Referee")?.points || 0) || 0;

        await tran.insert(ReferralModel).values({
            referralCode: payload?.referralCode,
            referrerPoints: String(REFERRER_POINTS),
            referrerUserId: referralDetails?.userId,
            refereePoints: String(REFEREE_POINTS),
            refereeUserId: userDetails?.userId,
        })

    }

    async raiseTicket(payload: TicketPayload, userDetails: UserDetails) {
        return await database.transaction(async (tran) => {
            const [ticketDetails] = await tran.select().from(TicketCategoryModel).where(
                and(
                    eq(TicketCategoryModel.ticketId, payload?.ticketId as number)
                )
            );

            const userIdToUse = Number(payload?.userId ?? userDetails?.userId);

            const [insertTicket] = await tran.insert(TicketModel).values({
                ticketCategoryId: ticketDetails?.ticketId,
                ticketStatus: "Pending",
                ticketRef: generateRandomToken(),
                description: payload?.description,
                imgUrl: payload?.fileUrl || null,
                userId: userIdToUse,
                createdBy: userDetails?.userId,
                roleAssigned: 3
            }).returning(getTableColumns(TicketModel));

            await tran.insert(TicketTrailModel).values({
                assignedRole: ROLES.CALL_CENTRE_EXECUTIVE,
                ticketId: insertTicket?.ticketId,
                remarks: insertTicket?.description,
                ticketStatus: insertTicket?.ticketStatus,
                createdBy: insertTicket?.createdBy
            }).returning(getTableColumns(TicketTrailModel));

            return insertTicket?.ticketRef
        })
    }


    async getAccountDetails(type: "upi" | "bank" | "both", userDetails: UserDetails) {

        const userTable = database
            .select()
            .from(UserModel)
            .where(eq(UserModel.userId, userDetails.userId))
            .as("userTable");

        const [result] = await database
            .select({
                isBank: MechanicModel.bankDetailsFlag,
                isUpi: MechanicModel.upiFlag,
            })
            .from(userTable)
            .leftJoin(MechanicModel, eq(userTable.userId, MechanicModel.userId))

        const [userData] = await database
            .select()
            .from(UserModel)
            .where(eq(UserModel.userId, userDetails.userId));

        if ((type == "both" || type == "upi") && !result.isUpi) {
            await userController.updateAccountDetails(userData, "upi");
        }

        if ((type == "both" || type == "bank") && !result.isBank) {
            await userController.updateAccountDetails(userData, "bank");
        }

        if (type == "upi") {
            let upiDetails = await database
                .select({
                    upiId: AccountDetailModel.upiId,
                })
                .from(AccountDetailModel)
                .where(
                    and(
                        eq(AccountDetailModel.userId, userDetails.userId),
                        eq(AccountDetailModel.isActive, true),
                        isNotNull(AccountDetailModel.upiId)
                    )
                );
            return upiDetails?.map((ele) => ele?.upiId) as string[];
        }
        if (type == "bank") {
            let bankDetails = await database
                .select({
                    accountHolderName: AccountDetailModel.accountHolderName,
                    accountNumber: AccountDetailModel.accountNumber,
                    accountIfsc: AccountDetailModel.accountIfsc,
                    accountType: AccountDetailModel.accountType,
                    bankBranch: AccountDetailModel.bankBranch,
                    bankName: AccountDetailModel.bankName,
                })
                .from(AccountDetailModel)
                .where(
                    and(
                        eq(AccountDetailModel.userId, userDetails.userId),
                        eq(AccountDetailModel.isActive, true),
                        isNotNull(AccountDetailModel.accountNumber)
                    )
                );

            return bankDetails;
        }
        if (type == "both") {
            this.customError.responseMessage = "Accounts has been updated successfully"; // type can bank or upi, both returned in above section. error will be thrown, if type not in (bank,upi)
            throw this.customError;
        }
        this.customError.responseMessage = "Invalid type, unreachable"; // type can bank or upi, both returned in above section. error will be thrown, if type not in (bank,upi)
        throw this.customError;
    }

    async updateUpiDetails(
        upiList: string[],
        insertedData:
            | InferInsertModel<typeof UserModel>
            | InferSelectModel<typeof UserModel>
    ) {
        await database.transaction(async (tran) => {

            await tran
                .update(AccountDetailModel)
                .set({ isActive: false })
                .where(
                    and(
                        eq(AccountDetailModel.userId, insertedData?.userId as number),
                        eq(AccountDetailModel.isActive, true),
                        isNotNull(AccountDetailModel.upiId)
                    )
                )

            await tran.insert(AccountDetailModel).values(
                upiList?.map((ele) => ({
                    upiId: ele,
                    upiFlag: true,
                    userId: insertedData.userId,
                }))
            );

            await tran.update(MechanicModel).set({
                upiFlag: true,
            })
                .where(eq(MechanicModel.userId, insertedData?.userId as number))
        })

    }
    async updateBankDetails(
        bankDetails: TenacioMobileToBankData,
        insertedData:
            | InferInsertModel<typeof UserModel>
            | InferSelectModel<typeof UserModel>
    ) {
        await database.transaction(async (tran) => {

            await tran
                .update(AccountDetailModel)
                .set({ isActive: false })
                .where(
                    and(
                        eq(AccountDetailModel.userId, insertedData?.userId as number),
                        eq(AccountDetailModel.isActive, true),
                        isNotNull(AccountDetailModel.accountNumber)
                    )
                )
            await tran.insert(AccountDetailModel).values({
                accountHolderName: bankDetails?.nameAtBank || null,
                accountIfsc: bankDetails?.ifsc || null,
                accountNumber: bankDetails?.accountNumber || null,
                bankBranch: bankDetails?.ifscDetails?.branch || null,
                bankFlag: true,
                bankName: bankDetails?.ifscDetails?.bankName || null,
                userId: insertedData?.userId || null,
            });

            await tran.update(MechanicModel).set({
                bankDetailsFlag: true,
            })
                .where(eq(MechanicModel.userId, insertedData?.userId as number))
        })
    }

    async assignTicketToRole(payload: assignTicket[], updatedBy: number) {
        if (!payload || !Array.isArray(payload) || payload.length === 0) {
            this.customError.responseMessage = "Please provide ticket assignment details";
            throw this.customError;
        }

        for (const item of payload) {
            if (!item.roleId) {
                this.customError.responseMessage = "Role ID is missing in ticket payload";
                throw this.customError;
            }

            if (!item.ticketId) {
                this.customError.responseMessage = "Ticket ID is missing in ticket payload";
                throw this.customError;
            }
        }

        return await database.transaction(async (tran) => {
            const updatedTickets: any[] = [];

            for (const item of payload) {

                // ✅ Step 1 — Check if role exists & active
                const [roleData] = await tran
                    .select()
                    .from(RoleModel)
                    .where(
                        and(
                            eq(RoleModel.roleId, item.roleId),
                            eq(RoleModel.isActive, true)
                        )
                    )
                    .limit(1);

                if (!roleData) {
                    this.customError.responseMessage = `Invalid or inactive role ID: ${item.roleId}`;
                    throw this.customError;
                }

                // ✅ Step 2 — Check ticket exists and status is not Resolved
                const [ticketData] = await tran
                    .select()
                    .from(TicketModel)
                    .where(eq(TicketModel.ticketId, item.ticketId))
                    .limit(1);

                if (!ticketData) {
                    this.customError.responseMessage = `Invalid ticket ID: ${item.ticketId}`;
                    throw this.customError;
                }

                if (ticketData.ticketStatus === "Resolved") {
                    this.customError.responseMessage = `Ticket ${item.ticketId} is already resolved and cannot be reassigned`;
                    throw this.customError;
                }

                // ✅ Step 3 — Update roleAssigned
                const [updated] = await tran
                    .update(TicketModel)
                    .set({
                        roleAssigned: item.roleId,
                    })
                    .where(eq(TicketModel.ticketId, item.ticketId))
                    .returning(getTableColumns(TicketModel));

                // ✅ Step 4 — Push to trail table
                await tran.insert(TicketTrailModel).values({
                    assignedRole: item.roleId,
                    ticketId: item.ticketId,
                    remarks: `Ticket assigned to role ${item.roleId}`,
                    ticketStatus: updated.ticketStatus,
                    createdBy: updatedBy,
                });

                updatedTickets.push(updated);
            }

            return updatedTickets;
        });
    }

    async resolveTickets(
        payload: { ticketId: number; resolvedComments: string }[],
        resolvedBy: number
    ) {
        if (!payload || !Array.isArray(payload) || payload.length === 0) {
            this.customError.responseMessage = "Please provide ticket resolution details";
            throw this.customError;
        }

        for (const item of payload) {
            if (!item.ticketId) {
                this.customError.responseMessage = "Ticket ID is missing in payload";
                throw this.customError;
            }

            if (!item.resolvedComments || item.resolvedComments.trim().length === 0) {
                this.customError.responseMessage = `Resolved comments are required for ticket ID: ${item.ticketId}`;
                throw this.customError;
            }
        }

        return await database.transaction(async (tran) => {
            const resolvedTickets: any[] = [];

            for (const item of payload) {
                // ✅ Step 1 — Validate Ticket
                const [ticketData] = await tran
                    .select()
                    .from(TicketModel)
                    .where(eq(TicketModel.ticketId, item.ticketId))
                    .limit(1);

                if (!ticketData) {
                    this.customError.responseMessage = `Invalid ticket ID: ${item.ticketId}`;
                    throw this.customError;
                }

                if (!ticketData.isActive) {
                    this.customError.responseMessage = `Ticket ${item.ticketId} is inactive`;
                    throw this.customError;
                }

                if (ticketData.ticketStatus === "Resolved") {
                    this.customError.responseMessage = `Ticket ${item.ticketId} is already resolved`;
                    throw this.customError;
                }

                // ✅ Step 2 — Update Ticket as Resolved
                const [updatedTicket] = await tran
                    .update(TicketModel)
                    .set({
                        ticketStatus: "Resolved",
                        resolvedComments: item.resolvedComments,
                    })
                    .where(eq(TicketModel.ticketId, item.ticketId))
                    .returning(getTableColumns(TicketModel));

                // ✅ Step 3 — Insert Trail Entry
                await tran.insert(TicketTrailModel).values({
                    ticketId: item.ticketId,
                    assignedRole: ticketData.roleAssigned,
                    remarks: item.resolvedComments,
                    ticketStatus: "Resolved",
                    createdBy: resolvedBy,
                });

                resolvedTickets.push(updatedTicket);
            }

            return resolvedTickets;
        });
    }

    async userCount(filters: { status?: string; role?: number[] } = {}) {
        const { status, role } = filters;

        const conditions: SQL[] = [];

        if (status) {
            conditions.push(eq(UserModel.blockStatus, status as any));
        }

        if (role && Array.isArray(role) && role.length > 0) {
            conditions.push(inArray(UserModel.userRole, role));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [result] = await database
            .select({ count: sql<number>`COUNT(*)` })
            .from(UserModel)
            .where(whereClause);

        return { count: Number(result?.count ?? 0) };
    }


    // async listUsers(filters: {
    //     status?: string;
    //     role?: number[];
    //     search?: string;
    //     page?: number;
    //     limit?: number;
    // } = {}) {
    //     const { status, role, search, page = 1, limit = 20 } = filters;

    //     const conditions: SQL[] = [];

    //     // STATUS FILTER
    //     if (status) {
    //         conditions.push(eq(UserModel.blockStatus, status as any));
    //     }

    //     // ROLE FILTER
    //     if (Array.isArray(role) && role.length > 0) {
    //         conditions.push(inArray(UserModel.userRole, role));
    //     }

    //     // SEARCH CONDITION
    //     let searchCondition: SQL | undefined;

    //     if (typeof search === "string" && search.trim().length > 0) {
    //         searchCondition = or(
    //             ilike(UserModel.userName, `%${search}%`),
    //             ilike(UserModel.userEmail, `%${search}%`),
    //             ilike(UserModel.userMobile, `%${search}%`)
    //         );
    //     }

    //     if (searchCondition !== undefined) {
    //         conditions.push(searchCondition);
    //     }

    //     const whereClause: SQL | undefined =
    //         conditions.length > 0 ? and(...conditions) : undefined;

    //     const offset = (page - 1) * limit;

    //     // IMPORTANT: Drizzle type workaround
    //     let query: any = database
    //         .select({
    //             userId: UserModel.userId,
    //             userName: UserModel.userName,
    //             userEmail: UserModel.userEmail,
    //             userMobile: UserModel.userMobile,
    //             blockStatus: UserModel.blockStatus,
    //             createdAt: UserModel.createdAt,
    //             displayName: UserModel.displayName,
    //             mechanicId: MechanicModel.mechanicId,
    //             workshopName: MechanicModel.workshopName,
    //             gender: MechanicModel.gender,
    //             tier: MechanicModel.tier,

    //             adminId: AdminModel.adminId,
    //             department: AdminModel.department,

    //             userRole: RoleModel.roleName,

    //             lastLoginAt: UserModel.lastLoginAt,
    //             lastLogoutAt: UserModel.lastLogoutAt,
    //         })
    //         .from(UserModel)
    //         .leftJoin(MechanicModel, eq(UserModel.userId, MechanicModel.userId))
    //         .leftJoin(AdminModel, eq(UserModel.userId, AdminModel.userId))
    //         .leftJoin(RoleModel, eq(UserModel.userRole, RoleModel.roleId));

    //     if (whereClause !== undefined) {
    //         query = query.where(whereClause);
    //     }

    //     query = query.orderBy(UserModel.userId).limit(limit).offset(offset);

    //     const rows = await query;

    //     // -----------------------------------------
    //     // ⭐ COMPUTE THE STATUS FIELD
    //     // -----------------------------------------
    //     const users = rows.map((u: any) => ({
    //         ...u,
    //         status: u.blockStatus === "none" ? "active" : u.blockStatus,
    //     }));

    //     return {
    //         page,
    //         limit,
    //         count: users.length,
    //         data: users,
    //     };
    // }

    async listUsers(filters: {
        status?: string;
        role?: number[];
        search?: string;
        page?: number;
        limit?: number;
    } = {}) {

        const { status, role, search, page = 1, limit = 20 } = filters;

        // --------------------------------------------------------
        // CONDITIONS (STRICT: NEVER undefined)
        // --------------------------------------------------------
        const conditions: SQL[] = [];

        // STATUS FILTER
        if (status) {
            conditions.push(eq(UserModel.blockStatus, status as any));
        }

        // ROLE FILTER
        if (Array.isArray(role) && role.length > 0) {
            conditions.push(inArray(UserModel.userRole, role));
        }

        // SEARCH FILTER — FIXED using ! to avoid undefined
        if (typeof search === "string" && search.trim() !== "") {
            conditions.push(
                or(
                    ilike(UserModel.userName, `%${search}%`),
                    ilike(UserModel.userEmail, `%${search}%`),
                    ilike(UserModel.userMobile, `%${search}%`)
                )!   // ← THIS FIXES THE ERROR
            );
        }

        // WHERE CLAUSE
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const offset = (page - 1) * limit;

        // --------------------------------------------------------
        // 🧮 1️⃣ TOTAL COUNT QUERY (with filters)
        // --------------------------------------------------------
        let countQuery: any = database
            .select({
                count: sql`COUNT(*)`.mapWith(Number)
            })
            .from(UserModel)
            .leftJoin(MechanicModel, eq(UserModel.userId, MechanicModel.userId))
            .leftJoin(AdminModel, eq(UserModel.userId, AdminModel.userId))
            .leftJoin(RoleModel, eq(UserModel.userRole, RoleModel.roleId));

        if (whereClause) {
            countQuery = countQuery.where(whereClause);
        }

        const totalRecords = (await countQuery)[0].count;
        const totalPages = Math.ceil(totalRecords / limit);

        // If no records, return empty paginated result
        if (totalRecords === 0) {
            return {
                page,
                limit,
                totalRecords,
                totalPages,
                count: 0,
                data: []
            };
        }

        // --------------------------------------------------------
        // 📄 2️⃣ MAIN PAGINATED QUERY
        // --------------------------------------------------------
        let query: any = database
            .select({
                userId: UserModel.userId,
                userName: UserModel.userName,
                userEmail: UserModel.userEmail,
                userMobile: UserModel.userMobile,
                blockStatus: UserModel.blockStatus,
                createdAt: UserModel.createdAt,
                displayName: UserModel.displayName,
                mechanicId: MechanicModel.mechanicId,
                workshopName: MechanicModel.workshopName,
                gender: MechanicModel.gender,
                tier: MechanicModel.tier,

                adminId: AdminModel.adminId,
                department: AdminModel.department,

                userRole: RoleModel.roleName,

                lastLoginAt: UserModel.lastLoginAt,
                lastLogoutAt: UserModel.lastLogoutAt,
            })
            .from(UserModel)
            .leftJoin(MechanicModel, eq(UserModel.userId, MechanicModel.userId))
            .leftJoin(AdminModel, eq(UserModel.userId, AdminModel.userId))
            .leftJoin(RoleModel, eq(UserModel.userRole, RoleModel.roleId));

        if (whereClause) {
            query = query.where(whereClause);
        }

        query = query.orderBy(UserModel.userId).limit(limit).offset(offset);

        const rows = await query;

        // --------------------------------------------------------
        // ⭐ 3️⃣ COMPUTE STATUS FIELD
        // --------------------------------------------------------
        const users = rows.map((u: any) => ({
            ...u,
            status: u.blockStatus === "none" ? "active" : u.blockStatus
        }));

        // --------------------------------------------------------
        // 📦 4️⃣ FINAL PAGINATED RESPONSE
        // --------------------------------------------------------
        return {
            page,
            limit,
            totalRecords,
            totalPages,
            count: users.length,
            data: users
        };
    }


    async deactivateUser(userId: number, updatedBy: number) {
        // Step 1: Check user existence
        const [user] = await database
            .select()
            .from(UserModel)
            .where(eq(UserModel.userId, userId))
            .limit(1);

        if (!user) {
            throw new Error(`User with ID ${userId} does not exist`);
        }

        // Step 2: Update blockStatus to "de-activated"
        const [updatedUser] = await database
            .update(UserModel)
            .set({
                blockStatus: "de-activated",   // your enum value
                updatedAt: new Date(),
                updatedBy: updatedBy,
            })
            .where(eq(UserModel.userId, userId))
            .returning({
                userId: UserModel.userId,
                userName: UserModel.userName,
                blockStatus: UserModel.blockStatus,
                updatedAt: UserModel.updatedAt,
            });

        return updatedUser;
    }

    async activateUser(userId: number, updatedBy: number) {

        // Step 1: Validate user exists
        const [user] = await database
            .select()
            .from(UserModel)
            .where(eq(UserModel.userId, userId))
            .limit(1);

        if (!user) {
            throw new Error(`User with ID ${userId} does not exist`);
        }

        // Step 2: Update blockStatus → none (Active)
        const [updatedUser] = await database
            .update(UserModel)
            .set({
                blockStatus: "none",     // means ACTIVE
                updatedAt: new Date(),
                updatedBy: updatedBy,
            })
            .where(eq(UserModel.userId, userId))
            .returning({
                userId: UserModel.userId,
                userName: UserModel.userName,
                blockStatus: UserModel.blockStatus,
                updatedAt: UserModel.updatedAt,
            });

        return updatedUser;
    }

    async updateLastLoginTime(userId: number, fcmToken: string) {
        // Check user exists
        const [user] = await database
            .select()
            .from(UserModel)
            .where(eq(UserModel.userId, userId))
            .limit(1);

        if (!user) {
            throw new Error(`User with ID ${userId} does not exist`);
        }

        // Update login timestamp
        const [updatedUser] = await database
            .update(UserModel)
            .set({
                lastLoginAt: new Date(),
                fcmToken: fcmToken,
            })
            .where(eq(UserModel.userId, userId))
            .returning({
                userId: UserModel.userId,
                userName: UserModel.userName,
                lastLoginAt: UserModel.lastLoginAt,
            });

        return updatedUser;
    }

    async updateLastLogoutTime(userId: number) {
        // Check user exists
        const [user] = await database
            .select()
            .from(UserModel)
            .where(eq(UserModel.userId, userId))
            .limit(1);

        if (!user) {
            throw new Error(`User with ID ${userId} does not exist`);
        }

        // Update logout timestamp
        const [updatedUser] = await database
            .update(UserModel)
            .set({
                lastLogoutAt: new Date(),
                updatedAt: new Date()
            })
            .where(eq(UserModel.userId, userId))
            .returning({
                userId: UserModel.userId,
                userName: UserModel.userName,
                lastLogoutAt: UserModel.lastLogoutAt,
            });

        return updatedUser;
    }

    async logActivity(userId: number, activityType: "login" | "logout") {
        // Step 1: Validate user exists
        const [user] = await database
            .select()
            .from(UserModel)
            .where(eq(UserModel.userId, userId))
            .limit(1);

        if (!user) {
            throw new Error(`User with ID ${userId} does not exist`);
        }

        // Step 2: Insert the activity log
        const [log] = await database
            .insert(ActivityLogModel)
            .values({
                userId: userId,
                activityType: activityType,
                createdBy: userId,          // user performing the action
            })
            .returning({
                logId: ActivityLogModel.logId,
                activityType: ActivityLogModel.activityType,
                userId: ActivityLogModel.userId,
                createdAt: ActivityLogModel.createdAt,
            });
        return log;
    }

    // async listActivityLogs(filters: {
    //     activityType?: "login" | "logout";
    //     userId?: number;
    //     fromDate?: string;
    //     toDate?: string;
    //     search?: string;
    //     page?: number;
    //     limit?: number;
    // } = {}) {

    //     const { activityType, userId, fromDate, toDate, search, page = 1, limit = 20 } = filters;

    //     const conditions: SQL[] = [];

    //     // FILTER: activity type
    //     if (activityType) {
    //         conditions.push(eq(ActivityLogModel.activityType, activityType));
    //     }

    //     // FILTER: userId
    //     if (userId) {
    //         conditions.push(eq(ActivityLogModel.userId, userId));
    //     }

    //     // FILTER: Date Range
    //     if (fromDate) {
    //         conditions.push(gte(ActivityLogModel.createdAt, new Date(fromDate)));
    //     }

    //     if (toDate) {
    //         conditions.push(lte(ActivityLogModel.createdAt, new Date(toDate)));
    //     }

    //     // ----------------------------
    //     // FIXED SEARCH CONDITION
    //     // ----------------------------
    //     let searchCondition: SQL | undefined = undefined;

    //     if (search && search.trim().length > 0) {
    //         searchCondition = or(
    //             ilike(UserModel.userName, `%${search}%`),
    //             ilike(UserModel.userEmail, `%${search}%`),
    //             ilike(UserModel.userMobile, `%${search}%`)
    //         );
    //     }

    //     if (searchCondition !== undefined) {
    //         conditions.push(searchCondition);
    //     }

    //     // WHERE CLAUSE (undefined allowed)
    //     const whereClause: SQL | undefined =
    //         conditions.length > 0 ? and(...conditions) : undefined;

    //     const offset = (page - 1) * limit;

    //     // QUERY
    //     let query: any = database
    //         .select({
    //             logId: ActivityLogModel.logId,
    //             activityType: ActivityLogModel.activityType,
    //             userId: ActivityLogModel.userId,
    //             createdAt: ActivityLogModel.createdAt,

    //             userName: UserModel.userName,
    //             userEmail: UserModel.userEmail,
    //             userMobile: UserModel.userMobile,
    //             userRole: UserModel.userRole,
    //             lastLoginAt: UserModel.lastLoginAt,
    //             lastLogoutAt: UserModel.lastLogoutAt,
    //         })
    //         .from(ActivityLogModel)
    //         .leftJoin(UserModel, eq(ActivityLogModel.userId, UserModel.userId));

    //     if (whereClause !== undefined) {
    //         query = query.where(whereClause);
    //     }

    //     query = query.orderBy(desc(ActivityLogModel.createdAt)).limit(limit).offset(offset);

    //     const rows = await query;

    //     return {
    //         page,
    //         limit,
    //         count: rows.length,
    //         data: rows,
    //     };
    // }

    async listActivityLogs(filters: {
        activityType?: "login" | "logout";
        userId?: number;
        fromDate?: string;
        toDate?: string;
        search?: string;
        page?: number;
        limit?: number;
    } = {}) {

        const { activityType, userId, fromDate, toDate, search, page = 1, limit = 20 } = filters;

        // ----------------------------------------------------
        // CONDITIONS ARRAY — STRICTLY SQL ONLY, NEVER undefined
        // ----------------------------------------------------
        const conditions: SQL[] = [];

        if (activityType) {
            conditions.push(eq(ActivityLogModel.activityType, activityType));
        }

        if (userId) {
            conditions.push(eq(ActivityLogModel.userId, userId));
        }

        if (fromDate) {
            conditions.push(gte(ActivityLogModel.createdAt, new Date(fromDate)));
        }

        if (toDate) {
            conditions.push(lte(ActivityLogModel.createdAt, new Date(toDate)));
        }

        // ✅ FIXED: Direct push (no undefined)
        if (search && search.trim() !== "") {
            conditions.push(
                or(
                    ilike(UserModel.userName, `%${search}%`),
                    ilike(UserModel.userEmail, `%${search}%`),
                    ilike(UserModel.userMobile, `%${search}%`)
                )!
            );
        }

        // FINAL WHERE CLAUSE
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const offset = (page - 1) * limit;

        // ----------------------------------------------------
        // COUNT QUERY
        // ----------------------------------------------------
        let countQuery: any = database
            .select({
                count: sql`COUNT(*)`.mapWith(Number)
            })
            .from(ActivityLogModel)
            .leftJoin(UserModel, eq(ActivityLogModel.userId, UserModel.userId));

        if (whereClause) {
            countQuery = countQuery.where(whereClause);
        }

        const totalRecords = (await countQuery)[0].count;
        const totalPages = Math.ceil(totalRecords / limit);

        // ----------------------------------------------------
        // MAIN QUERY
        // ----------------------------------------------------
        let query: any = database
            .select({
                logId: ActivityLogModel.logId,
                activityType: ActivityLogModel.activityType,
                userId: ActivityLogModel.userId,
                createdAt: ActivityLogModel.createdAt,

                userName: UserModel.userName,
                userEmail: UserModel.userEmail,
                userMobile: UserModel.userMobile,
                userRole: UserModel.userRole,
                lastLoginAt: UserModel.lastLoginAt,
                lastLogoutAt: UserModel.lastLogoutAt,
            })
            .from(ActivityLogModel)
            .leftJoin(UserModel, eq(ActivityLogModel.userId, UserModel.userId));

        if (whereClause) {
            query = query.where(whereClause);
        }

        query = query
            .orderBy(desc(ActivityLogModel.createdAt))
            .limit(limit)
            .offset(offset);

        const rows = await query;

        // ----------------------------------------------------
        // RESPONSE
        // ----------------------------------------------------
        return {
            page,
            limit,
            totalPages,
            totalRecords,
            count: rows.length,
            data: rows
        };
    }


    async getUserRegistrationStats(filters: {
        range: "last7" | "last30" | "3months" | "fy",
        financialYear?: string
    }) {

        const { range, financialYear } = filters;

        // FIX #1 — initialize values safely
        let startDate: Date = new Date();
        let endDate: Date = new Date();

        let labels: string[] = [];

        const now = new Date();

        // -------------------------
        // RANGE HANDLING
        // -------------------------

        // if (range === "last7") {
        //     startDate = new Date();
        //     startDate.setDate(now.getDate() - 6);

        //     labels = Array.from({ length: 7 }).map((_, i) => {
        //         const d = new Date(startDate);
        //         d.setDate(startDate.getDate() + i);
        //         return d.toISOString().split("T")[0];
        //     });
        // }

        if (range === "last7") {

            startDate = new Date();
            startDate.setDate(now.getDate() - 6);

            const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

            labels = Array.from({ length: 7 }).map((_, i) => {
                const d = new Date(startDate);
                d.setDate(startDate.getDate() + i);
                return weekdayNames[d.getDay()];
            });
        }


        // else if (range === "last30") {
        //     startDate = new Date();
        //     startDate.setDate(now.getDate() - 29);

        //     labels = Array.from({ length: 30 }).map((_, i) => {
        //         const d = new Date(startDate);
        //         d.setDate(startDate.getDate() + i);
        //         return d.toISOString().split("T")[0];
        //     });
        // }
        else if (range === "last30") {
            startDate = new Date();
            startDate.setDate(now.getDate() - 29);

            labels = [
                "Day 1-7",
                "Day 8-14",
                "Day 15-21",
                "Day 22-28",
                "Day 29-30"
            ];
        }


        else if (range === "3months") {
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

            labels = [
                monthNames[(now.getMonth() - 2 + 12) % 12],
                monthNames[(now.getMonth() - 1 + 12) % 12],
                monthNames[now.getMonth()]
            ];

            startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        }

        else if (range === "fy") {
            if (!financialYear) {
                throw new Error("Financial year required (e.g. 2024-2025)");
            }

            const [startYear, endYear] = financialYear.split("-").map(Number);

            startDate = new Date(`${startYear}-04-01T00:00:00`);
            endDate = new Date(`${endYear}-03-31T23:59:59`);

            labels = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
        }

        // -------------------------
        // FETCH ROWS
        // -------------------------
        const rows = await database
            .select({ createdAt: UserModel.createdAt })
            .from(UserModel)
            .where(
                and(
                    eq(UserModel.userRole, 1),
                    gte(UserModel.createdAt, startDate),
                    lte(UserModel.createdAt, endDate)
                )
            );

        const counts = new Array(labels.length).fill(0);

        // -------------------------
        // GROUPING (with null check)
        // -------------------------

        if (range === "last7") {
            const map: Record<string, number> = {};
            const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

            rows.forEach(r => {
                if (!r.createdAt) return;
                const weekday = weekdayNames[r.createdAt.getDay()];
                map[weekday] = (map[weekday] || 0) + 1;
            });

            labels.forEach((label, i) => {
                counts[i] = map[label] || 0;
            });
        }

        // if (range === "last30") {
        //     const map: Record<string, number> = {};

        //     rows.forEach(r => {
        //         if (!r.createdAt) return; // FIX #2
        //         const date = r.createdAt.toISOString().split("T")[0];
        //         map[date] = (map[date] || 0) + 1;
        //     });

        //     labels.forEach((label, i) => counts[i] = map[label] || 0);
        // }

        if (range === "last30") {

            // 5 buckets
            const bucketLabels = [
                "Day 1-7",
                "Day 8-14",
                "Day 15-21",
                "Day 22-28",
                "Day 29-30"
            ];

            const bucketCounts = [0, 0, 0, 0, 0];

            // Day 1 = startDate (today - 29)
            const day1 = new Date();
            day1.setDate(now.getDate() - 29);

            rows.forEach(r => {
                if (!r.createdAt) return;

                // How many days from startDate?
                const diffMs = r.createdAt.getTime() - day1.getTime();
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1; // 1-based

                if (diffDays >= 1 && diffDays <= 7) bucketCounts[0]++;
                else if (diffDays <= 14) bucketCounts[1]++;
                else if (diffDays <= 21) bucketCounts[2]++;
                else if (diffDays <= 28) bucketCounts[3]++;
                else bucketCounts[4]++;  // 29–30
            });

            // overwrite counts array
            counts.splice(0, counts.length, ...bucketCounts);
        }


        else if (range === "3months") {
            const map: Record<string, number> = {};
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

            rows.forEach(r => {
                if (!r.createdAt) return; // FIX #2
                const month = monthNames[r.createdAt.getMonth()];
                map[month] = (map[month] || 0) + 1;
            });

            labels.forEach((m, i) => counts[i] = map[m] || 0);
        }

        else if (range === "fy") {
            const map: Record<string, number> = {};
            const monthsFY = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

            rows.forEach(r => {
                if (!r.createdAt) return; // FIX #2
                const m = r.createdAt.getMonth();
                const index = (m + 9) % 12;
                const name = monthsFY[index];
                map[name] = (map[name] || 0) + 1;
            });

            labels.forEach((m, i) => counts[i] = map[m] || 0);
        }

        return {
            labels,
            values: counts
        };
    }





    // async fetchTickets(filters: {
    //     ticketId?: number;
    //     userId?: number;
    //     ticketStatus?: "Pending" | "Resolved" | "Escalated";
    //     ticketCategoryId?: number;
    //     roleAssigned?: number;
    //     createdBy?: number;
    //     isActive?: boolean;

    //     search?: string;
    //     dateFrom?: string | Date;
    //     dateTo?: string | Date;

    //     page?: number;
    //     limit?: number;
    //     sortBy?: "createdAt" | "ticketId";
    //     sortOrder?: "asc" | "desc";
    // }) {
    //     const {
    //         ticketId,
    //         userId,
    //         ticketStatus,
    //         ticketCategoryId,
    //         roleAssigned,
    //         createdBy,
    //         isActive,

    //         search,
    //         dateFrom,
    //         dateTo,

    //         page = 1,
    //         limit = 10,
    //         sortBy = "createdAt",
    //         sortOrder = "desc",
    //     } = filters;

    //     const whereConditions: any[] = [];

    //     // ------------------------------
    //     // 🟢 DIRECT FILTERS
    //     // ------------------------------
    //     if (ticketId) whereConditions.push(eq(TicketModel.ticketId, ticketId));
    //     if (userId) whereConditions.push(eq(TicketModel.userId, userId));
    //     if (ticketStatus) whereConditions.push(eq(TicketModel.ticketStatus, ticketStatus));
    //     if (ticketCategoryId) whereConditions.push(eq(TicketModel.ticketCategoryId, ticketCategoryId));
    //     if (roleAssigned) whereConditions.push(eq(TicketModel.roleAssigned, roleAssigned));
    //     if (createdBy) whereConditions.push(eq(TicketModel.createdBy, createdBy));
    //     if (typeof isActive === "boolean") whereConditions.push(eq(TicketModel.isActive, isActive));

    //     // ------------------------------
    //     // 🔍 SEARCH
    //     // ------------------------------
    //     if (search && search.trim().length > 0) {
    //         whereConditions.push(
    //             or(
    //                 ilike(TicketModel.ticketRef, `%${search}%`),
    //                 ilike(TicketModel.description, `%${search}%`)
    //             )
    //         );
    //     }

    //     // ------------------------------
    //     // 📅 DATE FILTERS
    //     // ------------------------------
    //     if (dateFrom) whereConditions.push(gte(TicketModel.createdAt, new Date(dateFrom)));
    //     if (dateTo) whereConditions.push(lte(TicketModel.createdAt, new Date(dateTo)));

    //     const offset = (page - 1) * limit;

    //     // ----------------------------------------
    //     // 🔥 MAIN QUERY
    //     // ----------------------------------------
    //     const tickets = await database
    //         .select()
    //         .from(TicketModel)
    //         .where(whereConditions.length ? and(...whereConditions) : undefined)
    //         .orderBy(
    //             sortOrder === "asc"
    //                 ? asc(TicketModel[sortBy])
    //                 : desc(TicketModel[sortBy])
    //         )
    //         .limit(limit)
    //         .offset(offset);

    //     // Count for pagination
    //     const [{ count }] = await database
    //         .select({ count: sql<number>`count(*)` })
    //         .from(TicketModel)
    //         .where(whereConditions.length ? and(...whereConditions) : undefined);

    //     return {
    //         page,
    //         limit,
    //         total: Number(count),
    //         totalPages: Math.ceil(Number(count) / limit),
    //         data: tickets,
    //     };
    // }




    async fetchTickets(filters: any) {
        const {
            ticketId,
            userId,
            ticketStatus,
            ticketCategoryId,
            roleAssigned,
            createdBy,
            isActive,

            search,
            dateFrom,
            dateTo,

            page = 1,
            limit = 10,
            sortBy = "createdAt",
            sortOrder = "desc",
        } = filters;

        const whereConditions: any[] = [];

        // Direct Filters
        if (ticketId) whereConditions.push(eq(TicketModel.ticketId, ticketId));
        if (userId) whereConditions.push(eq(TicketModel.userId, userId));
        if (ticketStatus) whereConditions.push(eq(TicketModel.ticketStatus, ticketStatus));
        if (ticketCategoryId)
            whereConditions.push(eq(TicketModel.ticketCategoryId, ticketCategoryId));
        if (roleAssigned) whereConditions.push(eq(TicketModel.roleAssigned, roleAssigned));
        if (createdBy) whereConditions.push(eq(TicketModel.createdBy, createdBy));
        if (typeof isActive === "boolean")
            whereConditions.push(eq(TicketModel.isActive, isActive));

        // Searching
        if (search && search.trim().length > 0) {
            whereConditions.push(
                or(
                    ilike(TicketModel.ticketRef, `%${search}%`),
                    ilike(TicketModel.description, `%${search}%`)
                )
            );
        }

        // Date filters
        if (dateFrom) whereConditions.push(gte(TicketModel.createdAt, new Date(dateFrom)));
        if (dateTo) whereConditions.push(lte(TicketModel.createdAt, new Date(dateTo)));

        const offset = (page - 1) * limit;

        // =====================================================
        // 🔥 MAIN QUERY WITH JOIN
        // =====================================================
        const tickets = await database
            .select({
                ticket: TicketModel,
                user: {
                    name: UserModel.userName,
                    email: UserModel.userEmail,
                    mobile: UserModel.userMobile,
                },
                category: {
                    id: TicketCategoryModel.ticketId,
                    name: TicketCategoryModel.ticketCategory,
                },
                role: {
                    roleId: RoleModel.roleId,
                    roleName: RoleModel.roleName,
                },
            })
            .from(TicketModel)
            .leftJoin(UserModel, eq(UserModel.userId, TicketModel.userId))
            .leftJoin(
                TicketCategoryModel,
                eq(TicketCategoryModel.ticketId, TicketModel.ticketCategoryId)
            )
            .leftJoin(RoleModel, eq(RoleModel.roleId, TicketModel.roleAssigned))
            .where(and(...whereConditions))
            .orderBy(desc(TicketModel.ticketId))
            // .orderBy(
            //     sortOrder === "asc"
            //         ? asc(TicketModel[sortBy])
            //         : desc(TicketModel[sortBy])
            // )
            .limit(limit)
            .offset(offset);

        // Count for pagination (without joins)
        const [{ count }] = await database
            .select({ count: sql<number>`count(*)` })
            .from(TicketModel)
            .where(whereConditions.length ? and(...whereConditions) : undefined);

        return {
            page,
            limit,
            total: Number(count),
            totalPages: Math.ceil(Number(count) / limit),
            data: tickets,
        };
    }

    async updateUserDetails(userId: number, payload: { displayName?: string; workshopName?: string }) {
        // Fetch existing user
        const [user] = await database
            .select({
                userId: UserModel.userId,
                userRole: UserModel.userRole
            })
            .from(UserModel)
            .where(eq(UserModel.userId, userId))
            .limit(1);

        if (!user) {
            this.customError.responseMessage = "User not found";
            throw this.customError;
        }

        // Prepare updates for tbl_users
        const userUpdateData: any = {};

        if (payload.displayName) {
            userUpdateData.displayName = payload.displayName;
        }

        // Check role rule
        const isMechanic = user.userRole === 1;
        const shouldUpdateWorkshop = isMechanic && payload.workshopName;

        return await database.transaction(async (tx) => {
            // Update tbl_users
            if (Object.keys(userUpdateData).length > 0) {
                await tx
                    .update(UserModel)
                    .set({
                        ...userUpdateData,
                        updatedAt: new Date()
                    })
                    .where(eq(UserModel.userId, userId));
            }

            // Update tbl_mechanics only if mechanic role
            if (shouldUpdateWorkshop) {
                await tx
                    .update(MechanicModel)
                    .set({
                        workshopName: payload.workshopName!,
                    })
                    .where(eq(MechanicModel.userId, userId));
            }

            return {
                message: "User updated successfully",
                updatedFields: {
                    displayName: payload.displayName ?? undefined,
                    workshopName: shouldUpdateWorkshop ? payload.workshopName : undefined,
                },
            };
        });
    }

    // async getOtpReport(page: number = 1, limit: number = 10, filters: any = {}) {
    //     const {
    //         otpId,
    //         userId,
    //         isVerified,
    //         otpType,
    //         search,
    //         dateFrom,
    //         dateTo,
    //     } = filters;

    //     page = Math.max(1, page);
    //     limit = Math.max(1, limit);
    //     const offset = (page - 1) * limit;

    //     const whereConditions: any[] = [];

    //     // -------------------------------------------
    //     // Direct filters
    //     // -------------------------------------------
    //     if (otpId) whereConditions.push(eq(OtpModel.otpId, otpId));
    //     if (userId) whereConditions.push(eq(OtpModel.userId, userId));
    //     if (otpType) whereConditions.push(eq(OtpModel.otpType, otpType));

    //     if (typeof isVerified === "boolean") {
    //         whereConditions.push(eq(OtpModel.isVerified, isVerified));
    //     }

    //     // -------------------------------------------
    //     // Search (user fields + OTP)
    //     // -------------------------------------------
    //     if (search && search.trim().length > 0) {
    //         whereConditions.push(
    //             or(
    //                 ilike(OtpModel.otp, `%${search}%`),
    //                 ilike(UserModel.userName, `%${search}%`),
    //                 ilike(UserModel.userEmail, `%${search}%`),
    //                 ilike(UserModel.userMobile, `%${search}%`)
    //             )
    //         );
    //     }

    //     // -------------------------------------------
    //     // Date filters
    //     // -------------------------------------------
    //     if (dateFrom)
    //         whereConditions.push(gte(OtpModel.createdAt, new Date(dateFrom)));
    //     if (dateTo)
    //         whereConditions.push(lte(OtpModel.createdAt, new Date(dateTo)));

    //     // -------------------------------------------
    //     // Main Query (JOIN with users)
    //     // -------------------------------------------
    //     const rows = await database
    //         .select({
    //             otpId: OtpModel.otpId,
    //             otp: OtpModel.otp,
    //             userId: OtpModel.userId,
    //             otpAttempt: OtpModel.otpAttempt,
    //             isVerified: OtpModel.isVerified,
    //             expiryAt: OtpModel.expiryAt,
    //             createdAt: OtpModel.createdAt,
    //             otpType: OtpModel.otpType,

    //             userName: UserModel.userName,
    //             userEmail: UserModel.userEmail,
    //             userMobile: UserModel.userMobile,
    //             userRole: UserModel.userRole,
    //             userCode:UserModel.userCode
    //         })
    //         .from(OtpModel)
    //         .leftJoin(UserModel, eq(UserModel.userId, OtpModel.userId))
    //         .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    //         .orderBy(desc(OtpModel.otpId))
    //         .limit(limit)
    //         .offset(offset);

    //     // -------------------------------------------
    //     // Count for pagination
    //     // -------------------------------------------
    //     const [{ count }] = await database
    //         .select({
    //             count: sql<number>`count(*)`
    //         })
    //         .from(OtpModel)
    //         .leftJoin(UserModel, eq(UserModel.userId, OtpModel.userId))
    //         .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    //     const total = Number(count);
    //     const totalPages = Math.ceil(total / limit);

    //     return {
    //         success: true,
    //         page,
    //         limit,
    //         total,
    //         totalPages,
    //         data: rows,
    //     };
    // }

    async getOtpReport(
        page: number = 1,
        limit: number = 10,
        filters: any = {}
    ) {
        const {
            otpId,
            userId,
            isVerified,
            otpType,

            // User Filters
            userRole,
            blockStatus,

            // Address Filters
            currentCity,
            currentDistrict,
            currentPincode,
            currentState,
            zoneId,
            branchId,

            // Search + Date Filters
            search,
            dateFrom,
            dateTo,
        } = filters;

        // -----------------------------------
        // Pagination setup
        // -----------------------------------
        page = Math.max(1, page);
        limit = Math.max(1, limit);
        const offset = (page - 1) * limit;

        const whereConditions: any[] = [
            eq(UserModel.userRole, ROLES.MECHANIC),
        ];

        // -----------------------------------
        // OTP Filters
        // -----------------------------------
        if (otpId) whereConditions.push(eq(OtpModel.otpId, otpId));
        if (userId) whereConditions.push(eq(OtpModel.userId, userId));
        if (otpType) whereConditions.push(eq(OtpModel.otpType, otpType));

        if (typeof isVerified === "boolean") {
            whereConditions.push(eq(OtpModel.isVerified, isVerified));
        }

        // -----------------------------------
        // User Filters
        // -----------------------------------
        if (userRole) whereConditions.push(eq(UserModel.userRole, userRole));
        if (blockStatus) whereConditions.push(eq(UserModel.blockStatus, blockStatus));

        // -----------------------------------
        // Address Filters
        // -----------------------------------
        if (currentCity) whereConditions.push(ilike(AddressModel.currentCity, `%${currentCity}%`));
        if (currentDistrict) whereConditions.push(ilike(AddressModel.currentDistrict, `%${currentDistrict}%`));
        if (currentPincode) whereConditions.push(eq(AddressModel.currentPincode, Number(currentPincode)));
        if (currentState) whereConditions.push(ilike(AddressModel.currentState, `%${currentState}%`));
        if (zoneId) whereConditions.push(eq(AddressModel.zoneName, zoneId));
        if (branchId) whereConditions.push(eq(AddressModel.branchId, Number(branchId)));

        // -----------------------------------
        // Search
        // -----------------------------------
        if (search && search.trim().length > 0) {
            whereConditions.push(
                or(
                    ilike(OtpModel.otp, `%${search}%`),
                    ilike(UserModel.userName, `%${search}%`),
                    ilike(UserModel.userEmail, `%${search}%`),
                    ilike(UserModel.userMobile, `%${search}%`),

                    ilike(AddressModel.currentCity, `%${search}%`),
                    ilike(AddressModel.currentDistrict, `%${search}%`),
                    ilike(AddressModel.currentState, `%${search}%`)
                )
            );
        }

        // -----------------------------------
        // Date Filters
        // -----------------------------------
        if (dateFrom) whereConditions.push(gte(OtpModel.createdAt, new Date(dateFrom)));
        if (dateTo) whereConditions.push(lte(OtpModel.createdAt, new Date(dateTo)));

        // -------------------------------------------------
        // 1. Fetch OTP rows (JOIN with users + address)
        // -------------------------------------------------
        const rows = await database
            .select({
                // OTP Fields
                otpId: OtpModel.otpId,
                otp: OtpModel.otp,
                userId: OtpModel.userId,
                otpAttempt: OtpModel.otpAttempt,
                isVerified: OtpModel.isVerified,
                expiryAt: OtpModel.expiryAt,
                createdAt: OtpModel.createdAt,
                otpType: OtpModel.otpType,

                // User Fields
                userName: UserModel.userName,
                userEmail: UserModel.userEmail,
                userMobile: UserModel.userMobile,
                userRole: UserModel.userRole,
                blockStatus: UserModel.blockStatus,
                userCode: UserModel.userCode,

                // Address Fields
                currentAddress: AddressModel.currentAddress,
                workshopAddress: AddressModel.workshopAddress,
                currentCity: AddressModel.currentCity,
                currentDistrict: AddressModel.currentDistrict,
                currentPincode: AddressModel.currentPincode,
                currentState: AddressModel.currentState,
                zoneId: AddressModel.zoneName,
                branchId: AddressModel.branchId,

                //role details
                roleName: RoleModel.roleName
            })
            .from(OtpModel)
            .leftJoin(UserModel, eq(UserModel.userId, OtpModel.userId))
            .leftJoin(AddressModel, eq(AddressModel.userId, UserModel.userId))
            .leftJoin(RoleModel, eq(RoleModel.roleId, UserModel.userRole))
            .where(whereConditions.length ? and(...whereConditions) : undefined)
            .orderBy(desc(OtpModel.otpId))
            .limit(limit)
            .offset(offset);

        // -------------------------------------------------
        // 2. Count Total Rows (with all filters)
        // -------------------------------------------------
        const [{ count }] = await database
            .select({
                count: sql<number>`count(*)`
            })
            .from(OtpModel)
            .leftJoin(UserModel, eq(UserModel.userId, OtpModel.userId))
            .leftJoin(AddressModel, eq(AddressModel.userId, UserModel.userId))
            .leftJoin(RoleModel, eq(RoleModel.roleId, UserModel.userRole))
            .where(whereConditions.length ? and(...whereConditions) : undefined);

        const total = Number(count);
        const totalPages = Math.ceil(total / limit);

        // -------------------------------------------------
        // 3. Return final structure
        // -------------------------------------------------
        return {
            success: true,
            page,
            limit,
            total,
            totalPages,
            data: rows,
        };
    }


    async updatePinHash(userId: number, pinHash: string) {
        await database
            .update(UserModel)
            .set({
                pinHash: pinHash,
                updatedAt: new Date(),
            })
            .where(eq(UserModel.userId, userId));
    }

    async getPinHash(userId: number): Promise<string | null> {
        const [userData] = await database
            .select({ pinHash: UserModel.pinHash })
            .from(UserModel)
            .where(eq(UserModel.userId, userId))
            .limit(1);

        return userData?.pinHash || null;
    }

}

export const userRepository = new UserRepository();

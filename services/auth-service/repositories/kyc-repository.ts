import { and, count, desc, eq, getTableColumns, gte, ilike, inArray, InferInsertModel, InferSelectModel, lte, ne, or, SQL, sql } from "drizzle-orm";
import { DigilockerSessionModel, MechanicModel, PincodeModel, PurchasingRetailersModel, RetailerMappingModel, RetailerModel, UserKycDetailsModel, UserModel, TDSTrackModel, PointConfigurationModel, AddressModel, RoleModel } from "../schemas";
import { database } from "../server";
import { CustomError, KYCFilesUpdate, PreferredRetailerList, PurchasingRetailerCreatePayload, PurchasingRetailerEditPayload, RetailerFilter, RetailerPayload, RetailerWorkshopMapActionPayload, RetailerWorkshopMapPayload, RetailerWorkshopMappingsQueryPayload, TDSTrackMetaDataColumn, TDSTrackPayload, TenacioGetDigilockerDetailsRes, TenacioITRComplianceData, UserDetails } from "../types";
import { genderEnumConversion } from "../utils/db-ref-converter";
import { removeSpace } from "../utils/regex";
import { fileMiddleware } from "../middlewares/file-middleware";
import { calculateTDSValue, convertToNumber, deductedTDSEarnedPoint, generateRandomToken, getAgeFromDob, parseDate } from "../utils/random";
import { REGISTERATION_BONUS_POINTS } from "../configs/config";
import { passbookRepository } from "./passbook-repository";
import { ReferralModel } from "../schemas/referral-model";
import { ROLES } from "../utils/constant";
import { NotificationMiddleware } from "../middlewares/notification-middleware";
import { workshop } from "../schemas/workshop-model";

export class KycRepository {
    customError: CustomError;
    constructor() {
        this.customError = new CustomError({
            responseCode: 400,
            responseMessage: ""
        })
    }

    async initiateDigilocker(userDetails: UserDetails, data?: { url: string, sessionToken: string }) {
        await database.transaction(async (tran) => {
            await tran.update(DigilockerSessionModel).set({
                isActive: false
            }).where(
                and(
                    eq(DigilockerSessionModel.userId, userDetails.userId),
                    eq(DigilockerSessionModel.isActive, true)
                )
            )

            await tran.insert(DigilockerSessionModel).values({
                userId: userDetails.userId,
                redirectionUrl: data?.url as string,
                sessionId: data?.sessionToken as string,
            })

        })
    }

    async getLastSession(userDetails: UserDetails) {
        const [res] = await database
            .update(DigilockerSessionModel)
            .set({ isActive: false })
            .where(
                and(
                    eq(DigilockerSessionModel.userId, userDetails.userId),
                    eq(DigilockerSessionModel.isActive, true)
                )
            ).returning(getTableColumns(DigilockerSessionModel))

        if (!res || !res?.sessionId) {
            this.customError.responseMessage = "Please re-initiate the session";
            throw this.customError;
        }

        return res;
    }

    async updateDigilockerAadharImage(tenacioData: TenacioGetDigilockerDetailsRes, fileUrl: string | null, userDetails: UserDetails) {
        const currentAddress = `${tenacioData?.resData?.data?.address?.locality || ''} ${tenacioData?.resData?.data?.address?.landmark || ''} ${tenacioData?.resData?.data?.address?.loc || ''}`
        await database.transaction(async (tran) => {
            await tran.update(MechanicModel).set({
                aadhaarProfileUrl: fileUrl,
                gender: genderEnumConversion(tenacioData?.resData?.data?.gender as string),
                age: tenacioData?.resData?.data?.dob ? getAgeFromDob(tenacioData?.resData?.data?.dob) : null,
                dob: tenacioData?.resData?.data?.dob,
                maskedAadhaarNumber: tenacioData?.resData?.data?.maskedaadhaar
            }).where(
                and(eq(MechanicModel.userId, userDetails.userId))
            )

            await tran.update(UserModel).set({
                blockStatus: "kyc",
                userName: tenacioData?.resData?.data?.name,
                displayName: tenacioData?.resData?.data?.name
            }).where(
                and(eq(UserModel.userId, userDetails.userId))
            )

            await tran.insert(AddressModel).values({
                userId: userDetails?.userId,
                currentAddress: currentAddress,
                currentCity: tenacioData?.resData?.data?.address?.city as string,
                currentDistrict: tenacioData?.resData?.data?.address?.vtc as string,
                currentPincode: Number(tenacioData?.resData?.data?.address?.pin),
                currentState: tenacioData?.resData?.data?.address?.state as string
            })
        })


    }

    async checkPanExists(panNumber: string, userId: number) {
        const [existingPanData] = await database.select().from(UserKycDetailsModel).where(
            and(
                eq(UserKycDetailsModel.kycDoc, panNumber),
                eq(UserKycDetailsModel.isActive, true),
                eq(UserKycDetailsModel.kycType, "pan-number"),
                ne(UserKycDetailsModel.userId, userId)
            )
        )

        if (existingPanData?.kycDoc) {
            this.customError.responseMessage = "Pan number is already registered";
            throw this.customError;
        }
    }

    async updateKycFiles(updateFields: KYCFilesUpdate, userDetails: UserDetails) {
        await database.transaction(async (tran) => {

            const [existingPanData] = await tran.select().from(UserKycDetailsModel).where(
                and(
                    eq(UserKycDetailsModel.kycDoc, updateFields?.panNumber as string),
                    eq(UserKycDetailsModel.isActive, true),
                    eq(UserKycDetailsModel.kycType, "pan-number"),
                    ne(UserKycDetailsModel.userId, userDetails?.userId)
                )
            )

            if (existingPanData?.kycDoc) {
                this.customError.responseMessage = "Pan number is already registered";
                throw this.customError;
            }

            const [existingPanData2] = await tran.select().from(MechanicModel).where(
                and(
                    eq(MechanicModel.panNumber, updateFields?.panNumber as string),
                    ne(MechanicModel.userId, userDetails?.userId)
                )
            )

            if (existingPanData2?.panNumber) {
                this.customError.responseMessage = "Pan number is already registered by another user";
                throw this.customError;
            }

            const [existingApprovedData] = await tran.select().from(UserKycDetailsModel).where(
                and(
                    eq(UserKycDetailsModel.isActive, true),
                    eq(UserKycDetailsModel.docStatus, "Approved"),
                    eq(UserKycDetailsModel.userId, userDetails?.userId)
                )
            )

            if (
                existingApprovedData?.docStatus == "Approved" &&
                updateFields?.aadhaarFrontUrl &&
                existingApprovedData?.kycType == "aadhaar-front"
            ) {
                this.customError.responseMessage = "Aadhaar front image is already approved";
                throw this.customError;
            }

            if (
                existingApprovedData?.docStatus == "Approved" &&
                updateFields?.aadhaarBackUrl &&
                existingApprovedData?.kycType == "aadhaar-back"
            ) {
                this.customError.responseMessage = "Aadhaar back image is already approved";
                throw this.customError;
            }

            if (
                existingApprovedData?.docStatus == "Approved" &&
                updateFields?.panNumber &&
                existingApprovedData?.kycType == "pan-number"
            ) {
                this.customError.responseMessage = "Pan number is already approved";
                throw this.customError;
            }

            if (
                existingApprovedData?.docStatus == "Approved" &&
                updateFields?.panFrontUrl &&
                existingApprovedData?.kycType == "pan-front"
            ) {
                this.customError.responseMessage = "PAN front image is already approved";
                throw this.customError;
            }

            const rowsToInsert: InferInsertModel<typeof UserKycDetailsModel>[] = [];

            const newDate = new Date();

            if (updateFields?.aadhaarFrontUrl) {
                rowsToInsert.push({
                    kycDoc: updateFields.aadhaarFrontUrl,
                    docStatus: "Pending",
                    kycType: "aadhaar-front",
                    userId: userDetails?.userId,
                    createdAt: newDate
                });
            }

            if (updateFields?.aadhaarBackUrl) {
                rowsToInsert.push({
                    kycDoc: updateFields.aadhaarBackUrl,
                    docStatus: "Pending",
                    kycType: "aadhaar-back",
                    userId: userDetails?.userId,
                    createdAt: newDate
                });
            }

            if (updateFields?.panNumber) {
                rowsToInsert.push({
                    kycDoc: updateFields.panNumber,
                    docStatus: "Pending",
                    kycType: "pan-number",
                    userId: userDetails?.userId,
                    createdAt: newDate
                });
            }

            if (updateFields?.panFrontUrl) {
                rowsToInsert.push({
                    kycDoc: updateFields.panFrontUrl,
                    docStatus: "Pending",
                    kycType: "pan-front",
                    userId: userDetails?.userId,
                    createdAt: newDate
                });
            }

            if (updateFields?.preferredRetailer) {
                rowsToInsert.push({
                    kycDoc: updateFields?.preferredRetailer,
                    docStatus: "Pending",
                    kycType: "preferred-retailers",
                    userId: userDetails?.userId,
                    createdAt: newDate
                });
            }

            if (rowsToInsert.length > 0) {
                await tran
                    .update(UserKycDetailsModel)
                    .set({
                        isActive: false
                    })
                    .where(
                        and(
                            eq(UserKycDetailsModel.userId, userDetails.userId),
                            inArray(UserKycDetailsModel.kycType, rowsToInsert?.map(ele => ele.kycType))
                        )
                    )

                await tran
                    .insert(UserKycDetailsModel)
                    .values(rowsToInsert);

                const payloadToInsert = {
                    kycApproval: false,
                    panNumber: updateFields?.panNumber,
                    aadhaarBackUrl: updateFields?.aadhaarBackUrl,
                    aadhaarFrontUrl: updateFields?.aadhaarFrontUrl,
                    panFrontUrl: updateFields?.panFrontUrl,
                    mappedRetailers: updateFields?.preferredRetailer,
                }

                await tran
                    .update(MechanicModel)
                    .set(payloadToInsert)
                    .where(
                        and(
                            eq(MechanicModel.userId, userDetails.userId),
                        )
                    )
            }

            await tran.update(UserModel).set({
                blockStatus: 'incomplete-registration'
            }).where(
                and(
                    eq(UserModel.userId, userDetails.userId),
                    eq(UserModel.blockStatus, "kyc")
                )
            )
        })
    }

    async addRetailer(payload: RetailerPayload, pincodeDetails: InferSelectModel<typeof PincodeModel>) {
        return database.transaction(async (tran) => {

            // const [existingUser] = await tran.select().from(UserModel).where(and(eq(UserModel.userMobile, payload.mobileNumber)))
            // if (existingUser?.userMobile) {
            //     this.customError.responseMessage = "Mobile number already exist";
            //     throw this.customError;
            // }
            const [existingRetailer] = await tran.select().from(RetailerModel).where(and(eq(RetailerModel.mobileNumber, payload.mobileNumber)))
            if (existingRetailer?.mobileNumber) {
                this.customError.responseMessage = "Retailer already exist";
                throw this.customError;
            }
            await tran.insert(RetailerModel).values({
                mobileNumber: payload?.mobileNumber,
                gstNumber: payload?.gstNumber || null,
                currentPincode: payload?.currentPincode as number,
                retailerName: payload?.retailerName,
                storeName: payload?.storeName,
                currentAddress: payload?.currentAddress,
                cityName: pincodeDetails?.cityName,
                districtName: pincodeDetails?.districtName,
                stateName: pincodeDetails?.stateName,
            })
        })
    }

    async getRetailer(payload: RetailerFilter) {
        return await database.select().from(RetailerModel).where(
            and(
                payload?.pincode ? eq(RetailerModel.currentPincode, payload?.pincode) : undefined,
                payload?.retailer ? ilike(RetailerModel.storeName, `%${payload?.retailer}%`) : undefined,
                payload?.retailerIds?.length ? inArray(RetailerModel.retailerId, payload?.retailerIds) : undefined
            )
        )
    }

    async getKycDetails(userDetails: UserDetails) {
        const result = await database.select().from(UserKycDetailsModel).where(
            and(
                eq(UserKycDetailsModel.userId, userDetails.userId),
                eq(UserKycDetailsModel.isActive, true)
            )
        );

        const [
            aadhaarBackUrl,
            aadhaarFrontUrl,
            panFrontUrl
        ] = await this.assignSinedUrl(
            result?.find(ele => ele?.kycType == "aadhaar-back")?.kycDoc || "",
            result?.find(ele => ele?.kycType == "aadhaar-front")?.kycDoc || "",
            result?.find(ele => ele?.kycType == "pan-front")?.kycDoc || "",
        );

        return result?.map(ele => {

            if (ele?.kycType == "aadhaar-back") {
                ele.kycDoc = aadhaarBackUrl
            }
            if (ele?.kycType == "aadhaar-front") {
                ele.kycDoc = aadhaarFrontUrl
            }
            if (ele?.kycType == "pan-front") {
                ele.kycDoc = panFrontUrl
            }
            return ele

        })
    }

    async assignSinedUrl(aadhaarBackUrl: string | null, aadhaarFrontUrl: string | null, panFrontUrl: string | null) {
        return Promise.all([
            aadhaarBackUrl ? fileMiddleware.getFileSignedUrl(aadhaarBackUrl, "aadhaar-back") : "",
            aadhaarFrontUrl ? fileMiddleware.getFileSignedUrl(aadhaarFrontUrl, "aadhaar-front") : "",
            panFrontUrl ? fileMiddleware.getFileSignedUrl(panFrontUrl, "pan-front") : "",
        ]);
    }

    async getKycByStatus(approvalStatus: boolean) {

        return await database
            .select({
                mechanic: {
                    workshopName: MechanicModel.workshopName,
                    panNumber: MechanicModel.panNumber,
                    panFrontUrl: MechanicModel.panFrontUrl,
                    aadhaarNumber: MechanicModel.aadhaarNumber,
                    maskedAadhaarNumber: MechanicModel.maskedAadhaarNumber,
                    aadhaarProfileUrl: MechanicModel.aadhaarProfileUrl,
                    aadhaarFrontUrl: MechanicModel.aadhaarFrontUrl,
                    aadhaarBackUrl: MechanicModel.aadhaarBackUrl,
                },
                user: {
                    userName: UserModel.userName,
                    userCode: UserModel.userCode,
                    userEmail: UserModel.userEmail,
                    userMobile: UserModel.userMobile,
                    userId: UserModel.userId
                }
            })
            .from(MechanicModel)
            .innerJoin(
                UserModel,
                eq(MechanicModel.userId, UserModel.userId)
            )
            .where(eq(MechanicModel.kycApproval, approvalStatus));
    }

    async updateBulkKycStatus(
        updates: {
            userId: number;
            kycStatus?: boolean;
            kycApproval?: boolean;
            comment?: string;
        }[]
    ) {
        if (!updates.length) return [];

        // ✅ Normalize input
        const safeUpdates = updates.map(u => ({
            userId: u.userId,
            kycApproval: u.kycApproval ?? u.kycStatus,
            kycComment: u.comment ?? null
        }));

        return await database.transaction(async (tx) => {
            const userIds = safeUpdates.map(u => u.userId);

            // ✅ Fetch existing users
            const existing = await tx
                .select({
                    userId: MechanicModel.userId,
                    kycApproval: MechanicModel.kycApproval
                })
                .from(MechanicModel)
                .where(inArray(MechanicModel.userId, userIds));

            const existingMap = new Map(
                existing.map(e => [e.userId, e.kycApproval])
            );

            const response: Array<{
                userId: number;
                updated: boolean;
                reason?: string;
            }> = [];

            // ✅ Eligibility filter
            const validUpdates = safeUpdates.filter((u) => {
                const current = existingMap.get(u.userId);

                if (current === undefined) {
                    response.push({
                        userId: u.userId,
                        updated: false,
                        reason: "User not found"
                    });
                    return false;
                }

                if (current === true) {
                    response.push({
                        userId: u.userId,
                        updated: false,
                        reason: "Already approved"
                    });
                    return false;
                }

                return true;
            });

            if (!validUpdates.length) return response;

            // ✅ Perform updates
            for (const row of validUpdates) {
                await tx
                    .update(MechanicModel)
                    .set({
                        kycApproval: row.kycApproval,
                        kycComment: row.kycComment
                    })
                    .where(eq(MechanicModel.userId, row.userId));

                response.push({
                    userId: row.userId,
                    updated: true
                });
            }

            return response;
        });
    }


    async tdsConsent(tenacioData: TenacioITRComplianceData, userDetails: UserDetails) {
        const validData = {
            aadhaarLinked: false,
            panValid: false,
            itr: false
        }
        if (tenacioData?.validPan && tenacioData?.validPan === true) {
            validData.panValid = true;
        }
        if (tenacioData?.panAadhaarLinked && tenacioData?.panAadhaarLinked === true) {
            validData.aadhaarLinked = true;
        }
        if (tenacioData?.compliant && tenacioData?.compliant === true) {
            validData.itr = true;
        }

        const tdsSlab = (
            validData?.aadhaarLinked &&
            validData?.itr &&
            validData?.panValid
        ) ? "10" : "20"

        return await database.transaction(async (tran) => {
            const [tdsData] = await tran.update(MechanicModel).set({
                tdsAadhaarLinkage: validData?.aadhaarLinked,
                tdsITRVerification: validData?.itr,
                tdsPanVerification: validData?.panValid,
                tdsConsent: true,
                tdsSlabs: tdsSlab,
            }).where(
                and(
                    eq(MechanicModel.userId, userDetails?.userId),
                    eq(MechanicModel.tdsConsent, false)
                )
            ).returning(getTableColumns(MechanicModel));

            await tran.update(UserModel).set({
                blockStatus: 'none'
            })
                .where(eq(UserModel.userId, userDetails?.userId))

            await this.handlePointEarningAndLog(
                tdsData,
                tran
            )

            return {
                ...validData,
                panNumber: tdsData?.panNumber,
                tdsSlabs: tdsData?.tdsSlabs,
            }
        });
    }

    async storeTdsTrack(
        userId: number,
        payload: TDSTrackPayload,
        transaction: Parameters<Parameters<typeof database.transaction>[0]>[0] | null
    ): Promise<InferInsertModel<typeof TDSTrackModel> | undefined> {

        const exec = transaction ?? database;

        const [res] = await exec
            .insert(TDSTrackModel)
            .values({
                userId,
                earnedPoints: String(payload.earnedPoints ?? "0.00"),
                tdsDeducted: String(payload.tdsDeducted ?? "0.00"),
                totalPoints: String(payload.totalPoints ?? "0.00"),
                tdsSlab: String(payload.tdsSlab ?? "20.00"),
                earnType: payload.earnType,
                metaData: payload.metaData ?? {},
            })
            .returning(getTableColumns(TDSTrackModel));

        return res;
    }

    async handlePointEarningAndLog(
        mechanicData: InferSelectModel<typeof MechanicModel>,
        tran: Parameters<Parameters<typeof database.transaction>[0]>[0]
    ) {

        const [configuredPoints] = await tran
            .select()
            .from(PointConfigurationModel)
            .where(
                and(
                    eq(PointConfigurationModel.isActive, true),
                    eq(PointConfigurationModel.configType, "Registration")
                )
            )
            .limit(1)

        const pointToBeEarned = deductedTDSEarnedPoint(configuredPoints?.points, mechanicData?.tdsSlabs);

        if (!convertToNumber(mechanicData.earnedPoints) && convertToNumber(configuredPoints?.points)) { // only if point = 0 which is time tds consent 
            await tran.update(MechanicModel).set({
                earnedPoints: sql`${MechanicModel.earnedPoints} + ${configuredPoints?.points}`,
                redeemablePoints: sql`${MechanicModel.redeemablePoints} + ${pointToBeEarned}`,
                balancePoints: sql`${MechanicModel.balancePoints} + ${pointToBeEarned}`,
                currentYearEarnedPoints: sql`${MechanicModel.currentYearEarnedPoints} + ${configuredPoints?.points}`,
                bonusPoints: sql`${MechanicModel.bonusPoints} + ${configuredPoints?.points}`,
                tdsKitty: sql`${MechanicModel.tdsKitty} + ${calculateTDSValue(configuredPoints?.points, mechanicData?.tdsSlabs)}`,
            })
                .where(
                    or(
                        eq(MechanicModel.userId, mechanicData?.userId),
                    )
                )

            await passbookRepository.addTransaction(
                mechanicData?.userId,
                "REGISTRATION",
                Number(configuredPoints?.points),
                { userId: mechanicData.userId },
                tran
            );

            await this.storeTdsTrack(mechanicData.userId, {
                earnType: "register",
                earnedPoints: deductedTDSEarnedPoint(configuredPoints?.points, mechanicData?.tdsSlabs),
                tdsDeducted: calculateTDSValue(configuredPoints?.points, mechanicData?.tdsSlabs),
                totalPoints: convertToNumber(configuredPoints?.points),
                tdsSlab: mechanicData?.tdsSlabs,
                metaData: {
                    userId: mechanicData?.userId
                }
            }, tran);
        }

        const [referralDetails] = await tran.select().from(ReferralModel).where(
            and(
                eq(ReferralModel.isActive, true),
                eq(ReferralModel.isClaimed, false),
                eq(ReferralModel.refereeUserId, mechanicData?.userId),
            )
        )
        if (!referralDetails || !referralDetails?.referralId) {
            // no pending referral points to earn
            return
        }

        const isUpdated = await tran.update(ReferralModel).set({
            isClaimed: true,
        })
            .where(
                and(
                    eq(ReferralModel.isActive, true),
                    eq(ReferralModel.isClaimed, false),
                    eq(ReferralModel.refereeUserId, mechanicData?.userId)
                )
            )

        if (!isUpdated?.rowCount) {
            return
        }

        if (isUpdated?.rowCount > 1) {
            // no points if there are more than one referral for the new mechanics
            return
        }

        const [referrerUserDetails] = await tran.select().from(MechanicModel).where(
            and(
                eq(MechanicModel.userId, referralDetails?.referrerUserId)
            )
        )
        const REFERRER_POINTS = convertToNumber(referralDetails?.referrerPoints);
        const REFEREE_POINTS = convertToNumber(referralDetails?.refereePoints);

        const referrerEarnedPoints = deductedTDSEarnedPoint(REFERRER_POINTS, referrerUserDetails?.tdsSlabs);
        const refereeEarnedPoints = deductedTDSEarnedPoint(REFEREE_POINTS, mechanicData?.tdsSlabs);

        const referrerTDS = calculateTDSValue(REFERRER_POINTS, referrerUserDetails?.tdsSlabs)
        const refereeTDS = calculateTDSValue(REFEREE_POINTS, mechanicData?.tdsSlabs)

        await tran.update(MechanicModel).set({
            earnedPoints: sql`${MechanicModel.earnedPoints} + ${REFERRER_POINTS}`,
            redeemablePoints: sql`${MechanicModel.redeemablePoints} + ${referrerEarnedPoints}`,
            balancePoints: sql`${MechanicModel.balancePoints} + ${referrerEarnedPoints}`,
            currentYearEarnedPoints: sql`${MechanicModel.currentYearEarnedPoints} + ${REFERRER_POINTS}`,
            tdsKitty: sql`${MechanicModel.tdsKitty} + ${referrerTDS}`,
        })
            .where(
                and(
                    eq(MechanicModel.userId, referrerUserDetails?.userId),
                )
            )

        await tran.update(MechanicModel).set({
            earnedPoints: sql`${MechanicModel.earnedPoints} + ${REFEREE_POINTS}`,
            redeemablePoints: sql`${MechanicModel.redeemablePoints} + ${refereeEarnedPoints}`,
            balancePoints: sql`${MechanicModel.balancePoints} + ${refereeEarnedPoints}`,
            currentYearEarnedPoints: sql`${MechanicModel.currentYearEarnedPoints} + ${REFEREE_POINTS}`,
            tdsKitty: sql`${MechanicModel.tdsKitty} + ${refereeTDS}`,
        })
            .where(
                and(
                    eq(MechanicModel.userId, mechanicData?.userId)
                )
            )

        await passbookRepository.addTransaction(
            mechanicData?.userId,
            "REFERRAL",
            REFEREE_POINTS,
            { refererUserId: referralDetails.referrerUserId },
            tran
        );

        await passbookRepository.addTransaction(
            referralDetails?.referrerUserId,
            "REFERRAL",
            REFERRER_POINTS,
            { refereeUserId: mechanicData?.userId },
            tran
        );

        await this.storeTdsTrack(referralDetails?.referrerUserId, {
            earnType: "referral",
            earnedPoints: referrerEarnedPoints,
            tdsDeducted: referrerTDS,
            totalPoints: REFERRER_POINTS,
            tdsSlab: Number(referrerUserDetails?.tdsSlabs || 0),
            metaData: {
                refereeUserId: referralDetails?.refereeUserId
            }
        }, tran)

        await this.storeTdsTrack(referralDetails?.refereeUserId, {
            earnType: "referral",
            earnedPoints: refereeEarnedPoints,
            tdsDeducted: refereeTDS,
            totalPoints: REFEREE_POINTS,
            tdsSlab: Number(mechanicData?.tdsSlabs || 0),
            metaData: {
                refererUserId: referralDetails.referrerUserId
            }
        }, tran)
    }


    async getKycStatusSummary(filters: { financialYear?: string } = {}) {

        const { financialYear } = filters;

        const conditions: SQL[] = [
            eq(UserModel.userRole, ROLES.MECHANIC)
        ];

        // --------------------------------------
        // OPTIONAL FINANCIAL YEAR FILTER (on USER CREATED AT)
        // --------------------------------------
        if (financialYear) {
            const [startYear, endYear] = financialYear.split("-").map(Number);

            const fromDate = new Date(`${startYear}-04-01T00:00:00`);
            const toDate = new Date(`${endYear}-03-31T23:59:59`);

            conditions.push(gte(UserModel.createdAt, fromDate));
            conditions.push(lte(UserModel.createdAt, toDate));
        }

        // Build WHERE clause
        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [result] = await database
            .select({
                approved: sql<number>`
                COUNT(*) FILTER (WHERE ${UserModel.blockStatus} = 'none')
            `,
                pending: sql<number>`
                COUNT(*) FILTER (WHERE ${UserModel.blockStatus} = 'kyc-admin')
            `,
            })
            .from(MechanicModel)
            .innerJoin(UserModel, eq(MechanicModel.userId, UserModel.userId))
            .where(whereClause);

        return {
            approved: Number(result?.approved ?? 0),
            pending: Number(result?.pending ?? 0),
        };
    }

    // async getUserKycDetails(userId?: number) {
    //     const whereConditions = [
    //         inArray(UserKycDetailsModel.docStatus, ["Pending", "Approved"]),
    //         eq(UserModel.blockStatus, "kyc") // ✅ new condition
    //     ];

    //     if (userId) {
    //         whereConditions.push(eq(UserKycDetailsModel.userId, userId));
    //     }

    //     const rows = await database
    //         .select({
    //             // User fields
    //             userId: UserModel.userId,
    //             userName: UserModel.userName,
    //             userEmail: UserModel.userEmail,
    //             userMobile: UserModel.userMobile,
    //             userRole: UserModel.userRole,
    //             blockStatus: UserModel.blockStatus,
    //             userCreatedAt: UserModel.createdAt,

    //             // KYC fields
    //             detailId: UserKycDetailsModel.detailId,
    //             kycType: UserKycDetailsModel.kycType,
    //             kycDoc: UserKycDetailsModel.kycDoc,
    //             docStatus: UserKycDetailsModel.docStatus,
    //             kycCreatedAt: UserKycDetailsModel.createdAt,
    //             kycUpdatedAt: UserKycDetailsModel.updatedAt,
    //             comment: UserKycDetailsModel.comment,
    //         })
    //         .from(UserKycDetailsModel)
    //         .leftJoin(
    //             UserModel,
    //             eq(UserModel.userId, UserKycDetailsModel.userId)
    //         )
    //         .where(and(...whereConditions));

    //     if (!rows || rows.length === 0) {
    //         this.customError.responseMessage = userId
    //             ? "No KYC details found for this user"
    //             : "No KYC records found";
    //         throw this.customError;
    //     }

    //     // ------------------------------
    //     // 📌 Grouping rows by userId
    //     // ------------------------------
    //     const grouped: Record<number, any> = {};

    //     for (const row of rows) {
    //         if (!row.userId) continue; // LEFT JOIN safety

    //         const uid = row.userId;

    //         if (!grouped[uid]) {
    //             grouped[uid] = {
    //                 userId: uid,
    //                 userName: row.userName,
    //                 userEmail: row.userEmail,
    //                 userMobile: row.userMobile,
    //                 userRole: row.userRole,
    //                 blockStatus: row.blockStatus,
    //                 userCreatedAt: row.userCreatedAt,
    //                 kycDocuments: []
    //             };
    //         }

    //         grouped[uid].kycDocuments.push({
    //             detailId: row.detailId,
    //             kycType: row.kycType,
    //             kycDoc: row.kycDoc,
    //             docStatus: row.docStatus,
    //             kycCreatedAt: row.kycCreatedAt,
    //             kycUpdatedAt: row.kycUpdatedAt,
    //             comment: row.comment
    //         });
    //     }

    //     // If single user → return single object
    //     if (userId) {
    //         return Object.values(grouped)[0];
    //     }

    //     // Else return all users
    //     return Object.values(grouped);
    // }

    async getUserKycDetails(userDetails: UserDetails, page: number = 1, limit: number = 10, userId?: number,) {
        // -----------------------------
        // Pagination setup
        // -----------------------------
        page = Math.max(1, page);
        limit = Math.max(1, limit);
        const offset = (page - 1) * limit;

        // -----------------------------
        // Where conditions
        // -----------------------------
        const whereConditions = [
            eq(UserModel.blockStatus, "kyc-admin")
        ];

        if (userId) {
            whereConditions.push(eq(UserKycDetailsModel.userId, userId));
        }

        // -------------------------------------------------
        // 1. Count DISTINCT USERS (correct pagination)
        // -------------------------------------------------
        const totalRowsResult = await database
            .select({
                count: sql`COUNT(DISTINCT ${UserModel.userId})`.mapWith(Number)
            })
            .from(UserKycDetailsModel)
            .leftJoin(
                UserModel,
                eq(UserModel.userId, UserKycDetailsModel.userId)
            )
            .where(and(...whereConditions));
        const totalRecords = totalRowsResult[0].count;
        const totalPages = Math.ceil(totalRecords / limit);

        // If no records, return empty pagination structure
        if (totalRecords === 0) {
            return {
                success: true,
                page,
                limit,
                totalPages,
                totalRecords,
                data: []
            };
        }

        // -------------------------------------------------
        // 2. Find paginated USER IDs (grouped)
        // -------------------------------------------------
        const paginatedUsers = await database
            .select({
                userId: UserModel.userId
            })
            .from(UserKycDetailsModel)
            .leftJoin(
                UserModel,
                eq(UserModel.userId, UserKycDetailsModel.userId)
            )
            .where(and(...whereConditions))
            .groupBy(UserModel.userId)
            .limit(limit)
            .offset(offset);

        // Extract IDs (may contain null if leftJoin mismatch)
        const userIds = paginatedUsers.map(u => u.userId);

        // Filter null values (required for Drizzle inArray)
        const validUserIds = userIds.filter((id): id is number => id !== null && id !== undefined);

        if (validUserIds.length === 0) {
            return {
                success: true,
                page,
                limit,
                totalPages,
                totalRecords,
                data: []
            };
        }

        // -------------------------------------------------
        // 3. Fetch all KYC rows for ONLY these userIds
        // -------------------------------------------------

        const regionalManagerRecords = database
            .select({ zoneName: AddressModel.zoneName })
            .from(AddressModel)
            .where(
                eq(AddressModel.userId, Number(userDetails?.userId))
            )

        const rows = await database
            .select({
                // User fields
                userId: UserModel.userId,
                userName: UserModel.userName,
                userEmail: UserModel.userEmail,
                userMobile: UserModel.userMobile,
                userRole: RoleModel.roleName,
                blockStatus: UserModel.blockStatus,
                userCreatedAt: UserModel.createdAt,

                // KYC fields
                detailId: UserKycDetailsModel.detailId,
                kycType: UserKycDetailsModel.kycType,
                kycDoc: UserKycDetailsModel.kycDoc,
                docStatus: UserKycDetailsModel.docStatus,
                kycCreatedAt: UserKycDetailsModel.createdAt,
                kycUpdatedAt: UserKycDetailsModel.regionalUpdatedAt,
                comment: UserKycDetailsModel.regionalHeadComment,
                kycApproval: MechanicModel.kycApproval,
                workshopName: MechanicModel.workshopName,
                displayName: UserModel.displayName,
                retailerList: sql<PreferredRetailerList[]>`null`
            })
            .from(UserKycDetailsModel)
            .leftJoin(
                UserModel,
                eq(UserModel.userId, UserKycDetailsModel.userId)
            )
            .leftJoin(
                MechanicModel,
                eq(UserModel.userId, MechanicModel.userId)
            )
            .leftJoin(
                RoleModel,
                eq(UserModel.userRole, RoleModel.roleId)
            )
            .where(
                and(
                    inArray(UserKycDetailsModel.userId, validUserIds),
                    eq(UserModel.blockStatus, "kyc-admin"),
                    eq(UserKycDetailsModel.isActive, true),
                    Number(userDetails?.userRoleId) === ROLES.REGION_MANAGER ?
                        inArray(
                            UserModel.userId,
                            database
                                .select({ userId: AddressModel.userId })
                                .from(AddressModel)
                                .where(inArray(AddressModel.zoneName, regionalManagerRecords))
                        ) :
                        undefined
                )
            );



        const result = [...new Set(
            rows.flatMap(item => item?.kycDoc.split(',').map(Number)?.filter(Number))
        )]

        const retailerList = await this.getPreferredRetailersByUser(result)
        // -------------------------------------------------
        // 4. Group rows by userId
        // -------------------------------------------------
        const grouped: Record<number, any> = {};

        for (const row of rows) {
            const uid = row.userId;
            if (!uid) continue;
            let preferredRetailerList: PreferredRetailerList[] = []
            // console.log(row?.kycType,"cddsdc")
            if (row?.kycType == "preferred-retailers") {
                preferredRetailerList = retailerList?.filter(ele => row.kycDoc?.split(',')?.map(Number).filter(Number)?.includes(ele?.retailerId));
            }

            if (!grouped[uid]) {
                grouped[uid] = {
                    userId: uid,
                    userName: row.userName,
                    workshop: row.workshopName,
                    displayName: row.displayName,
                    userEmail: row.userEmail,
                    userMobile: row.userMobile,
                    userRole: row.userRole,
                    blockStatus: row.blockStatus,
                    userCreatedAt: row.userCreatedAt,
                    kycApproval: row?.kycApproval,
                    kycDocuments: [],
                    preferredRetailerList: [],
                };
            }

            if (row.kycType === "preferred-retailers") {
                const ids = row.kycDoc
                    ?.split(',')
                    ?.map(Number)
                    ?.filter(Boolean) || [];

                grouped[uid].preferredRetailerList = retailerList.filter(
                    r => ids.includes(r.retailerId)
                );
            }

            if (!grouped[uid].kycDocuments.some((doc: any) => doc.detailId === row.detailId)) {
                grouped[uid].kycDocuments.push({
                    detailId: row.detailId,
                    kycType: row.kycType,
                    kycDoc: ["aadhaar-back", "aadhaar-front", "pan-front"].includes(row.kycType) ? await fileMiddleware.getFileSignedUrl(row.kycDoc, row.kycType as any) : row?.kycDoc,
                    docStatus: row.docStatus,
                    kycCreatedAt: row.kycCreatedAt,
                    kycUpdatedAt: row.kycUpdatedAt,
                    comment: row.comment
                });
            }
        }

        // console.log(grouped)

        // -------------------------------------------------
        // 5. Final return
        // -------------------------------------------------

        let finalData = Object.values(grouped);

        if (convertToNumber(userDetails?.userRoleId) === ROLES.MARKETING_MANAGER) {
            finalData = finalData.filter((user: any) =>
                user.kycDocuments.every((doc: any) => ["Approved", "Completed"].includes(doc.docStatus))
            );
        } else if (convertToNumber(userDetails?.userRoleId) === ROLES.REGION_MANAGER) {
            finalData = finalData.filter((user: any) =>
                user.kycDocuments.some((doc: any) =>
                    doc.docStatus === "Pending" || doc.docStatus === "Rejected"
                )
            );
        }

        return {
            success: true,
            page,
            limit,
            totalPages,
            totalRecords,
            data: userId ? finalData?.[0] : finalData
        };
    }




    async updateKycStatuses(
        updates: { detailId: number; status: "Approved" | "Rejected" | "Completed"; comment?: string }[],
        adminDetails: UserDetails
    ) {
        if (!updates || updates.length === 0) {
            this.customError.responseMessage = "No update data provided";
            throw this.customError;
        }

        const detailIds = updates.map(u => u.detailId);

        return await database.transaction(async (tran) => {

            // Fetch existing docs
            const existingDocs = await tran
                .select()
                .from(UserKycDetailsModel)
                .where(
                    and(
                        inArray(UserKycDetailsModel.detailId, detailIds),
                        eq(UserKycDetailsModel.isActive, true)
                    )
                );

            const failed: any[] = [];
            const validToUpdate: any[] = [];
            const userId: number[] = [];

            // Validate all docs
            for (const updateItem of updates) {
                const doc = existingDocs.find(d => d.detailId === updateItem.detailId);

                if (!doc) {
                    failed.push({
                        detailId: updateItem.detailId,
                        error: "Invalid detailId"
                    });
                    continue;
                }

                if (doc.docStatus === "Completed") {
                    failed.push({
                        detailId: doc.detailId,
                        error: "Already approved by Market Manager"
                    });
                    continue;
                }

                if (doc.docStatus === "Rejected") {
                    failed.push({
                        detailId: doc.detailId,
                        error: "Already rejected"
                    });
                    continue;
                }

                // Valid item → push for update
                validToUpdate.push(updateItem);
            }

            const updated: any[] = [];

            // Process only valid updates
            for (const item of validToUpdate) {
                let updatePayload: Partial<InferInsertModel<typeof UserKycDetailsModel>>;
                if (convertToNumber(adminDetails?.userRoleId) == ROLES.MARKETING_MANAGER) {
                    updatePayload = {
                        marketingHeadComment: item?.comment,
                        marketingHeadDocStatus: item?.status,
                        docStatus: item?.status,
                        marketingHeadUpdatedBy: adminDetails?.userId,
                        marketingHeadUpdatedAt: new Date(),
                    }
                } else if (convertToNumber(adminDetails?.userRoleId) == ROLES.REGION_MANAGER) {
                    updatePayload = {
                        regionalHeadComment: item?.comment,
                        regionalHeadDocStatus: item?.status,
                        docStatus: item?.status,
                        regionalUpdatedBy: adminDetails?.userId,
                        regionalUpdatedAt: new Date(),
                    }
                } else {
                    this.customError.responseMessage = "Invalid Admin Approval Request";
                    throw this.customError;
                }
                const [res] = await tran
                    .update(UserKycDetailsModel)
                    .set(updatePayload)
                    .where(
                        and(
                            eq(UserKycDetailsModel.detailId, item.detailId),
                            eq(UserKycDetailsModel.isActive, true)
                        )
                    )
                    .returning();

                updated.push(res);
            }


            for await (let element of existingDocs) {

                const kycList = await tran.select().from(UserKycDetailsModel).where(
                    and(
                        eq(UserKycDetailsModel.userId, element?.userId),
                        eq(UserKycDetailsModel.isActive, true),
                    )
                )

                if (kycList?.filter(ele => ["Pending", "Rejected", "Approved"].includes(ele?.docStatus))?.length == 0) {

                    await tran.update(MechanicModel).set({
                        kycApproval: true,
                        referralCode: generateRandomToken(9)
                    }).where(
                        and(
                            eq(MechanicModel.userId, element?.userId)
                        )
                    )

                    await tran.update(UserModel).set({
                        blockStatus: "tds-consent"
                    }).where(
                        and(
                            eq(UserModel.userId, element?.userId)
                        )
                    )

                    const [registrationPoints] = await tran.select().from(PointConfigurationModel).where(
                        and(
                            eq(PointConfigurationModel.configType, "Registration")
                        )
                    )
                        .limit(1);

                    await NotificationMiddleware.notifyKycApproved(element?.userId, Number(registrationPoints.points || 0) || 0)
                }
            }


            return {
                updatedCount: updated.length,
                failedCount: failed.length,
                updated,
                failed
            };
        });
    }

    async getPreferredRetailersByUser(retailerId: number[]) {
        const retailers = await database
            .select({
                retailerId: RetailerModel.retailerId,
                mobile: RetailerModel.mobileNumber,
                name: RetailerModel.retailerName,
                pincode: RetailerModel.currentPincode
            })
            .from(RetailerModel)
            .where(
                and(
                    inArray(RetailerModel.retailerId, retailerId),
                    eq(RetailerModel.isActive, true)
                )
            );
        return retailers || []
    }

    async resolveWorkshopIdForMechanic(userId: number, fallbackWorkshopName?: string) {
        const [mechanic] = await database
            .select({ workshopName: MechanicModel.workshopName })
            .from(MechanicModel)
            .where(eq(MechanicModel.userId, userId))
            .limit(1);

        const workshopName =
            mechanic?.workshopName?.trim() ||
            (typeof fallbackWorkshopName === "string" ? fallbackWorkshopName.trim() : "");
        if (!workshopName) {
            this.customError.responseMessage =
                "No workshop ID available for this user. Set workshop name on your mechanic profile, or call this API with ?workshopId=<id>.";
            this.customError.statusCode = 400;
            throw this.customError;
        }

        const [existingWorkshop] = await database
            .select({ workshopId: workshop.workshopId })
            .from(workshop)
            .where(eq(workshop.workshopName, workshopName))
            .limit(1);

        if (existingWorkshop?.workshopId) {
            return existingWorkshop.workshopId;
        }

        const [insertedWorkshop] = await database
            .insert(workshop)
            .values({ workshopName })
            .returning({ workshopId: workshop.workshopId });

        return insertedWorkshop.workshopId;
    }

    async createPurchasingRetailer(userDetails: UserDetails, payload: PurchasingRetailerCreatePayload) {
        const [workshop] = await database.select().from(MechanicModel).where(eq(MechanicModel.userId, userDetails.userId)).limit(1);
        const workshopId = Number(workshop?.mappedRetailers)
        const mobile = removeSpace(payload.mobile);

        return database.transaction(async (tran) => {

            const [existingUser] = await tran
                .select()
                .from(UserModel)
                .where(eq(UserModel.userMobile, mobile))
                .limit(1);

            const [existingWorshop] = await tran
                .select()
                .from(RetailerModel)
                .where(eq(RetailerModel.mobileNumber, mobile))
                .limit(1);

            if (existingWorshop?.mobileNumber || existingUser?.userMobile) {
                this.customError.responseMessage = "This mobile number is not eligible for retailers";
                throw this.customError;
            }

            const [existingRetailer] = await tran
                .select()
                .from(PurchasingRetailersModel)
                .where(eq(PurchasingRetailersModel.mobile, mobile))
                .limit(1);

            let purchasingRetailerId: number;
            if (existingRetailer) {
                purchasingRetailerId = existingRetailer.retailerId;
            } else {
                const [inserted] = await tran
                    .insert(PurchasingRetailersModel)
                    .values({
                        shopName: payload.shopName.trim(),
                        address: payload.address.trim(),
                        mobile,
                    })
                    .returning({ retailerId: PurchasingRetailersModel.retailerId });
                purchasingRetailerId = inserted.retailerId;
            }

            const [activeMapping] = await tran
                .select()
                .from(RetailerMappingModel)
                .where(
                    and(
                        eq(RetailerMappingModel.workshopId, workshopId),
                        eq(RetailerMappingModel.purchasingRetailerId, purchasingRetailerId),
                        eq(RetailerMappingModel.isActive, true),
                    ),
                )
                .limit(1);

            if (activeMapping) {
                this.customError.responseMessage = "This retailer is already linked to your workshop";
                throw this.customError;
            }

            const [mapping] = await tran
                .insert(RetailerMappingModel)
                .values({
                    workshopId,
                    purchasingRetailerId,
                    createdBy: userDetails.userId,
                    isActive: true,
                })
                .returning({
                    mappingId: RetailerMappingModel.mappingId,
                    purchasingRetailerId: RetailerMappingModel.purchasingRetailerId,
                });

            return {
                mappingId: mapping.mappingId,
                purchasingRetailerId: mapping.purchasingRetailerId,
            };
        });
    }

    async editPurchasingRetailer(userDetails: UserDetails, payload: PurchasingRetailerEditPayload) {
        const workshopId = await this.resolveWorkshopIdForMechanic(userDetails.userId, userDetails.workshopName);

        const [updated] = await database
            .update(RetailerMappingModel)
            .set({ isActive: false })
            .where(
                and(
                    eq(RetailerMappingModel.mappingId, payload.mappingId),
                    eq(RetailerMappingModel.workshopId, workshopId),
                ),
            )
            .returning({ mappingId: RetailerMappingModel.mappingId });

        if (!updated) {
            this.customError.responseMessage = "Mapping not found or access denied";
            throw this.customError;
        }
        return updated;
    }

    async listPurchasingRetailers(userDetails: UserDetails, _includeInactive: boolean, page: number = 1, limit: number = 10) {
        const offset = (page - 1) * limit;

        const [workshop] = await database.select().from(UserKycDetailsModel).where(
            and(
                eq(UserKycDetailsModel.userId, userDetails?.userId as number),
                eq(UserKycDetailsModel.kycType, "preferred-retailers"),
                eq(UserKycDetailsModel.isActive, true),
            )
        ).limit(1)

        const totalRows = await database
            .select({ count: sql`COUNT(*)`.mapWith(Number) })
            .from(PurchasingRetailersModel);

        const totalRecords = totalRows?.[0]?.count || 0;
        const totalPages = totalRecords === 0 ? 0 : Math.ceil(totalRecords / limit);

        if (totalRecords === 0) {
            return {
                success: true,
                page,
                limit,
                totalRecords,
                totalPages,
                data: [],
            };
        }

        const data = await database
            .select({
                retailerId: PurchasingRetailersModel.retailerId,
                shopName: PurchasingRetailersModel.shopName,
                address: PurchasingRetailersModel.address,
                mobile: PurchasingRetailersModel.mobile,
                isMapped: sql<boolean>`CASE WHEN ${RetailerMappingModel.mappingId} IS NOT NULL AND ${RetailerMappingModel.isActive} = true THEN true ELSE false END`,
            })
            .from(PurchasingRetailersModel)
            .leftJoin(
                RetailerMappingModel,
                and(
                    eq(RetailerMappingModel.purchasingRetailerId, PurchasingRetailersModel.retailerId),
                    eq(RetailerMappingModel.workshopId, Number(workshop?.kycDoc || 0) || 0),
                    eq(RetailerMappingModel.isActive, true),
                ),
            )
            .orderBy(desc(PurchasingRetailersModel.retailerId))
            .limit(limit)
            .offset(offset);

        return {
            success: true,
            page,
            limit,
            totalRecords,
            totalPages,
            data,
        };
    }

    async updateProfileImage(url: string, userId: number) {
        if (url) {
            await database.update(MechanicModel).set({
                profileUrl: url
            })
                .where(
                    eq(MechanicModel.userId, userId)
                )
        }
    }

    async getRetailerWorkshopMappings(payload: RetailerWorkshopMappingsQueryPayload, userDetails?: UserDetails) {
        const offset = (payload.page - 1) * payload.limit;

        const [workshop] = await database.select().from(UserKycDetailsModel).where(
            and(
                eq(UserKycDetailsModel.userId, userDetails?.userId as number),
                eq(UserKycDetailsModel.kycType, "preferred-retailers"),
                eq(UserKycDetailsModel.isActive, true),
            )
        ).limit(1)
        const workshopId = Number(workshop?.kycDoc || 0) || 0;

        const [totalRows] = await database
            .select({ count: sql`COUNT(*)`.mapWith(Number) })
            .from(PurchasingRetailersModel);

        const totalRecords = totalRows?.count || 0;
        const totalPages = Math.ceil(totalRecords / payload.limit);

        const data = await database
            .select({
                retailerId: PurchasingRetailersModel.retailerId,
                shopName: PurchasingRetailersModel.shopName,
                address: PurchasingRetailersModel.address,
                mobile: PurchasingRetailersModel.mobile,
                workshopId: sql<number | null>`${RetailerMappingModel.workshopId}`,
                mappingId: sql<number | null>`${RetailerMappingModel.mappingId}`,
                isActive: sql<boolean | null>`${RetailerMappingModel.isActive}`,
                isMapped: sql<boolean>`CASE WHEN ${RetailerMappingModel.mappingId} IS NOT NULL AND ${RetailerMappingModel.isActive} = true THEN true ELSE false END`,
            })
            .from(PurchasingRetailersModel)
            .leftJoin(
                RetailerMappingModel,
                and(
                    eq(RetailerMappingModel.purchasingRetailerId, PurchasingRetailersModel.retailerId),
                    eq(RetailerMappingModel.workshopId, workshopId),
                    eq(RetailerMappingModel.isActive, true),
                ),
            )
            .where(
                and(
                    payload?.workshopId ? eq(RetailerMappingModel.workshopId, Number(workshopId)) : undefined,
                )
            )
            .orderBy(desc(PurchasingRetailersModel.retailerId))
            .limit(payload.limit)
            .offset(offset);

        return {
            page: payload.page,
            limit: payload.limit,
            totalRecords,
            totalPages,
            data
        };
    }

    async mapRetailerWorkshop(payload: number[], userDetails: UserDetails) {
        const [workshop] = await database.select().from(UserKycDetailsModel).where(
            and(
                eq(UserKycDetailsModel.userId, userDetails?.userId as number),
                eq(UserKycDetailsModel.kycType, "preferred-retailers"),
                eq(UserKycDetailsModel.isActive, true),
            )
        ).limit(1)
        const workshopId = Number(workshop?.kycDoc || 0) || 0;

        const existingMapping = await database.select().from(RetailerMappingModel).where(
            and(
                eq(RetailerMappingModel.workshopId, workshopId),
                eq(RetailerMappingModel.isActive, true)
            )
        )
        console.log(existingMapping?.map(ele => ele.purchasingRetailerId), "existing");
        let removalPurchaseRetailerId = [];
        let additionPurchaseRetailerId = [];

        for (const retailerId of existingMapping?.map(ele => ele.purchasingRetailerId) || []) {
            if (!payload.includes(retailerId)) {
                removalPurchaseRetailerId.push(retailerId);
            }
        }

        for (const retailerId of payload || []) {
            if (!existingMapping?.map(ele => ele.purchasingRetailerId).includes(retailerId)) {
                additionPurchaseRetailerId.push(retailerId);
            }
        }
        await database.transaction(async (tx) => {
            if (removalPurchaseRetailerId.length > 0) {
                await tx.update(RetailerMappingModel).set({ isActive: false }).where(
                    and(
                        eq(RetailerMappingModel.workshopId, workshopId),
                        inArray(RetailerMappingModel.purchasingRetailerId, removalPurchaseRetailerId)
                    )
                )
            }

            if (additionPurchaseRetailerId.length > 0) {
                await tx.insert(RetailerMappingModel).values(
                    additionPurchaseRetailerId.map((retailerId) => ({
                        workshopId: workshopId,
                        purchasingRetailerId: retailerId,
                        createdBy: userDetails?.userId as number,
                    })))
            }
        })
        console.log("removal", removalPurchaseRetailerId, "addition", additionPurchaseRetailerId)
    }

    async editRetailerWorkshopMappings(payloads: RetailerWorkshopMapActionPayload[], userDetails: UserDetails) {
        const results = [];

        for (const payload of payloads) {
            const [existingWorkshop] = await database
                .select({ workshopId: workshop.workshopId })
                .from(workshop)
                .where(eq(workshop.workshopId, payload.workshopId))
                .limit(1);
            if (!existingWorkshop) {
                this.customError.responseMessage = `Workshop not found for workshopId ${payload.workshopId}`;
                throw this.customError;
            }

            const [existingRetailer] = await database
                .select({ retailerId: PurchasingRetailersModel.retailerId })
                .from(PurchasingRetailersModel)
                .where(eq(PurchasingRetailersModel.retailerId, payload.purchasingRetailerId))
                .limit(1);
            if (!existingRetailer) {
                this.customError.responseMessage = `Retailer not found for purchasingRetailerId ${payload.purchasingRetailerId}`;
                throw this.customError;
            }

            if (payload.isActive) {
                const [activeMapping] = await database
                    .select({
                        mappingId: RetailerMappingModel.mappingId,
                        workshopId: RetailerMappingModel.workshopId,
                        purchasingRetailerId: RetailerMappingModel.purchasingRetailerId,
                    })
                    .from(RetailerMappingModel)
                    .where(
                        and(
                            eq(RetailerMappingModel.workshopId, payload.workshopId),
                            eq(RetailerMappingModel.purchasingRetailerId, payload.purchasingRetailerId),
                            eq(RetailerMappingModel.isActive, true),
                        ),
                    )
                    .limit(1);

                if (activeMapping) {
                    results.push({
                        ...activeMapping,
                        isActive: true,
                        action: "map",
                        status: "already_mapped",
                    });
                    continue;
                }

                const [inactiveMapping] = await database
                    .select({
                        mappingId: RetailerMappingModel.mappingId,
                    })
                    .from(RetailerMappingModel)
                    .where(
                        and(
                            eq(RetailerMappingModel.workshopId, payload.workshopId),
                            eq(RetailerMappingModel.purchasingRetailerId, payload.purchasingRetailerId),
                            eq(RetailerMappingModel.isActive, false),
                        ),
                    )
                    .limit(1);

                if (inactiveMapping) {
                    const [reactivatedMapping] = await database
                        .update(RetailerMappingModel)
                        .set({
                            isActive: true,
                            createdBy: userDetails.userId,
                        })
                        .where(eq(RetailerMappingModel.mappingId, inactiveMapping.mappingId))
                        .returning({
                            mappingId: RetailerMappingModel.mappingId,
                            workshopId: RetailerMappingModel.workshopId,
                            purchasingRetailerId: RetailerMappingModel.purchasingRetailerId,
                            isActive: RetailerMappingModel.isActive,
                        });
                    results.push({
                        ...reactivatedMapping,
                        action: "map",
                        status: "reactivated",
                    });
                    continue;
                }

                const [newMapping] = await database
                    .insert(RetailerMappingModel)
                    .values({
                        workshopId: payload.workshopId,
                        purchasingRetailerId: payload.purchasingRetailerId,
                        createdBy: userDetails.userId,
                        isActive: true,
                    })
                    .returning({
                        mappingId: RetailerMappingModel.mappingId,
                        workshopId: RetailerMappingModel.workshopId,
                        purchasingRetailerId: RetailerMappingModel.purchasingRetailerId,
                        isActive: RetailerMappingModel.isActive,
                    });
                results.push({
                    ...newMapping,
                    action: "map",
                    status: "created",
                });
                continue;
            }

            const [activeMapping] = await database
                .select({
                    mappingId: RetailerMappingModel.mappingId,
                })
                .from(RetailerMappingModel)
                .where(
                    and(
                        eq(RetailerMappingModel.workshopId, payload.workshopId),
                        eq(RetailerMappingModel.purchasingRetailerId, payload.purchasingRetailerId),
                        eq(RetailerMappingModel.isActive, true),
                    ),
                )
                .limit(1);

            if (!activeMapping) {
                results.push({
                    workshopId: payload.workshopId,
                    purchasingRetailerId: payload.purchasingRetailerId,
                    action: "de-map",
                    status: "already_de_mapped_or_not_found",
                });
                continue;
            }

            const deMapped = await this.deMapRetailerWorkshop(activeMapping.mappingId);
            results.push({
                ...deMapped,
                workshopId: payload.workshopId,
                purchasingRetailerId: payload.purchasingRetailerId,
                action: "de-map",
                status: "success",
            });
        }

        return results;
    }

    async deMapRetailerWorkshop(mappingId: number) {
        const [updated] = await database
            .update(RetailerMappingModel)
            .set({ isActive: false })
            .where(
                and(
                    eq(RetailerMappingModel.mappingId, mappingId),
                    eq(RetailerMappingModel.isActive, true),
                ),
            )
            .returning({
                mappingId: RetailerMappingModel.mappingId,
                isActive: RetailerMappingModel.isActive,
            });

        if (!updated) {
            const [existingMapping] = await database
                .select({
                    mappingId: RetailerMappingModel.mappingId,
                    isActive: RetailerMappingModel.isActive,
                })
                .from(RetailerMappingModel)
                .where(eq(RetailerMappingModel.mappingId, mappingId))
                .limit(1);

            this.customError.responseMessage = existingMapping
                ? "This id is already set to false"
                : "Mapping not found";
            throw this.customError;
        }

        return updated;
    }
}

export const kycRepository = new KycRepository();
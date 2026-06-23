import { database } from "../server"; // your drizzle instance
import { InventoryBatch, InventoryModel, MechanicModel, PointConfigurationModel, SkuMasterModel, SubCategoryModel, TransactionModel, UserModel } from "../schemas";
import { eq, sql, inArray, and, count, desc, gte, lte, SQL, InferSelectModel, InferInsertModel, getTableColumns } from "drizzle-orm";
import { CustomError, InventoryDetails, InventoryRaw, ProductScan, UserDetails } from "../types";
import { passbookRepository } from "./passbook-repository";
import { TRANSACTION_ENUM_TYPE } from "../utils/constant";
import { userRepository } from "./user-repository";
import { customValidators } from "../utils/custom-validators";
import { kycRepository } from "./kyc-repository";
import { calculateTDSValue, convertToNumber, deductedTDSEarnedPoint } from "../utils/random";

interface InventoryInput {
    serialNumber: string;
    batchId: number;
    isActive?: boolean;
}

class InventoryRepository {
    customError: CustomError;

    constructor() {
        this.customError = new CustomError({
            responseCode: 400,
            responseMessage: "",
        });
    }

    async getInventoryByBatchId(batchId: number) {
        try {
            const inventory = await database
                .select()
                .from(InventoryModel)
                .where(eq(InventoryModel.batchId, batchId))
                .execute();

            if (!inventory || inventory.length === 0) {
                throw new Error("No inventory found for the given batch ID.");
            }

            return inventory;
        } catch (error: any) {
            this.customError.responseMessage = error.message;
            throw this.customError;
        }
    }
    async getInventoryBySerialNumber(serialNumber: string): Promise<InventoryRaw | null> {
        try {
            const inventory = await database
                .select()
                .from(InventoryModel)
                .where(eq(InventoryModel.serialNumber, serialNumber))
                .execute();
            return inventory[0];
        } catch (error: any) {
            this.customError.responseMessage = error.message;
            throw this.customError;
        }
    }

    async productScan(payload: ProductScan, userDetails: UserDetails) {
        return await database.transaction(async (tran) => {
            const [userData] = await tran.select().from(MechanicModel).where(eq(MechanicModel.userId, userDetails.userId)).limit(1)
            if (!userData?.kycApproval) {
                this.customError.responseMessage = "Your KYC is in pending, you can resume your scan once admin aprroves the KYC";
                throw this.customError;
            }
            const [inventoryDetails] = await tran
                .select({
                    serialNumber: InventoryModel.serialNumber,
                    qrActive: InventoryModel.isActive,
                    isQrScanned: InventoryModel.isQrScanned,
                    skuCode: sql<string>`${InventoryBatch.skuCode}`,
                    skuActive: sql<boolean>`${SkuMasterModel.isActive}`,
                    points: sql<string>`${SkuMasterModel.points}`,
                    productValue: sql<string>`${SkuMasterModel.productValue}`
                })
                .from(InventoryModel)
                .leftJoin(InventoryBatch, eq(InventoryModel.batchId, InventoryBatch.batchId))
                .leftJoin(SkuMasterModel, eq(InventoryBatch.skuCode, SkuMasterModel.skuCode))
                .where(
                    eq(InventoryModel.serialNumber, payload?.qr),
                ).limit(1);

            await this.couponInventoryValidator(
                payload,
                userDetails,
                inventoryDetails
            )

            const updatedInventory = await tran.update(InventoryModel).set({ isQrScanned: true }).where(
                and(
                    eq(InventoryModel.isActive, true),
                    eq(InventoryModel.isQrScanned, false),
                    eq(InventoryModel.serialNumber, inventoryDetails?.serialNumber)
                )
            )

            if (!updatedInventory?.rowCount || updatedInventory?.rowCount == 0) {
                this.customError.responseMessage = "Serial number is already scanned";
                this.customError.responseCode = 206;
                throw this.customError;
            }

            const [insertedTransaction] = await tran.insert(TransactionModel).values({
                serialNumber: inventoryDetails?.serialNumber,
                productValue: inventoryDetails?.productValue || "0",
                skuCode: inventoryDetails?.skuCode,
                totalPoints: inventoryDetails?.points,
                baseSchemePoints: inventoryDetails?.points,
                transactionMessage: "success",
                transactionStatus: "Success",
                createdAt: new Date(),
                createdBy: userDetails?.userId,
                userId: userDetails?.userId,
                source: "APP",// add proper data
                ipAddress: "",// add proper data
                latitude: "",// add proper data
                longitude: "",// add proper data
                schemeId: null// add proper data
            }).returning(getTableColumns(TransactionModel))

            const pointToBeEarned = deductedTDSEarnedPoint(inventoryDetails?.points, userDetails?.tdsSlabs)

            await tran.update(MechanicModel).set({
                earnedPoints: sql`${MechanicModel.earnedPoints} + ${inventoryDetails?.points}`,
                redeemablePoints: sql`${MechanicModel.redeemablePoints} + ${pointToBeEarned}`,
                balancePoints: sql`${MechanicModel.balancePoints} + ${pointToBeEarned}`,
                currentYearEarnedPoints: sql`${MechanicModel.currentYearEarnedPoints} + ${inventoryDetails?.points}`,
                tdsKitty: sql`${MechanicModel.tdsKitty} + ${calculateTDSValue(inventoryDetails?.points, userDetails?.tdsSlabs)}`,
                scannedPoints: sql`${MechanicModel.scannedPoints} + ${Number(inventoryDetails?.points || "0")}`,
            })
                .where(
                    eq(MechanicModel.userId, userDetails?.userId)
                )



            await passbookRepository.addTransaction(
                userDetails?.userId,
                TRANSACTION_ENUM_TYPE.QR_SCAN,
                Number(inventoryDetails?.points),
                {
                    serialNumber: inventoryDetails?.serialNumber,
                },
                tran
            );

            await this.tdsInsertionOnScan(
                inventoryDetails?.points,
                userDetails?.tdsSlabs,
                userData?.userId,
                tran
            )

            return {
                ...inventoryDetails,
                points: inventoryDetails?.points
            }
        })
    }

    async tdsInsertionOnScan(
        scanPoints: string | number = 0,
        tdsSlab: string | number = 0,
        userId: number,
        tran: Parameters<Parameters<typeof database.transaction>[0]>[0]
    ) {

        await kycRepository.storeTdsTrack(userId, {
            earnType: "scan",
            earnedPoints: deductedTDSEarnedPoint(scanPoints, tdsSlab),
            tdsDeducted: calculateTDSValue(scanPoints, tdsSlab),
            totalPoints: convertToNumber(scanPoints),
            tdsSlab: tdsSlab,
            metaData: {
                refererUserId: userId
            }
        }, tran)

    }

    // async bulkProductScan(payload: ProductScan, userCode: string) {
    //     return await database.transaction(async (tran) => {
    //         const userDetails = await userRepository.getUserDetailsByUserCode(userCode);
    //         const [userData] = await tran.select().from(MechanicModel).where(eq(MechanicModel.userId, userDetails.userId)).limit(1)
    //         if (!userData?.kycApproval) {
    //             this.customError.responseMessage = "Your KYC is in pending, you can resume your scan once admin aprroves the KYC";
    //             throw this.customError;
    //         }
    //         const [inventoryDetails] = await tran
    //             .select({
    //                 serialNumber: InventoryModel.serialNumber,
    //                 qrActive: InventoryModel.isActive,
    //                 isQrScanned: InventoryModel.isQrScanned,
    //                 skuCode: sql<string>`${InventoryBatch.skuCode}`,
    //                 skuActive: sql<boolean>`${SkuMasterModel.isActive}`,
    //                 points: sql<string>`${SkuMasterModel.points}`,
    //                 productValue: sql<string>`${SkuMasterModel.productValue}`
    //             })
    //             .from(InventoryModel)
    //             .leftJoin(InventoryBatch, eq(InventoryModel.batchId, InventoryBatch.batchId))
    //             .leftJoin(SkuMasterModel, eq(InventoryBatch.skuCode, SkuMasterModel.skuCode))
    //             .where(
    //                 eq(InventoryModel.serialNumber, payload?.qr),
    //             ).limit(1);

    //         await this.couponInventoryValidator(
    //             payload,
    //             userDetails,
    //             inventoryDetails
    //         )

    //         // all those error should be captured in database

    //         const updatedInventory = await tran.update(InventoryModel).set({ isQrScanned: true }).where(
    //             and(
    //                 eq(InventoryModel.isActive, true),
    //                 eq(InventoryModel.isQrScanned, false),
    //                 eq(InventoryModel.serialNumber, inventoryDetails?.serialNumber)
    //             )
    //         )

    //         if (!updatedInventory?.rowCount || updatedInventory?.rowCount == 0) {
    //             this.customError.responseMessage = "Serial number is already scanned";
    //             this.customError.responseCode = 206;
    //             throw this.customError;
    //         }

    //         await tran.insert(TransactionModel).values({
    //             serialNumber: inventoryDetails?.serialNumber,
    //             productValue: inventoryDetails?.productValue || "0",
    //             skuCode: inventoryDetails?.skuCode,
    //             totalPoints: inventoryDetails?.points,
    //             baseSchemePoints: inventoryDetails?.points,
    //             transactionMessage: "success",
    //             transactionStatus: "Success",
    //             createdAt: new Date(),
    //             createdBy: userDetails?.userId,
    //             userId: userDetails?.userId,
    //             source: "APP",// add proper data
    //             ipAddress: "",// add proper data
    //             latitude: "",// add proper data
    //             longitude: "",// add proper data
    //             schemeId: null// add proper data
    //         })

    //         await tran.update(MechanicModel).set({
    //             earnedPoints: sql`${MechanicModel.earnedPoints} + ${Number(inventoryDetails?.points || "0")}`,
    //             scannedPoints: sql`${MechanicModel.scannedPoints} + ${Number(inventoryDetails?.points || "0")}`,
    //             balancePoints: sql`${MechanicModel.balancePoints} + ${Number(inventoryDetails?.points || "0")}`,
    //         })
    //             .where(
    //                 eq(MechanicModel.userId, userDetails?.userId)
    //             )

    //         await passbookRepository.addTransaction(
    //             userDetails,
    //             TRANSACTION_ENUM_TYPE.QR_SCAN,
    //             Number(inventoryDetails?.points),
    //             {
    //                 reference: inventoryDetails.serialNumber,
    //             }
    //         );

    //         return {
    //             ...inventoryDetails,
    //             points: inventoryDetails?.points
    //         }
    //     })
    // }

    async bulkProductScanForMultipleUsers(
        items: { userCode: string; payload: ProductScan }[]
    ) {
        return await database.transaction(async (tran) => {
            const results: {
                success: {
                    userCode: string;
                    qr: string;
                    points: string;
                    productValue?: string;
                    skuCode?: string;
                }[];
                failed: { userCode: string; qr: string; error: string }[];
            } = {
                success: [],
                failed: []
            };

            for (const item of items) {
                const { userCode, payload } = item;
                const qr = payload.qr;

                try {
                    // --------------------------
                    // 1) Load user details (by userCode)
                    // --------------------------
                    const userDetails = await userRepository.getUserDetailsByUserCode(userCode);

                    // Run your existing per-scan validator which checks blockStatus etc.
                    // Assuming productScan validator is available on customValidators
                    try {
                        // This will throw if blockStatus or payload.qr invalid
                        customValidators.productScan(payload, userDetails);
                    } catch (err: any) {
                        results.failed.push({
                            userCode,
                            qr,
                            error: err?.responseMessage || "User/block validation failed"
                        });
                        continue;
                    }

                    // --------------------------
                    // 1.5) Additional KYC check from MechanicModel (keeps previous behavior)
                    // --------------------------
                    const [userData] = await tran
                        .select()
                        .from(MechanicModel)
                        .where(eq(MechanicModel.userId, userDetails.userId))
                        .limit(1);

                    if (!userData?.kycApproval) {
                        results.failed.push({
                            userCode,
                            qr,
                            error: "Your KYC is pending. You can resume scanning once admin approves the KYC."
                        });
                        continue;
                    }

                    // --------------------------
                    // 2) Fetch inventory details (typed)
                    // --------------------------
                    const [inventoryDetails] = await tran
                        .select({
                            serialNumber: InventoryModel.serialNumber,
                            qrActive: InventoryModel.isActive,
                            isQrScanned: InventoryModel.isQrScanned,
                            skuCode: sql<string>`${InventoryBatch.skuCode}`,
                            skuActive: sql<boolean>`${SkuMasterModel.isActive}`,
                            points: sql<string>`${SkuMasterModel.points}`,
                            productValue: sql<string>`${SkuMasterModel.productValue}`
                        })
                        .from(InventoryModel)
                        .leftJoin(InventoryBatch, eq(InventoryModel.batchId, InventoryBatch.batchId))
                        .leftJoin(SkuMasterModel, eq(InventoryBatch.skuCode, SkuMasterModel.skuCode))
                        .where(eq(InventoryModel.serialNumber, qr))
                        .limit(1);

                    if (!inventoryDetails) {
                        results.failed.push({
                            userCode,
                            qr,
                            error: "QR not found in inventory"
                        });
                        continue;
                    }

                    // --------------------------
                    // 3) Validate coupon/inventory using existing validator
                    //    (it may throw; catch and push to failed)
                    // --------------------------
                    try {
                        // note: couponInventoryValidator signature: (payload, userDetails, inventoryDetails)
                        await this.couponInventoryValidator(payload, userDetails, inventoryDetails);
                    } catch (err: any) {
                        results.failed.push({
                            userCode,
                            qr,
                            error: err?.responseMessage || "Coupon validation failed"
                        });
                        continue;
                    }

                    // --------------------------
                    // 4) Mark QR as scanned (safe conditional update)
                    // --------------------------
                    const updateResult = await tran
                        .update(InventoryModel)
                        .set({ isQrScanned: true })
                        .where(
                            and(
                                eq(InventoryModel.isActive, true),
                                eq(InventoryModel.isQrScanned, false),
                                eq(InventoryModel.serialNumber, inventoryDetails.serialNumber)
                            )
                        );

                    if (!updateResult.rowCount) {
                        results.failed.push({
                            userCode,
                            qr,
                            error: "QR already scanned"
                        });
                        continue;
                    }

                    // --------------------------
                    // 5) Insert transaction record
                    // --------------------------
                    await tran.insert(TransactionModel).values({
                        serialNumber: inventoryDetails.serialNumber,
                        productValue: inventoryDetails.productValue || "0",
                        skuCode: inventoryDetails.skuCode,
                        totalPoints: inventoryDetails.points,
                        baseSchemePoints: inventoryDetails.points,
                        transactionMessage: "success",
                        transactionStatus: "Success",
                        createdAt: new Date(),
                        createdBy: userDetails.userId,
                        userId: userDetails.userId,
                        source: "APP",
                        ipAddress: "",
                        latitude: "",
                        longitude: "",
                        schemeId: null
                    });

                    // --------------------------
                    // 6) Update user wallet points
                    // --------------------------

                    const pointToBeEarned = deductedTDSEarnedPoint(inventoryDetails?.points, userDetails?.tdsSlabs)

                    await tran
                        .update(MechanicModel)
                        .set({
                            earnedPoints: sql`${MechanicModel.earnedPoints} + ${inventoryDetails?.points}`,
                            redeemablePoints: sql`${MechanicModel.redeemablePoints} + ${pointToBeEarned}`,
                            balancePoints: sql`${MechanicModel.balancePoints} + ${pointToBeEarned}`,
                            currentYearEarnedPoints: sql`${MechanicModel.currentYearEarnedPoints} + ${inventoryDetails?.points}`,
                            tdsKitty: sql`${MechanicModel.tdsKitty} + ${calculateTDSValue(inventoryDetails?.points, userDetails?.tdsSlabs)}`,
                            scannedPoints: sql`${MechanicModel.scannedPoints} + ${Number(inventoryDetails?.points || "0")}`,
                        })
                        .where(eq(MechanicModel.userId, userDetails.userId));

                    // --------------------------
                    // 7) Add passbook entry
                    // --------------------------
                    await passbookRepository.addTransaction(
                        userDetails?.userId,
                        TRANSACTION_ENUM_TYPE.QR_SCAN,
                        Number(inventoryDetails?.points),
                        { serialNumber: inventoryDetails.serialNumber },
                        tran
                    );

                    await this.tdsInsertionOnScan(
                        inventoryDetails?.points,
                        userDetails?.tdsSlabs,
                        userData?.userId,
                        tran
                    )

                    // --------------------------
                    // success push
                    // --------------------------
                    results.success.push({
                        userCode,
                        qr: inventoryDetails.serialNumber,
                        points: inventoryDetails.points,
                        productValue: inventoryDetails.productValue,
                        skuCode: inventoryDetails.skuCode
                    });

                } catch (err: any) {
                    // any unexpected error per item
                    results.failed.push({
                        userCode: item.userCode,
                        qr: item.payload?.qr || "",
                        error: err?.responseMessage || err?.message || "Unknown error"
                    });
                }
            }

            return {
                message: "Bulk multi-user scan completed",
                successCount: results.success.length,
                failedCount: results.failed.length,
                ...results
            };
        });
    }


    // async bulkProductScanForMultipleUsers(
    //     items: { userCode: string; payload: ProductScan }[]
    // ) {
    //     return await database.transaction(async (tran) => {
    //         const results: {
    //             success: any[];
    //             failed: { userCode: string; qr: string; error: string }[];
    //         } = {
    //             success: [],
    //             failed: []
    //         };

    //         for (const item of items) {
    //             const { userCode, payload } = item;
    //             const qr = payload.qr;

    //             try {
    //                 // =====================================================
    //                 // 1️⃣ Load user details
    //                 // =====================================================
    //                 const userDetails = await userRepository.getUserDetailsByUserCode(userCode);

    //                 const [userData] = await tran
    //                     .select()
    //                     .from(MechanicModel)
    //                     .where(eq(MechanicModel.userId, userDetails.userId))
    //                     .limit(1);

    //                 if (!userData?.kycApproval) {
    //                     results.failed.push({
    //                         userCode,
    //                         qr,
    //                         error: "KYC pending. User cannot scan products."
    //                     });
    //                     continue;
    //                 }

    //                 // =====================================================
    //                 // 2️⃣ Fetch Inventory Details (with proper typing)
    //                 // =====================================================
    //                 const [inventoryDetails] = await tran
    //                     .select({
    //                         serialNumber: InventoryModel.serialNumber,
    //                         qrActive: InventoryModel.isActive,
    //                         isQrScanned: InventoryModel.isQrScanned,
    //                         skuCode: sql<string>`${InventoryBatch.skuCode}`,
    //                         skuActive: sql<boolean>`${SkuMasterModel.isActive}`,
    //                         points: sql<string>`${SkuMasterModel.points}`,
    //                         productValue: sql<string>`${SkuMasterModel.productValue}`
    //                     })
    //                     .from(InventoryModel)
    //                     .leftJoin(
    //                         InventoryBatch,
    //                         eq(InventoryModel.batchId, InventoryBatch.batchId)
    //                     )
    //                     .leftJoin(
    //                         SkuMasterModel,
    //                         eq(InventoryBatch.skuCode, SkuMasterModel.skuCode)
    //                     )
    //                     .where(eq(InventoryModel.serialNumber, qr))
    //                     .limit(1);

    //                 if (!inventoryDetails) {
    //                     results.failed.push({
    //                         userCode,
    //                         qr,
    //                         error: "QR not found in inventory"
    //                     });
    //                     continue;
    //                 }

    //                 // =====================================================
    //                 // 3️⃣ Validate QR using your existing validator
    //                 // =====================================================
    //                 try {
    //                     await this.couponInventoryValidator(payload, userDetails, inventoryDetails);
    //                 } catch (err: any) {
    //                     results.failed.push({
    //                         userCode,
    //                         qr,
    //                         error: err?.responseMessage || "Coupon validation failed"
    //                     });
    //                     continue;
    //                 }

    //                 // =====================================================
    //                 // 4️⃣ Mark QR as scanned
    //                 // =====================================================
    //                 const updateResult = await tran
    //                     .update(InventoryModel)
    //                     .set({ isQrScanned: true })
    //                     .where(
    //                         and(
    //                             eq(InventoryModel.isActive, true),
    //                             eq(InventoryModel.isQrScanned, false),
    //                             eq(InventoryModel.serialNumber, qr)
    //                         )
    //                     );

    //                 if (!updateResult.rowCount) {
    //                     results.failed.push({
    //                         userCode,
    //                         qr,
    //                         error: "QR already scanned"
    //                     });
    //                     continue;
    //                 }

    //                 // =====================================================
    //                 // 5️⃣ Insert transaction entry
    //                 // =====================================================
    //                 await tran.insert(TransactionModel).values({
    //                     serialNumber: inventoryDetails.serialNumber,
    //                     productValue: inventoryDetails.productValue || "0",
    //                     skuCode: inventoryDetails.skuCode,
    //                     totalPoints: inventoryDetails.points,
    //                     baseSchemePoints: inventoryDetails.points,
    //                     transactionMessage: "success",
    //                     transactionStatus: "Success",
    //                     createdAt: new Date(),
    //                     createdBy: userDetails.userId,
    //                     userId: userDetails.userId,
    //                     source: "APP",
    //                     ipAddress: "",
    //                     latitude: "",
    //                     longitude: "",
    //                     schemeId: null
    //                 });

    //                 // =====================================================
    //                 // 6️⃣ Update user points
    //                 // =====================================================
    //                 await tran
    //                     .update(MechanicModel)
    //                     .set({
    //                         earnedPoints: sql`${MechanicModel.earnedPoints} + ${Number(inventoryDetails.points)}`,
    //                         scannedPoints: sql`${MechanicModel.scannedPoints} + ${Number(inventoryDetails.points)}`,
    //                         balancePoints: sql`${MechanicModel.balancePoints} + ${Number(inventoryDetails.points)}`
    //                     })
    //                     .where(eq(MechanicModel.userId, userDetails.userId));

    //                 // =====================================================
    //                 // 7️⃣ Add passbook transaction
    //                 // =====================================================
    //                 await passbookRepository.addTransaction(
    //                     userDetails,
    //                     TRANSACTION_ENUM_TYPE.QR_SCAN,
    //                     Number(inventoryDetails.points),
    //                     { reference: qr }
    //                 );

    //                 // SUCCESS ENTRY
    //                 results.success.push({
    //                     userCode,
    //                     qr,
    //                     points: inventoryDetails.points,
    //                     productValue: inventoryDetails.productValue,
    //                     skuCode: inventoryDetails.skuCode
    //                 });

    //             } catch (err: any) {
    //                 results.failed.push({
    //                     userCode,
    //                     qr,
    //                     error: err?.responseMessage || "Unknown error"
    //                 });
    //             }
    //         }

    //         return {
    //             message: "Bulk multi-user scan completed",
    //             successCount: results.success.length,
    //             failedCount: results.failed.length,
    //             ...results
    //         };
    //     });
    // }



    async couponInventoryValidator(
        payload: ProductScan,
        userDetails: UserDetails,
        inventoryDetails: InventoryDetails
    ) {
        const checks = [
            {
                condition: !inventoryDetails?.serialNumber,
                message: "Invalid QR, Please scan valid QR",
                code: 201,
            },
            {
                condition: !inventoryDetails?.qrActive,
                message: "Serial number is not active",
                code: 202,
            },
            {
                condition: !inventoryDetails?.skuActive,
                message: "Product is not active",
                code: 203,
            },
            {
                condition: !inventoryDetails?.points || !Number(inventoryDetails?.points) || Number(inventoryDetails?.points) < 1,
                message: "Product doesn't have points",
                code: 204,
            },
            {
                condition: inventoryDetails?.isQrScanned,
                message: "Serial number is already scanned",
                code: 205,
            },
        ];

        const failedCheck = checks.find((c) => c.condition);

        if (failedCheck) {
            this.customError.responseMessage = failedCheck.message;
            this.customError.responseCode = failedCheck.code;

            await database.insert(TransactionModel).values({
                userId: userDetails?.userId,
                serialNumber: inventoryDetails?.serialNumber,
                skuCode: inventoryDetails?.skuCode,
                transactionMessage: failedCheck.message,
                transactionStatus: "Failure",
            });

            throw this.customError;
        }
    }


    async scanHistory(filters: any, userDetails: UserDetails) {
        const totalCount = (
            await database
                .select({ totalCount: count() })
                .from(TransactionModel)
                .leftJoin(SkuMasterModel, eq(TransactionModel.skuCode, SkuMasterModel.skuCode))
                .leftJoin(SubCategoryModel, eq(SkuMasterModel.subCategoryId, SubCategoryModel.subCategoryId))
                .where(
                    and(
                        eq(TransactionModel.userId, userDetails.userId)
                    )
                )
        )?.[0]?.totalCount

        const res = await database.select({
            slno: sql`row_number() over (order by ${desc(TransactionModel.transactionId)})`.as('slno'),
            serialNumber: TransactionModel.serialNumber,
            skuName: SkuMasterModel.skuName,
            subCategoryName: SubCategoryModel.subCategoryName,
            transactionStatus: TransactionModel.transactionStatus,
            createdAt: TransactionModel.createdAt,
            totalPoints: sql`${TransactionModel.totalPoints}::INTEGER`
        })
            .from(TransactionModel)
            .leftJoin(SkuMasterModel, eq(TransactionModel.skuCode, SkuMasterModel.skuCode))
            .leftJoin(SubCategoryModel, eq(SkuMasterModel.subCategoryId, SubCategoryModel.subCategoryId))
            .where(
                and(
                    eq(TransactionModel.userId, userDetails.userId)
                )
            )
            .limit(filters?.limit)
            .offset(filters?.skip)
            .orderBy(desc(TransactionModel.transactionId))

        return {
            reportList: res,
            totalCount
        }
    }

    async totalScannedPoints(filters: { financialYear?: string } = {}) {

        const { financialYear } = filters;

        const conditions: SQL[] = [];

        // -----------------------------
        // OPTIONAL FINANCIAL YEAR FILTER
        // -----------------------------
        if (financialYear) {
            // Example input: "2024-2025"
            const [startYear, endYear] = financialYear.split("-").map(Number);

            const fromDate = new Date(`${startYear}-04-01T00:00:00`);
            const toDate = new Date(`${endYear}-03-31T23:59:59`);

            conditions.push(gte(UserModel.createdAt, fromDate));
            conditions.push(lte(UserModel.createdAt, toDate));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [result] = await database
            .select({
                totalPointsScanned: sql<number>`SUM(${MechanicModel.scannedPoints})`,
                totalBonusPoints: sql<number>`SUM(${MechanicModel.bonusPoints})`,
                totalPoints: sql<number>`SUM(${MechanicModel.earnedPoints})`
            })
            .from(MechanicModel)
            .innerJoin(UserModel, eq(MechanicModel.userId, UserModel.userId))
        // .where(whereClause);

        return {
            totalPointsScanned: result?.totalPointsScanned ? Number(result.totalPointsScanned) : 0,
            totalBonusPoints: result?.totalBonusPoints ? Number(result.totalBonusPoints) : 0,
            totalPoints: (Number(result.totalPointsScanned) + Number(result.totalBonusPoints)) || 0,
        };
    }

    async totalScanCount(filters: { financialYear?: string } = {}) {

        const { financialYear } = filters;

        const conditions: SQL[] = [];

        // Only successful transactions
        conditions.push(eq(TransactionModel.transactionStatus, "Success"));

        // -----------------------------
        // OPTIONAL FINANCIAL YEAR FILTER
        // -----------------------------
        if (financialYear) {
            const [startYear, endYear] = financialYear.split("-").map(Number);

            const fromDate = new Date(`${startYear}-04-01T00:00:00`);
            const toDate = new Date(`${endYear}-03-31T23:59:59`);

            conditions.push(gte(TransactionModel.createdAt, fromDate));
            conditions.push(lte(TransactionModel.createdAt, toDate));
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const [result] = await database
            .select({
                scanCount: sql<number>`COUNT(*)`
            })
            .from(TransactionModel)
            .where(whereClause);

        return {
            totalScans: result?.scanCount ? Number(result.scanCount) : 0,
        };
    }

    async getScannedPointsStats(filters: {
        range: "last7" | "last30" | "3months" | "fy",
        financialYear?: string
    }) {

        const { range, financialYear } = filters;

        let startDate: Date = new Date();
        let endDate: Date = new Date();

        const now = new Date();
        let labels: string[] = [];
        let resultValues: number[] = [];

        // -------------------------
        // RANGE HANDLING
        // -------------------------

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

        else if (range === "last30") {
            startDate = new Date();
            startDate.setDate(now.getDate() - 29);

            labels = ["Day 1-7", "Day 8-14", "Day 15-21", "Day 22-28", "Day 29-30"];
        }

        else if (range === "3months") {
            const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            labels = [
                m[(now.getMonth() - 2 + 12) % 12],
                m[(now.getMonth() - 1 + 12) % 12],
                m[now.getMonth()]
            ];
            startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        }

        else if (range === "fy") {
            const [startY, endY] = financialYear!.split("-").map(Number);
            startDate = new Date(`${startY}-04-01T00:00:00`);
            endDate = new Date(`${endY}-03-31T23:59:59`);
            labels = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
        }

        // -------------------------
        // FETCH DB ROWS
        // -------------------------
        const rows = await database
            .select({
                createdAt: TransactionModel.createdAt,
                points: TransactionModel.totalPoints,
            })
            .from(TransactionModel)
            .where(
                and(
                    eq(TransactionModel.transactionStatus, "Success"),
                    gte(TransactionModel.createdAt, startDate),
                    lte(TransactionModel.createdAt, endDate),
                )
            );

        // -------------------------
        // GROUPING
        // -------------------------

        if (range === "last7") {
            const map: Record<string, number> = {};
            const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

            rows.forEach(r => {
                if (!r.createdAt) return;
                const w = weekdays[r.createdAt.getDay()];
                map[w] = (map[w] || 0) + Number(r.points);
            });

            resultValues = labels.map(label => map[label] || 0);
        }

        else if (range === "last30") {
            const buckets = [0, 0, 0, 0, 0];
            const start = new Date();
            start.setDate(now.getDate() - 29);

            rows.forEach(r => {
                if (!r.createdAt) return;

                const diffMs = r.createdAt.getTime() - start.getTime();
                const diffDays = Math.floor(diffMs / 86400000) + 1;

                if (diffDays <= 7) buckets[0] += Number(r.points);
                else if (diffDays <= 14) buckets[1] += Number(r.points);
                else if (diffDays <= 21) buckets[2] += Number(r.points);
                else if (diffDays <= 28) buckets[3] += Number(r.points);
                else buckets[4] += Number(r.points);
            });

            resultValues = buckets;
        }

        else if (range === "3months") {
            const map: Record<string, number> = {};
            const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

            rows.forEach(r => {
                if (!r.createdAt) return;
                const key = m[r.createdAt.getMonth()];
                map[key] = (map[key] || 0) + Number(r.points);
            });

            resultValues = labels.map(l => map[l] || 0);
        }

        else if (range === "fy") {
            const map: Record<string, number> = {};
            const fy = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

            rows.forEach(r => {
                if (!r.createdAt) return;
                const idx = (r.createdAt.getMonth() + 9) % 12;
                const key = fy[idx];
                map[key] = (map[key] || 0) + Number(r.points);
            });

            resultValues = labels.map(l => map[l] || 0);
        }

        return { labels, values: resultValues };
    }

    async getRecentScans(limit: number) {
        return await database
            .select({
                id: TransactionModel.transactionId,
                userId: UserModel.userId,
                userName: UserModel.userName,
                userEmail: UserModel.userEmail,
                userMobile: UserModel.userMobile,
                displayName: UserModel.displayName,

                points: TransactionModel.totalPoints,
                type: sql`'scan'`,
                createdAt: TransactionModel.createdAt
            })
            .from(TransactionModel)
            .leftJoin(UserModel, eq(TransactionModel.userId, UserModel.userId))
            .orderBy(desc(TransactionModel.createdAt))
            .limit(limit);
    }

    async getTopPerformers(limit: number) {
        // enforce max limit = 50
        if (limit > 50) limit = 50;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        return await database
            .select({
                userId: TransactionModel.userId,
                userName: UserModel.userName,
                displayName: UserModel.displayName,
                userMobile: UserModel.userMobile,
                totalPoints: sql<number>`SUM(${TransactionModel.totalPoints})`
            })
            .from(TransactionModel)
            .leftJoin(UserModel, eq(TransactionModel.userId, UserModel.userId))
            .where(
                and(
                    eq(TransactionModel.transactionStatus, "Success"),
                    gte(TransactionModel.createdAt, startOfMonth),
                    lte(TransactionModel.createdAt, now)
                )
            )
            .groupBy(
                TransactionModel.userId,
                UserModel.userName,
                UserModel.displayName,
                UserModel.userMobile
            )
            .orderBy(sql`SUM(${TransactionModel.totalPoints}) DESC`)
            .limit(limit);
    }

    async getTotalInventoryCount() {
        const [result] = await database
            .select({
                totalCount: sql<number>`COUNT(*)`
            })
            .from(InventoryModel);
        return result;
    }

}

export const inventoryRepository = new InventoryRepository();

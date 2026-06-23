import {
  and,
  desc,
  eq,
  gte,
  inArray,
  lte,
  sql,
  count,
  getTableColumns,
  SQL,
} from "drizzle-orm";
import {
  AccountDetailModel,
  AddressModel,
  BankTransferRedemptionModel,
  BranchModel,
  DealerModel,
  MechanicModel,
  RedemptionModel,
  RetailerModel,
  RoleModel,
  UpiRedemptionModel,
  UserModel,
  AmazonMarketOrderItemsModel,
  AmazonMarketProductsModel
} from "../schemas";
import { database } from "../server";
import { CustomError, UserDetails, InsertRedeemPayload, RedemptionParterData, PayoutResponse } from "../types";
import {
  FetchRedemptionByRef,
  ProcessRedemptionPayload,
  RedemptionHistoryFilter,
  RedemptionPayload,
} from "../types/redeem";
import { BLOCK_ID, REDEMPTION_REASON, ROLES, TRANSACTION_ENUM_TYPE } from "../utils/constant";
import { generateRandomToken, parseDate } from "../utils/random";
import { redemptionStatusEnum } from "../schemas/enum-index";
import { fileMiddleware } from "../middlewares/file-middleware";
import { SubRoleModel } from "../schemas";
import { passbookRepository } from "./passbook-repository";
import { userRepository } from "./user-repository";
import { checkAdmin } from "../utils/db-ref-converter";
import { WebhookPayload } from "../types/razorpay";

class RedemptionRepository {
  customError: CustomError;
  constructor() {
    this.customError = new CustomError({
      responseCode: 400,
      statusCode: 200,
      responseMessage: "",
    });
  }

  // async insertRedemption(userDetails: UserDetails, payload: RedemptionPayload) {
  //   return await database.transaction(async (tran) => {
  //     const partnerTable = this.getPartTable(userDetails);

  //     const partnerTableRef = tran
  //       .select()
  //       .from(partnerTable)
  //       .where(eq(partnerTable.userId, userDetails.userId))
  //       .as("partnerTableRef");

  //     const partnerData = await this.userRedeemValidation(
  //       userDetails,
  //       payload,
  //       partnerTableRef,
  //       tran
  //     );

  //     let insertPayload = {
  //       points: payload?.value,
  //       userId: userDetails.userId,
  //       redemptionRef: generateRandomToken(10),
  //       redemptionStatus: "Pending",
  //     } as InsertRedeemPayload;

  //     if (payload?.type == "upi") {
  //       insertPayload = {
  //         ...insertPayload,
  //         redemptionMode: "UPI",
  //         // upiId: partnerData?.upiId || "",
  //       };
  //     } else if (payload?.type == "bank-transfer") {
  //       insertPayload = {
  //         ...insertPayload,
  //         redemptionMode: "Bank Transfer",
  //         // ifsc: partnerData?.accountIfsc || "",
  //         // accountType: partnerData?.accountType || "",
  //         // bankName: partnerData?.bankName || "",
  //         // bankBranch: partnerData?.bankBranch || "",
  //         // accountHolderName: partnerData?.accountHolderName || "",
  //         // chequeUrl: partnerData?.chequeUrl || "",
  //       };
  //     } /* else if (payload?.type == "credit-note") {
  //       insertPayload = {
  //         ...insertPayload,
  //         redemptionMode: "Credit Note",
  //         cnEmail: payload?.userEmail,
  //       };
  //     } */ else {
  //       this.customError.responseMessage = "Invalid redemption option";
  //       throw this.customError;
  //     }

  //     const [previousValue] = await tran
  //       .select()
  //       .from(partnerTable)
  //       .where(eq(partnerTable.userId, userDetails.userId));

  //     const balanceUpdated =
  //       Number(previousValue.balancePoints || "0") -
  //       Number(payload.value || "0");

  //     const redeemedPoints =
  //       Number(previousValue.redeemedPoints || "0") +
  //       Number(payload.value || "0");

  //     await tran.insert(RedemptionModel).values(insertPayload);
  //     await tran
  //       .update(partnerTable)
  //       .set({
  //         balancePoints: sql<string>`${balanceUpdated}`,
  //         redeemedPoints: sql<string>`${redeemedPoints}`
  //       })
  //       .where(eq(partnerTable.userId, userDetails.userId));
  //     return insertPayload;
  //   });
  // }

  async insertRedemption(userDetails: UserDetails, payload: RedemptionPayload) {
    return await database.transaction(async (tran) => {
      const partnerTable = this.getPartTable(userDetails);
      const partnerTableRef = tran
        .select()
        .from(partnerTable)
        .where(eq(partnerTable.userId, userDetails.userId))
        .as("partnerTableRef");
      const partnerData = await this.userRedeemValidation(
        userDetails,
        payload,
        partnerTableRef,
        tran
      );

      let insertPayload = {
        points: payload?.value,
        userId: userDetails.userId,
        redemptionRef: generateRandomToken(10),
        redemptionStatus: "Pending",
        createdBy: userDetails?.userId
      } as InsertRedeemPayload;

      if (payload?.type == "upi") {
        insertPayload = {
          ...insertPayload,
          redemptionMode: "UPI"
        };
      } else if (payload?.type == "bank-transfer") {
        insertPayload = {
          ...insertPayload,
          redemptionMode: "Bank Transfer",
        };
      } else {
        this.customError.responseMessage = "Invalid redemption option";
        throw this.customError;
      }

      // const [previousValue] = await tran
      //   .select()
      //   .from(partnerTable)
      //   .where(eq(partnerTable.userId, userDetails.userId));

      // const balanceUpdated =
      //   Number(previousValue.balancePoints || "0") -
      //   Number(payload.value || "0");

      // const redeemedPoints =
      //   Number(previousValue.redeemedPoints || "0") +
      //   Number(payload.value || "0");

      let [redemption] = await tran
        .insert(RedemptionModel)
        .values(insertPayload)
        .returning({ redemptionId: RedemptionModel.redemptionId });

      if (payload.type === "upi") {
        await tran.insert(UpiRedemptionModel).values({
          redemptionId: redemption?.redemptionId,
          upiId: partnerData?.upiId,
          vendorRequest: null,
          vendorResponse: null,
        });
      }

      if (payload.type === "bank-transfer") {
        await tran.insert(BankTransferRedemptionModel).values({
          redemptionId: redemption?.redemptionId,
          accountNumber: partnerData?.accountNumber,
          ifsc: partnerData?.accountIfsc,
          bankName: partnerData?.bankName,
          bankBranch: partnerData?.bankBranch,
          accountHolderName: partnerData?.accountHolderName,
          accountType: partnerData?.accountType,
          vendorRequest: null,
          vendorResponse: null,
        });
      }

      await tran
        .update(partnerTable)
        .set({
          redeemablePoints: sql`${partnerTable.redeemablePoints} - ${payload?.value}`,
          balancePoints: sql`${partnerTable.balancePoints} - ${payload?.value}`,
          redeemedPoints: sql`${partnerTable.redeemedPoints} + ${payload?.value}`,
        })
        .where(eq(partnerTable.userId, userDetails.userId));

      await passbookRepository.addTransaction(
        userDetails?.userId,
        payload?.type == "bank-transfer" ? TRANSACTION_ENUM_TYPE.BANK_TRANSFER : TRANSACTION_ENUM_TYPE.UPI,
        -Number(payload?.value),
        {
          redemptionRef: insertPayload.redemptionRef,
        },
        tran
      );

      return { ...insertPayload, redemptionId: redemption?.redemptionId, partnerData };
    });
  }

  // async insertBulkRedemption(userCode: string, payload: RedemptionPayload) {
  //   return await database.transaction(async (tran) => {
  //     let userDetails = await userRepository.getUserDetailsByUserCode(userCode);
  //     const partnerTable = this.getPartTable(userDetails);
  //     const partnerTableRef = tran
  //       .select()
  //       .from(partnerTable)
  //       .where(eq(partnerTable.userId, userDetails.userId))
  //       .as("partnerTableRef");
  //     const partnerData = await this.userRedeemValidation(
  //       userDetails,
  //       payload,
  //       partnerTableRef,
  //       tran
  //     );
  //     console.log(partnerData)
  //     let insertPayload = {
  //       points: payload?.value,
  //       userId: userDetails.userId,
  //       redemptionRef: generateRandomToken(10),
  //       redemptionStatus: "Pending",
  //       createdBy: userDetails?.userId
  //     } as InsertRedeemPayload;

  //     if (payload?.type == "upi") {
  //       insertPayload = {
  //         ...insertPayload,
  //         redemptionMode: "UPI"
  //       };
  //     } else if (payload?.type == "bank-transfer") {
  //       insertPayload = {
  //         ...insertPayload,
  //         redemptionMode: "Bank Transfer",
  //       };
  //     } else {
  //       this.customError.responseMessage = "Invalid redemption option";
  //       throw this.customError;
  //     }

  //     const [previousValue] = await tran
  //       .select()
  //       .from(partnerTable)
  //       .where(eq(partnerTable.userId, userDetails.userId));

  //     const balanceUpdated =
  //       Number(previousValue.balancePoints || "0") -
  //       Number(payload.value || "0");

  //     const redeemedPoints =
  //       Number(previousValue.redeemedPoints || "0") +
  //       Number(payload.value || "0");

  //     let [redemption] = await tran.insert(RedemptionModel).values(insertPayload).returning({ redemptionId: RedemptionModel.redemptionId });
  //     if (payload.type === "upi") {
  //       await tran.insert(UpiRedemptionModel).values({
  //         redemptionId: redemption?.redemptionId,
  //         upiId: partnerData?.upiId,
  //         vendorRequest: null,
  //         vendorResponse: null,
  //       });
  //     }

  //     if (payload.type === "bank-transfer") {
  //       await tran.insert(BankTransferRedemptionModel).values({
  //         redemptionId: redemption?.redemptionId,
  //         accountNumber: partnerData?.accountNumber,
  //         ifsc: partnerData?.accountIfsc,
  //         bankName: partnerData?.bankName,
  //         bankBranch: partnerData?.bankBranch,
  //         accountHolderName: partnerData?.accountHolderName,
  //         accountType: partnerData?.accountType,
  //         vendorRequest: null,
  //         vendorResponse: null,
  //       });
  //     }

  //     await tran
  //       .update(partnerTable)
  //       .set({
  //         balancePoints: sql<string>`${balanceUpdated}`,
  //         redeemedPoints: sql<string>`${redeemedPoints}`
  //       })
  //       .where(eq(partnerTable.userId, userDetails.userId));

  //     await passbookRepository.addTransaction(
  //       userDetails,
  //       payload?.type == "bank-transfer" ? TRANSACTION_ENUM_TYPE.BANK_TRANSFER : TRANSACTION_ENUM_TYPE.UPI,
  //       -Number(payload?.value),
  //       {
  //         reference: insertPayload.redemptionRef,
  //       }
  //     );

  //     return insertPayload;
  //   });
  // }

  async insertBulkRedemptionForMultipleUsers(
    items: { userCode: string; payload: RedemptionPayload }[]
  ) {
    return await database.transaction(async (tran) => {
      const results: {
        updated: {
          userCode: string;
          redemptionRef: string;
          value: string;
          mode: string;
          redemptionId: number;
          partnerData: RedemptionParterData,
          userName: string,
          userEmail: string,
          userMobile: string,
          userId: number
        }[];
        failed: {
          userCode: string;
          error: string;
          value?: string;
        }[];
      } = {
        updated: [],
        failed: []
      };


      for (const item of items) {
        const { userCode, payload } = item;

        try {
          // ===========================
          // 1️⃣ Fetch user details
          // ===========================
          const userDetails = await userRepository.getUserDetailsByUserCode(userCode);
          const partnerTable = this.getPartTable(userDetails);

          const [partner] = await tran
            .select()
            .from(partnerTable)
            .where(eq(partnerTable.userId, userDetails.userId));

          if (!partner) {
            results.failed.push({
              userCode,
              error: "Partner data not found"
            });
            continue;
          }

          let balance = Number(partner.balancePoints || 0);
          let redeemed = Number(partner.redeemedPoints || 0);

          // ===========================
          // 2️⃣ Validate redemption
          // ===========================
          const partnerTableRef = tran
            .select()
            .from(partnerTable)
            .where(eq(partnerTable.userId, userDetails.userId))
            .as("partnerTableRef");

          const partnerData = await this.userRedeemValidation(
            userDetails,
            payload,
            partnerTableRef,
            tran
          );

          if (balance < Number(payload.value)) {
            results.failed.push({
              userCode,
              error: "Insufficient balance",
              value: payload.value
            });
            continue;
          }

          // ===========================
          // 3️⃣ Create base redemption
          // ===========================
          let insertPayload: Partial<InsertRedeemPayload> = {
            points: payload.value,
            userId: userDetails.userId,
            redemptionRef: generateRandomToken(10),
            redemptionStatus: "Pending",
            createdBy: userDetails.userId
          };

          if (payload.type === "upi") {
            insertPayload.redemptionMode = "UPI";
          } else if (payload.type === "bank-transfer") {
            insertPayload.redemptionMode = "Bank Transfer";
          } else {
            results.failed.push({
              userCode,
              error: "Invalid redemption type"
            });
            continue;
          }
          let finalPayload = insertPayload as InsertRedeemPayload
          // ===========================
          // 4️⃣ Insert redemption
          // ===========================
          const [redemption] = await tran
            .insert(RedemptionModel)
            .values(finalPayload)
            .returning({ redemptionId: RedemptionModel.redemptionId });

          // ===========================
          // 5️⃣ Insert UPI / Bank details
          // ===========================
          if (payload.type === "upi") {
            await tran.insert(UpiRedemptionModel).values({
              redemptionId: redemption.redemptionId,
              upiId: partnerData?.upiId,
              vendorRequest: null,
              vendorResponse: null,
            });
          }

          if (payload.type === "bank-transfer") {
            await tran.insert(BankTransferRedemptionModel).values({
              redemptionId: redemption.redemptionId,
              accountNumber: partnerData?.accountNumber,
              ifsc: partnerData?.accountIfsc,
              bankName: partnerData?.bankName,
              bankBranch: partnerData?.bankBranch,
              accountHolderName: partnerData?.accountHolderName,
              accountType: partnerData?.accountType,
              vendorRequest: null,
              vendorResponse: null,
            });
          }

          // ===========================
          // 6️⃣ Update balance
          // ===========================
          // balance -= Number(payload.value);
          // redeemed += Number(payload.value);

          await tran
            .update(partnerTable)
            .set({
              redeemablePoints: sql`${partnerTable.redeemablePoints} - ${payload?.value}`,
              balancePoints: sql`${partnerTable.balancePoints} - ${payload?.value}`,
              redeemedPoints: sql`${partnerTable.redeemedPoints} + ${payload?.value}`,
            })
            .where(eq(partnerTable.userId, userDetails.userId));

          // ===========================
          // 7️⃣ Passbook Entry
          // ===========================
          await passbookRepository.addTransaction(
            userDetails?.userId,
            payload.type === "bank-transfer"
              ? TRANSACTION_ENUM_TYPE.BANK_TRANSFER
              : TRANSACTION_ENUM_TYPE.UPI,
            -Number(payload.value),
            { redemptionRef: insertPayload.redemptionRef },
            tran
          );

          // Success push
          results.updated.push({
            userCode,
            redemptionRef: finalPayload.redemptionRef,
            value: payload.value,
            mode: finalPayload?.redemptionMode,
            redemptionId: redemption?.redemptionId,
            partnerData: partnerData,
            userName: userDetails?.userName,
            userEmail: userDetails?.userEmail,
            userMobile: userDetails?.userMobile,
            userId: userDetails?.userId
          });

        } catch (err: any) {
          results.failed.push({
            userCode: item.userCode,
            error: err?.responseMessage || "Unknown error"
          });
        }
      }

      return {
        message: "Bulk multi-user redemption processed",
        updatedCount: results.updated.length,
        failedCount: results.failed.length,
        ...results
      };
    });
  }


  async userRedeemValidation(
    userDetails: UserDetails,
    payload: RedemptionPayload,
    partnerTableRef: any,
    tran: Parameters<Parameters<typeof database.transaction>[0]>[0]
  ) {

    const filterArray = [
      eq(AccountDetailModel.userId, userDetails?.userId)
    ]

    if (payload.type == "upi") {
      filterArray.push(eq(AccountDetailModel.upiId, payload.upiId))
    }

    if (payload.type == "bank-transfer") {
      filterArray.push(eq(AccountDetailModel.accountNumber, payload.accountNumber))
    }

    const accountDetails = await tran
      .select()
      .from(AccountDetailModel)
      .where(
        and(
          ...filterArray
        )
      );

    if (!accountDetails?.length && ["upi", "bank-transfer"]) {
      this.customError.responseMessage = `Account details do not exist`;
      throw this.customError;
    }

    if (
      payload?.type == "upi" &&
      accountDetails?.find((ele) => ele?.upiId == payload?.upiId)?.userId !=
      userDetails?.userId
    ) {

      this.customError.responseMessage = `This UPI ID is not belongs to your account`;
      throw this.customError;
    }

    if (
      payload?.type == "bank-transfer" &&
      accountDetails?.find((ele) => ele?.accountNumber == payload?.accountNumber)
        ?.userId != userDetails?.userId
    ) {
      this.customError.responseMessage = `This bank account is not belongs to your account`;
      throw this.customError;
    }

    const [partnerData]: RedemptionParterData[] = await tran
      .select({
        balancePoints: partnerTableRef.balancePoints,
        accountNumber: AccountDetailModel?.accountNumber,
        accountIfsc: AccountDetailModel?.accountIfsc,
        accountType: AccountDetailModel?.accountType,
        bankName: AccountDetailModel?.bankName,
        bankBranch: AccountDetailModel?.bankBranch,
        accountHolderName: AccountDetailModel?.accountHolderName,
        upiId: AccountDetailModel?.upiId,
        chequeUrl: AccountDetailModel?.chequeUrl,
        cnFlag: AccountDetailModel.cnFlag,
        upiFlag: AccountDetailModel.upiFlag,
        bankFlag: AccountDetailModel.bankFlag,
        blockStatus: UserModel.blockStatus,
        kycApproval: partnerTableRef.kycApproval
      })
      .from(partnerTableRef)
      .leftJoin(
        AccountDetailModel,
        eq(partnerTableRef.userId, AccountDetailModel.userId)
      )
      .leftJoin(UserModel, eq(partnerTableRef.userId, UserModel.userId))

    if (partnerData && partnerData.kycApproval === false) {
      this.customError.responseMessage =
        "User kyc approval pending";
      throw this.customError;
    }

    if (partnerData && partnerData.blockStatus === "redeem") {
      this.customError.responseMessage =
        "User blocked for redemption";
      throw this.customError;
    }
    if (payload?.type == "upi" && !partnerData?.upiFlag) {
      this.customError.responseMessage =
        "UPI redemption is blocked for your account, contact team GSS";
      throw this.customError;
    }

    if (payload?.type == "bank-transfer" && !partnerData?.bankFlag) {
      this.customError.responseMessage =
        "Bank Transfer redemption is blocked for your account, contact team GSS";
      throw this.customError;
    }

    if (!partnerData?.balancePoints || !Number(partnerData?.balancePoints)) {
      this.customError.responseMessage = "No balance";
      throw this.customError;
    }

    if (
      Number(partnerData?.balancePoints) &&
      Number(partnerData?.balancePoints) < Number(payload?.value)
    ) {
      this.customError.responseMessage = "Insufficient balance";
      throw this.customError;
    }

    return partnerData;
  }

  getPartTable(userDetails: UserDetails) {
    return MechanicModel;
  }

  getPartTableByRoleId(userId: number) {
    return MechanicModel;
  }

  async redemptionHistory(
    userDetails: UserDetails,
    payload: RedemptionHistoryFilter
  ) {

    const conditions = [];
    if (!checkAdmin(Number(userDetails?.userRoleId))) {
      conditions.push(eq(RedemptionModel.userId, userDetails.userId));
    }
    if (payload?.status?.length) {
      conditions.push(
        inArray(
          RedemptionModel.redemptionStatus,
          payload.status as typeof redemptionStatusEnum.enumValues
        )
      );
    }
    if (payload?.redemptionRef?.length) {
      conditions.push(
        inArray(RedemptionModel.redemptionRef, payload.redemptionRef)
      );
    }

    if (payload.fromDate) {
      conditions.push(
        gte(
          RedemptionModel.createdAt,
          parseDate({ date: payload.fromDate, start: true })
        )
      );
    }

    if (payload.toDate) {
      conditions.push(
        lte(
          RedemptionModel.createdAt,
          parseDate({ date: payload.toDate, end: true })
        )
      );
    }

    const partnerTable = this.getPartTable(userDetails);

    const partnerTableRef = database
      .select()
      .from(partnerTable)
      .where(eq(partnerTable.userId, userDetails.userId))
      .as("partnerTableRef");

    const totalCount = (
      await database
        .select({ totalCount: count() })
        .from(RedemptionModel)
        .where(and(...conditions))
    )?.[0]?.totalCount;

    const resultWithIds = await database
      .select({
        redemptionId: RedemptionModel.redemptionId, // Added this
        slno: sql`row_number() over (order by ${desc(
          RedemptionModel.redemptionId
        )})`,
        redemptionRef: sql<string>`${RedemptionModel.redemptionRef}`,
        userCode: sql<string>`${userDetails.userCode}`,
        //firmName: sql`COALESCE(${RetailerModel.firmName},${DealerModel.firmName})`,
        //category: sql<string>`COALESCE(${SubRoleModel.subRoleName}, ${RoleModel.roleName})`,
        userName: UserModel.userName,
        userRole: sql<string>`${userDetails.userRole}`,
        userMobile: sql<string>`${UserModel.userMobile}`,
        // branch: sql<string>`${BranchModel.branchName}`,
        // totalPoints: sql<string>`${userDetails.pointSummary.earnedPoints}`,
        redeemedPoints: sql<string>`${RedemptionModel.points}`,
        redemptionMode: sql<string>`${RedemptionModel.redemptionMode}`,
        redemptionStatus: sql<string>`${RedemptionModel.redemptionStatus}`,
        dateOfJoining: sql<string>`${UserModel.createdAt}`,
        totalEarnedPoints: sql<string>`${MechanicModel.earnedPoints}`,
        createdAt: sql<string>`${RedemptionModel.createdAt}`,
        updatedAt: sql<string>`${RedemptionModel.processedAt}`,
      })
      .from(RedemptionModel)
      .leftJoin(UserModel, eq(RedemptionModel.userId, UserModel.userId))
      .leftJoin(RoleModel, eq(UserModel.userRole, RoleModel.roleId))
      .leftJoin(AddressModel, eq(UserModel.userId, AddressModel.userId))
      .leftJoin(MechanicModel, eq(MechanicModel.userId, UserModel.userId))
      .where(and(...conditions))
      .limit(payload.limit)
      .offset(payload.skip);

    const rIds = resultWithIds.map(r => r.redemptionId);

    let productsMap: Record<number, any[]> = {};

    if (rIds.length > 0) {
      const products = await database
        .select({
          redemptionId: AmazonMarketOrderItemsModel.redemptionId,
          amazonProductId: AmazonMarketOrderItemsModel.amazonProductId,
          productValue: AmazonMarketOrderItemsModel.productValue,
          deliveryStatus: AmazonMarketOrderItemsModel.deliveryStatus,
          productName: AmazonMarketProductsModel.amazonProductName,
          productImage: AmazonMarketProductsModel.amazonProductUrl,
          staticImage: AmazonMarketProductsModel.amazonStaticProductUrl,
          deliveredAt: AmazonMarketOrderItemsModel.deliveredAt,
          dispatchedAt: AmazonMarketOrderItemsModel.dispatchedAt,

        })
        .from(AmazonMarketOrderItemsModel)
        .leftJoin(AmazonMarketProductsModel, eq(AmazonMarketOrderItemsModel.amazonProductId, AmazonMarketProductsModel.productId))
        .where(inArray(AmazonMarketOrderItemsModel.redemptionId, rIds));

      for (const p of products) {
        if (!productsMap[p.redemptionId]) {
          productsMap[p.redemptionId] = [];
        }

        let imageUrl = "";
        if (p.staticImage && p.staticImage !== "") {
          imageUrl = p.staticImage;
        } else if (p.productImage) {
          imageUrl = await fileMiddleware.getFileSignedUrl(p.productImage, 'amazon-market');
        }

        productsMap[p.redemptionId].push({
          productId: p.amazonProductId,
          productName: p.productName,
          deliveryStatus: p.deliveryStatus,
          image: imageUrl,
          value: p?.productValue,
          deliveredAt: p?.deliveredAt,
          dispatchedAt: p?.dispatchedAt,
        });
      }
    }

    const finalResult = resultWithIds.map(r => {
      const productList = productsMap[r.redemptionId]?.map(ele => {
        return {
          ...ele,
          deliveredAt: undefined,
          dispatchedAt: undefined,
          deliveryStatus: undefined,
        }
      })
      return {
        ...r,
        deliveredAt: productsMap[r.redemptionId]?.[0]?.deliveredAt || "",
        dispatchedAt: productsMap[r.redemptionId]?.[0]?.dispatchedAt || "",
        deliveryStatus: productsMap[r.redemptionId]?.[0]?.deliveryStatus || "",
        products: productList,
      }
    });

    return { totalCount, reportList: finalResult };
  }

  async processRedemption(
    payload: ProcessRedemptionPayload[],
    CNfiles: Express.Multer.File[],
    userDetails: UserDetails
  ) {
    const results = await Promise.allSettled(
      payload.map(async (ref) => {
        try {
          return await database.transaction(async (tx) => {
            // Fetch redemption details & user status
            let fileUrl = "";
            const [existingRedemption] = (await tx
              .select({
                redemptionId: RedemptionModel.redemptionId,
                redemptionStatus: RedemptionModel.redemptionStatus,
                redemptionMode: RedemptionModel.redemptionMode,
                blockStatus: UserModel.blockStatus,
                points: RedemptionModel.points,
                redemptionRef: RedemptionModel.redemptionRef,
                userId: RedemptionModel.userId,
                userRole: UserModel.userRole,
                userName: UserModel.userName,
                userEmail: UserModel.userEmail,
                userMobile: UserModel.userMobile,
                userCode: UserModel.userCode,
                accountNumber: AccountDetailModel.accountNumber,
                accountIfsc: AccountDetailModel.accountIfsc,
                accountHolderName: AccountDetailModel.accountHolderName,
                upiId: AccountDetailModel.upiId
              })
              .from(RedemptionModel)
              .innerJoin(
                UserModel,
                eq(RedemptionModel.userId, UserModel.userId)
              )
              .leftJoin(
                AccountDetailModel,
                eq(RedemptionModel.userId, AccountDetailModel.userId)
              )
              .where(
                eq(RedemptionModel.redemptionRef, ref.redemptionRef)
              )) as any[];


            // Validation checks
            if (!existingRedemption) {
              throw new Error(`Redemption not found.`);
            }
            if (existingRedemption.redemptionStatus !== "Pending") {
              throw new Error(
                `Redemption is already ${existingRedemption.redemptionStatus}.`
              );
            }

            if (
              ["login", "redeem", "inactive"].includes(
                existingRedemption.blockStatus
              )
            ) {
              throw new Error(`User is blocked for redemption.`);
            }

            const updatingRedemptionStatus =
              ref.status === "Approve" ? "Approved" : "Rejected";

            await tx
              .update(RedemptionModel)
              .set({
                redemptionStatus: updatingRedemptionStatus,
                processedAt: new Date(),
                processedBy: userDetails.userId,
              })
              .where(eq(RedemptionModel.redemptionRef, ref.redemptionRef));

            const partnerTable = this.getPartTableByRoleId(existingRedemption.userRole);

            const [previousValue] = await tx
              .select()
              .from(partnerTable)
              .where(eq(partnerTable.userId, existingRedemption.userId));

            if (ref.status == "Reject") {
              await tx
                .update(partnerTable)
                .set({
                  redeemablePoints: sql`${partnerTable.redeemablePoints} + ${existingRedemption?.points}`,
                  balancePoints: sql`${partnerTable.balancePoints} + ${existingRedemption?.points}`,
                  redeemedPoints: sql`${partnerTable.redeemedPoints} - ${existingRedemption?.points}`,
                })
                .where(eq(partnerTable.userId, existingRedemption.userId));

              await passbookRepository.addTransaction(
                userDetails?.userId,
                TRANSACTION_ENUM_TYPE.REFUND,
                Number(existingRedemption.points),
                {
                  redemptionRef: existingRedemption.redemptionRef,
                },
                tx
              );
            }
            return {
              ...ref,
              status: "Success",
              code: 200,
              data: {
                redemptionId: existingRedemption.redemptionId,
                redemptionRef: existingRedemption.redemptionRef,
                points: existingRedemption.points,
                type: existingRedemption.redemptionMode === "UPI" ? "upi" : "bank-transfer",
                partnerData: {
                  accountNumber: existingRedemption.accountNumber,
                  accountIfsc: existingRedemption.accountIfsc,
                  accountHolderName: existingRedemption.accountHolderName,
                  upiId: existingRedemption.upiId
                },
                userDetails: {
                  userName: existingRedemption.userName,
                  userEmail: existingRedemption.userEmail,
                  userMobile: existingRedemption.userMobile,
                  userCode: existingRedemption.userCode,
                  userId: existingRedemption.userId
                }
              }
            };
          });
        } catch (error: any) {
          return {
            ...ref,
            status: error?.message || "Failed",
            code: 412,
            data: null
          };
        }
      })
    );

    const success = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value);
    const failures = results
      .filter((r) => r.status === "rejected")
      .map((r) => r.reason);

    return { success, failures };
  }

  async uploadCreditNote(
    CNfiles: Express.Multer.File[],
    existingRedemption: FetchRedemptionByRef
  ) {
    const file = CNfiles.find(
      (ele) => ele?.fieldname == `CN${existingRedemption.redemptionRef}`
    );

    if (!file) {
      throw new Error(
        `CN file is required for ${existingRedemption.redemptionRef}.`
      );
    }

    return await fileMiddleware.uploadFile(file, "cn");
  }

  async totalRedeemedPoints(filters: { financialYear?: string } = {}) {

    const { financialYear } = filters;

    const conditions: SQL[] = [];

    // Only APPROVED redemptions count
    conditions.push(eq(RedemptionModel.redemptionStatus, "Approved"));

    // -----------------------------
    // OPTIONAL FINANCIAL YEAR FILTER
    // -----------------------------
    if (financialYear) {
      // Example input: "2024-2025"
      const [startYear, endYear] = financialYear.split("-").map(Number);

      const fromDate = new Date(`${startYear}-04-01T00:00:00`);
      const toDate = new Date(`${endYear}-03-31T23:59:59`);

      conditions.push(gte(RedemptionModel.createdAt, fromDate));
      conditions.push(lte(RedemptionModel.createdAt, toDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [result] = await database
      .select({
        totalRedeemed: sql<number>`SUM(${RedemptionModel.points})`,
      })
      .from(RedemptionModel)
      .where(whereClause);

    return {
      totalPointsRedeemed: result?.totalRedeemed ? Number(result.totalRedeemed) : 0,
    };
  }

  async getRedeemedPointsStats(filters: {
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
    // SAME RANGE HANDLING
    // -------------------------

    if (range === "last7") {
      startDate = new Date();
      startDate.setDate(now.getDate() - 6);
      const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      labels = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        return weekdays[d.getDay()];
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
        m[now.getMonth()],
      ];
      startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    }

    else if (range === "fy") {
      const [sY, eY] = financialYear!.split("-").map(Number);
      startDate = new Date(`${sY}-04-01T00:00:00`);
      endDate = new Date(`${eY}-03-31T23:59:59`);
      labels = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
    }

    // -------------------------
    // DB ROWS
    // -------------------------

    const rows = await database
      .select({
        createdAt: RedemptionModel.createdAt,
        points: RedemptionModel.points,
      })
      .from(RedemptionModel)
      .where(
        and(
          eq(RedemptionModel.redemptionStatus, "Approved"),
          gte(RedemptionModel.createdAt, startDate),
          lte(RedemptionModel.createdAt, endDate)
        )
      );


    // -------------------------
    // SAME GROUPING LOGIC
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
        const diff = Math.floor((r.createdAt.getTime() - start.getTime()) / 86400000) + 1;

        if (diff <= 7) buckets[0] += Number(r.points);
        else if (diff <= 14) buckets[1] += Number(r.points);
        else if (diff <= 21) buckets[2] += Number(r.points);
        else if (diff <= 28) buckets[3] += Number(r.points);
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
      const fyMonths = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

      rows.forEach(r => {
        if (!r.createdAt) return;
        const idx = (r.createdAt.getMonth() + 9) % 12;
        const key = fyMonths[idx];
        map[key] = (map[key] || 0) + Number(r.points);
      });

      resultValues = labels.map(l => map[l] || 0);
    }

    return { labels, values: resultValues };
  }

  async getRedemption(filters: { id?: number; redemptionRef?: string }) {
    const conditions = [];
    if (filters.id) conditions.push(eq(RedemptionModel.redemptionId, filters.id));
    if (filters.redemptionRef) conditions.push(eq(RedemptionModel.redemptionRef, filters.redemptionRef));

    const [res] = await database
      .select({
        redemptionId: RedemptionModel.redemptionId,
        redemptionRef: RedemptionModel.redemptionRef,
        userId: RedemptionModel.userId,
        points: RedemptionModel.points,
        redemptionStatus: RedemptionModel.redemptionStatus,
      })
      .from(RedemptionModel)
      .where(and(...conditions))
      .limit(1);

    return res;
  }

  async findRedemptionByPayoutId(payoutId: string) {
    const [redemption] = await database
      .select({
        redemptionId: RedemptionModel.redemptionId,
        redemptionRef: RedemptionModel.redemptionRef,
        userId: RedemptionModel.userId,
        points: RedemptionModel.points,
        redemptionStatus: RedemptionModel.redemptionStatus,
      })
      .from(RedemptionModel)
      .where(sql`${RedemptionModel.razorpayMetaData}->>'id' = ${payoutId}`)
      .limit(1);

    return redemption;
  }

  async isWebhookProcessed(payoutId: string, eventType: string) {
    const [redemption] = await database
      .select({ webhookProcessedAt: RedemptionModel.lastWebhookProcessedAt })
      .from(RedemptionModel)
      .where(sql`${RedemptionModel.webhookMetaData}->>'id' = ${payoutId} and ${RedemptionModel.webhookMetaData}->>'event' = ${eventType}`)
      .limit(1);

    return !!redemption?.webhookProcessedAt;
  }

  async updateRedemptionStatus(
    redemptionRef: string,
    status: typeof redemptionStatusEnum.enumValues[number],
    webhookMetaData: WebhookPayload
  ) {
    await database
      .update(RedemptionModel)
      .set({
        redemptionStatus: status,
        webhookMetaData: webhookMetaData,
        lastWebhookProcessedAt: new Date()
      })
      .where(eq(RedemptionModel.redemptionRef, redemptionRef));
  }

  async refundPoints(redemptionRef: string) {
    await database.transaction(async (tran) => {
      const [redemptionData] = await tran
        .select({
          userId: RedemptionModel.userId,
          points: RedemptionModel.points,
        })
        .from(RedemptionModel)
        .where(eq(RedemptionModel.redemptionRef, redemptionRef));

      await tran
        .update(MechanicModel)
        .set({
          redeemablePoints: sql`${MechanicModel.redeemablePoints} + ${redemptionData.points}`,
          balancePoints: sql`${MechanicModel.balancePoints} + ${redemptionData.points}`,
          redeemedPoints: sql`${MechanicModel.redeemedPoints} - ${redemptionData.points}`,
        })
        .where(eq(MechanicModel.userId, redemptionData.userId));

      await passbookRepository.addTransaction(
        redemptionData.userId,
        TRANSACTION_ENUM_TYPE.REFUND,
        Number(redemptionData.points || "0"),
        {
          redemptionRef,
          reason: REDEMPTION_REASON.REDEMPTION_FAILED
        },
        tran
      );
    });
  }

  async getRecentRedemptions(limit: number) {
    return await database
      .select({
        id: RedemptionModel.redemptionId,
        userId: UserModel.userId,
        userName: UserModel.userName,
        userEmail: UserModel.userEmail,
        userMobile: UserModel.userMobile,
        displayName: UserModel.displayName,

        points: RedemptionModel.points,
        type: sql`'redeem'`,
        createdAt: RedemptionModel.createdAt
      })
      .from(RedemptionModel)
      .leftJoin(UserModel, eq(RedemptionModel.userId, UserModel.userId))
      .orderBy(desc(RedemptionModel.createdAt))
      .limit(limit);
  }

  async updateRazorpayResponse(redemptionId: number, data: PayoutResponse) {
    await database
      .update(RedemptionModel)
      .set({
        razorpayMetaData: data,
      })
      .where(eq(RedemptionModel.redemptionId, redemptionId));
  }

}

export const redemptionRepository = new RedemptionRepository();

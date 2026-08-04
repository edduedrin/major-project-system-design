import redemptionRepository, { RedemptionRepository } from "../repository/redemption-repository";
import bankDetailsService, { BankDetailsService } from "../../bank-details/service/bank-details-service";
import upiDetailsService, { UpiDetailsService } from "../../upi-details/service/upi-details-service";
import walletService, { WalletService } from "../../wallet/service/wallet-service";
import { CustomError } from "../../../types";
import { publishJob } from "../../../services/rabbitMq/publisher";

export interface ICreateRedemptionInput {
  userId: string;
  redemptionType: "BANK" | "UPI";
  points?: number;
  walletPoints?: number;
}

export class RedemptionService {
  constructor(
    private repository: RedemptionRepository = redemptionRepository,
    private bankService: BankDetailsService = bankDetailsService,
    private upiService: UpiDetailsService = upiDetailsService,
    private walletSvc: WalletService = walletService
  ) {}

  private getConversionRatio(): number {
    const ratioStr = process.env.POINT_TO_CURRENCY_RATIO;
    const ratio = ratioStr ? parseFloat(ratioStr) : 1.0;
    return isNaN(ratio) || ratio <= 0 ? 1.0 : ratio;
  }

  async createRedemptionRequest(input: ICreateRedemptionInput) {
    const { userId, redemptionType } = input;
    const points = input.points !== undefined ? input.points : input.walletPoints;

    if (!userId) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: "User ID is required",
      });
    }

    const normalizedType = String(redemptionType || "").toUpperCase() as "BANK" | "UPI";
    if (!["BANK", "UPI"].includes(normalizedType)) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: "Invalid redemption type. Must be BANK or UPI.",
      });
    }

    if (points === undefined || points === null || points <= 0 || !Number.isInteger(points)) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: "Wallet points to redeem must be a positive integer",
      });
    }

    // 1. Validate sufficient wallet balance
    await this.walletSvc.ensureSufficientBalance(userId, points);

    // 2. Convert points to currency amount
    const ratio = this.getConversionRatio();
    const convertedAmount = (points * ratio).toFixed(2);

    let bankAccountSnapshot: any = null;
    let upiSnapshot: string | null = null;

    // 3 & 4. Validate payment details & create snapshot
    if (normalizedType === "BANK") {
      const bankDetails = await this.bankService.getBankDetails(userId);
      if (!bankDetails || !bankDetails.accountNumber || !bankDetails.ifscCode) {
        throw new CustomError({
          statusCode: 400,
          responseCode: 400,
          responseMessage: "No valid bank account details found for this user. Please configure bank details first.",
        });
      }

      bankAccountSnapshot = {
        accountHolderName: bankDetails.accountHolderName,
        accountNumber: bankDetails.accountNumber,
        ifscCode: bankDetails.ifscCode,
        bankName: bankDetails.bankName,
        branch: bankDetails.branch || null,
      };
    } else if (normalizedType === "UPI") {
      const upiDetails = await this.upiService.getUpiDetails(userId);
      if (!upiDetails || !upiDetails.upiId) {
        throw new CustomError({
          statusCode: 400,
          responseCode: 400,
          responseMessage: "No valid UPI ID configured for this user. Please configure UPI ID first.",
        });
      }

      upiSnapshot = upiDetails.upiId;
    }

    // 5. Deduct points from wallet
    await this.walletSvc.deductPoints(userId, points);

    // 6. Create redemption request record
    const record = await this.repository.createRedemptionRequest({
      userId,
      redemptionType: normalizedType,
      walletPoints: points,
      amount: convertedAmount,
      status: "PENDING",
      bankAccountSnapshot,
      upiSnapshot,
    });

    // Publish event asynchronously (error-safe)
    try {
      await publishJob({
        type: "redemption",
        payload: {
          redemptionId: record.id,
          userId: record.userId,
          redemptionType: record.redemptionType,
          walletPoints: record.walletPoints,
          amount: record.amount,
          status: record.status,
        },
      });
    } catch (err) {
      console.warn("Could not publish RabbitMQ redemption event:", err);
    }

    return record;
  }

  async getRedemptions(filters: { userId?: string; status?: string }, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;
    const items = await this.repository.getRedemptions(filters, limit, offset);
    const total = await this.repository.getTotalCount(filters);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getRedemptionById(id: string) {
    const record = await this.repository.getRedemptionById(id);
    if (!record) {
      throw new CustomError({
        statusCode: 404,
        responseCode: 404,
        responseMessage: "Redemption request record not found",
      });
    }
    return record;
  }

  async updateStatus(id: string, status: string) {
    const validStatuses = ["PENDING", "APPROVED", "REJECTED", "PAID"];
    const upperStatus = status?.toUpperCase();

    if (!validStatuses.includes(upperStatus)) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: `Invalid status. Status must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const updated = await this.repository.updateStatus(id, upperStatus);
    if (!updated) {
      throw new CustomError({
        statusCode: 404,
        responseCode: 404,
        responseMessage: "Redemption record not found to update",
      });
    }

    try {
      await publishJob({
        type: "redemption.status",
        payload: {
          redemptionId: id,
          status: upperStatus,
        },
      });
    } catch (err) {
      console.warn("Could not publish RabbitMQ redemption.status event:", err);
    }

    return updated;
  }
}

export default new RedemptionService();

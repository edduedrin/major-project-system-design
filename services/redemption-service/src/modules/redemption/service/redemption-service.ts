import redemptionRepository from "../repository/redemption-repository";
import { CustomError } from "../../../types";
import { publishJob } from "../../../services/rabbitMq/publisher";

export class RedemptionService {
  async createRedemption(data: {
    userId: string;
    totalPoints: number;
    remarks?: string;
    items: { productId: string; productName?: string; pointsPerUnit: number; quantity: number }[];
  }) {
    if (!data.userId || !data.totalPoints || data.totalPoints <= 0) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: "Invalid redemption parameters",
      });
    }

    const redemptionCode = `RDM-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const redemption = await redemptionRepository.createRedemption({
      ...data,
      redemptionCode,
    });

    // Publish event to RabbitMQ
    await publishJob({
      type: "redemption",
      payload: {
        redemptionId: redemption.id,
        userId: data.userId,
        redemptionCode,
        totalPoints: data.totalPoints,
        status: "PENDING",
      },
    });

    return redemption;
  }

  async getRedemptions(filters: { userId?: string; status?: string }, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;
    const items = await redemptionRepository.getRedemptions(filters, limit, offset);
    const total = await redemptionRepository.getTotalCount(filters);

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
    const redemption = await redemptionRepository.getRedemptionById(id);
    if (!redemption) {
      throw new CustomError({
        statusCode: 404,
        responseCode: 404,
        responseMessage: "Redemption record not found",
      });
    }
    return redemption;
  }

  async updateStatus(id: string, status: string, changedBy?: string, comment?: string) {
    const updated = await redemptionRepository.updateRedemptionStatus(id, status, changedBy, comment);
    if (!updated) {
      throw new CustomError({
        statusCode: 404,
        responseCode: 404,
        responseMessage: "Redemption record not found to update",
      });
    }

    await publishJob({
      type: "redemption.status",
      payload: {
        redemptionId: id,
        status,
        changedBy,
      },
    });

    return updated;
  }
}

export default new RedemptionService();

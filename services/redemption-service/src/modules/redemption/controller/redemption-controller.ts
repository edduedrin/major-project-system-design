import { Request, Response, NextFunction } from "express";
import redemptionService from "../service/redemption-service";
import { CustomError } from "../../../types";

export class RedemptionController {
  private getUserId(req: Request): string {
    const userId = req.user?.userId || (req.headers["x-user-id"] as string) || req.query.userId || req.body.userId;
    if (!userId) {
      throw new CustomError({
        statusCode: 401,
        responseCode: 401,
        responseMessage: "User identification missing. Please provide authentication token or X-User-Id header.",
      });
    }
    return String(userId);
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = this.getUserId(req);
      const { redemptionType, points, walletPoints } = req.body;

      const result = await redemptionService.createRedemptionRequest({
        userId,
        redemptionType,
        points: points !== undefined ? points : walletPoints,
      });

      return res.status(201).json({
        success: true,
        message: "Redemption request created successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRedemptions(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId: queryUserId, status, page, limit } = req.query;
      const authUserId = req.user?.userId || (req.headers["x-user-id"] as string);
      const targetUserId = (queryUserId as string) || authUserId;

      const filters = {
        userId: targetUserId,
        status: status as string,
      };
      const activePage = page ? parseInt(page as string, 10) : 1;
      const activeLimit = limit ? parseInt(limit as string, 10) : 10;

      const result = await redemptionService.getRedemptions(filters, activePage, activeLimit);
      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await redemptionService.getRedemptionById(id as string);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const result = await redemptionService.updateStatus(id as string, status);
      return res.status(200).json({
        success: true,
        message: "Redemption status updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new RedemptionController();

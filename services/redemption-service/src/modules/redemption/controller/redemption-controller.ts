import { Request, Response, NextFunction } from "express";
import redemptionService from "../service/redemption-service";

export class RedemptionController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId || req.body.userId;
      const result = await redemptionService.createRedemption({
        ...req.body,
        userId,
      });

      res.status(201).json({
        success: true,
        message: "Redemption initiated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRedemptions(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, status, page, limit } = req.query;
      const filters = {
        userId: userId as string,
        status: status as string,
      };
      const activePage = page ? parseInt(page as string, 10) : 1;
      const activeLimit = limit ? parseInt(limit as string, 10) : 10;

      const result = await redemptionService.getRedemptions(filters, activePage, activeLimit);
      res.status(200).json({
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
      res.status(200).json({
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
      const { status, comment } = req.body;
      const changedBy = req.user?.userId;

      const result = await redemptionService.updateStatus(id as string, status, changedBy, comment);
      res.status(200).json({
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

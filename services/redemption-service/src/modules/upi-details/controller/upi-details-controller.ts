import { Request, Response, NextFunction } from "express";
import upiDetailsService from "../service/upi-details-service";
import { CustomError } from "../../../types";

export class UpiDetailsController {
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

  async getUpiDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = this.getUserId(req);
      const data = await upiDetailsService.getUpiDetails(userId);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async saveUpiDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = this.getUserId(req);
      const { upiId } = req.body;

      const data = await upiDetailsService.saveUpiDetails({
        userId,
        upiId,
      });

      return res.status(200).json({
        success: true,
        message: "UPI details saved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UpiDetailsController();

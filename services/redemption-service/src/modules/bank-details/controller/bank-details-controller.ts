import { Request, Response, NextFunction } from "express";
import bankDetailsService from "../service/bank-details-service";
import { CustomError } from "../../../types";

export class BankDetailsController {
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

  async getBankDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = this.getUserId(req);
      const data = await bankDetailsService.getBankDetails(userId);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async saveBankDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = this.getUserId(req);
      const { accountHolderName, accountNumber, ifscCode, bankName, branch } = req.body;

      const data = await bankDetailsService.saveBankDetails({
        userId,
        accountHolderName,
        accountNumber,
        ifscCode,
        bankName,
        branch,
      });

      return res.status(200).json({
        success: true,
        message: "Bank details saved successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new BankDetailsController();

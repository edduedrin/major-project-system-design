import { Request, Response, NextFunction } from "express";
import { CustomError } from "../types";

export class ValidationMiddleware {
  static validateBankDetails(req: Request, res: Response, next: NextFunction) {
    const { accountHolderName, accountNumber, ifscCode, bankName } = req.body;
    const errors: { field: string; message: string }[] = [];

    if (!accountHolderName || typeof accountHolderName !== "string" || !accountHolderName.trim()) {
      errors.push({ field: "accountHolderName", message: "Account holder name is required" });
    }
    if (!accountNumber || typeof accountNumber !== "string" || !accountNumber.trim()) {
      errors.push({ field: "accountNumber", message: "Account number is required" });
    }
    if (!ifscCode || typeof ifscCode !== "string" || !ifscCode.trim()) {
      errors.push({ field: "ifscCode", message: "IFSC code is required" });
    }
    if (!bankName || typeof bankName !== "string" || !bankName.trim()) {
      errors.push({ field: "bankName", message: "Bank name is required" });
    }

    if (errors.length > 0) {
      return next(
        new CustomError({
          statusCode: 400,
          responseCode: 400,
          responseMessage: "Validation failed: Mandatory bank details missing or invalid",
          validationErrors: errors,
        })
      );
    }

    next();
  }

  static validateUpiDetails(req: Request, res: Response, next: NextFunction) {
    const { upiId } = req.body;
    const errors: { field: string; message: string }[] = [];

    if (!upiId || typeof upiId !== "string" || !upiId.trim()) {
      errors.push({ field: "upiId", message: "UPI ID is required" });
    } else {
      // Standard UPI ID pattern: handles username@bank, 9876543210@paytm, name.surname@okicici, etc.
      const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
      if (!upiRegex.test(upiId.trim())) {
        errors.push({ field: "upiId", message: "Invalid UPI ID format. Example format: username@bank" });
      }
    }

    if (errors.length > 0) {
      return next(
        new CustomError({
          statusCode: 400,
          responseCode: 400,
          responseMessage: "Validation failed: Invalid UPI details",
          validationErrors: errors,
        })
      );
    }

    next();
  }

  static validateRedemptionRequest(req: Request, res: Response, next: NextFunction) {
    const { redemptionType, points, walletPoints } = req.body;
    const effectivePoints = points !== undefined ? points : walletPoints;
    const errors: { field: string; message: string }[] = [];

    if (!redemptionType || !["BANK", "UPI"].includes(String(redemptionType).toUpperCase())) {
      errors.push({ field: "redemptionType", message: "Redemption type must be either BANK or UPI" });
    }

    if (
      effectivePoints === undefined ||
      effectivePoints === null ||
      typeof effectivePoints !== "number" ||
      isNaN(effectivePoints) ||
      effectivePoints <= 0 ||
      !Number.isInteger(effectivePoints)
    ) {
      errors.push({ field: "points", message: "Points must be a positive integer" });
    }

    if (errors.length > 0) {
      return next(
        new CustomError({
          statusCode: 400,
          responseCode: 400,
          responseMessage: "Validation failed: Invalid redemption request body",
          validationErrors: errors,
        })
      );
    }

    next();
  }
}

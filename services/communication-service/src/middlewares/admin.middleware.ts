import { Request, Response, NextFunction } from "express";
import { CustomError } from "../types";

export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return next(
      new CustomError({
        statusCode: 403,
        responseCode: 403,
        responseMessage: "Access denied. Admin rights required.",
      })
    );
  }
  next();
};

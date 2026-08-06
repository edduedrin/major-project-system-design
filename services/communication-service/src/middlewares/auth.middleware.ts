import { Request, Response, NextFunction } from "express";
import { JwtHelper } from "../utils/jwt-helper";
import { CustomError } from "../types";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new CustomError({
        statusCode: 401,
        responseCode: 401,
        responseMessage: "Authorization token missing or invalid",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = JwtHelper.verify(token);
    req.user = decoded;
    next();
  } catch (error: any) {
    next(
      error instanceof CustomError
        ? error
        : new CustomError({
            statusCode: 401,
            responseCode: 401,
            responseMessage: "Unauthorized access: " + error.message,
          })
    );
  }
};

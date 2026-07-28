import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { CustomError } from "../types";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "default_access_secret_123_abc";

class AuthMiddleware {
  adminVerifyToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(" ")[1];

      if (!token) {
        throw new CustomError({
          statusCode: 401,
          responseCode: 400,
          responseMessage: "Please provide token",
        });
      }

      const decoded = jwt.verify(token, ACCESS_SECRET) as any;
      if (!decoded || !decoded.userId || decoded.type !== "access") {
        throw new CustomError({
          statusCode: 401,
          responseCode: 400,
          responseMessage: "Please provide valid access token",
        });
      }

      req.user = decoded;
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
        return next(
          new CustomError({
            statusCode: 401,
            responseCode: 400,
            responseMessage: "Please provide valid access token",
          })
        );
      }
      next(error);
    }
  };
}

export const authMiddleware = new AuthMiddleware();

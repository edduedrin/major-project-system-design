import { RedisClient } from "../services/redis-client";
import { CustomError, LoginTokens, OtpSms, UserDetails, UserSearch } from "../types";
import jwt, { JwtPayload } from "jsonwebtoken";
import {
  ACCESSS_TOKEN_EXPIRY,
  ACCESSS_TOKEN_SECRET,
  JWT_SECRET,
  REFRESH_TOKEN_EXPIRY,
  REFRESH_TOKEN_SECRET,
  TEMP_TOKEN_EXPIRATION,
} from "../config/config";
import { NextFunction, Request, Response } from "express";
import { userRepository } from "../repositories";
import errorHandler from "./error-handler";
import { TokenPayload } from "../types/token";

class AuthMiddleware {
  customError: CustomError;
  private redisClient = RedisClient.getInstance();
  constructor() {
    this.customError = new CustomError({
      responseCode: 401,
      responseMessage: "",
      statusCode: 200,
    });
  }
  generateUserToken = (user: UserSearch): LoginTokens => {
    const loginTokens: LoginTokens = {
      accessToken: jwt.sign(
        {
          userId: user.userId,
          mobile: user.mobile,
          email: user.email,
          userCode: user.userCode
        },
        ACCESSS_TOKEN_SECRET as string,
        {
          expiresIn: ACCESSS_TOKEN_EXPIRY,
        }
      ),
      refreshToken: jwt.sign(
        {
          userId: user.userId,
          mobile: user.mobile,
          email: user.email,
          userCode: user.userCode
        },
        REFRESH_TOKEN_SECRET,
        {
          expiresIn: REFRESH_TOKEN_EXPIRY,
        }
      ),
    };
    return loginTokens;
  };

  generateMobileToken = (payload: OtpSms) => {
    const { mobile, otp } = payload;
    return jwt.sign({ mobile, otp }, JWT_SECRET, {
      expiresIn: TEMP_TOKEN_EXPIRATION,
    });
  };

  mobileToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req?.headers?.authorization?.split(" ")[1];
      if (req?.url == "/users" && !token) {
        this.customError.responseCode = 400;
        this.customError.responseMessage = "Please validate the OTP";
        throw this.customError;
      }
      if (!token) {
        this.customError.responseCode = 400;
        this.customError.responseMessage = "Please provide token";
        throw this.customError;
      }

      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      req.user = decoded as UserSearch;

      next();
    } catch (error: any) {
      return errorHandler.errorHandleMiddleware(
        error as CustomError,
        req,
        res,
        next
      );
    }
  };

  verifyRedisSession = async (userData: UserDetails, tokenPayload: TokenPayload, isRefreshToken: boolean = false) => {
    if (this.redisClient.isLive()) {
      let exisitingSessionId = await this.redisClient.getValue(userData?.userId);
      let exisitingSessionDetails = JSON.parse(exisitingSessionId || '{}');

      if (!exisitingSessionId) {
        throw new CustomError({
          responseMessage: "Please re-login",
          statusCode: 401,
        });
      }

      if (!isRefreshToken) {
        throw new CustomError({
          responseMessage: "Invalid Session, please login again!",
          statusCode: 440,
        });
      }
    }
  };

  verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        throw new CustomError({
          responseCode: 400,
          responseMessage: "Please provide token",
          statusCode: 401
        });
      }

      const decoded = jwt.verify(token, ACCESSS_TOKEN_SECRET) as TokenPayload;
      if (
        !decoded ||
        !decoded?.mobile ||
        !decoded?.userId ||
        !decoded?.userCode
      ) {
        this.customError.responseCode = 400;
        this.customError.responseMessage = "Please provide valid access token";
        throw this.customError;
      }

      req.user = decoded as UserSearch;

      const userDetails = await userRepository.getUserDetails(req.user, req?.url == "/user-profile");
      req.userDetails = userDetails;
      next();
    } catch (error) {
      console.log(error, "check");
      return errorHandler.errorHandleMiddleware(
        error as CustomError,
        req,
        res,
        next
      );
    }
  };

  adminVerifyToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        throw new CustomError({
          responseCode: 400,
          responseMessage: "Please provide token",
          statusCode: 401
        });
      }

      const decoded = jwt.verify(token, ACCESSS_TOKEN_SECRET) as TokenPayload;
      if (
        !decoded ||
        !decoded?.mobile ||
        !decoded?.userId ||
        !decoded?.userCode
      ) {
        this.customError.responseCode = 400;
        this.customError.responseMessage = "Please provide valid access token";
        throw this.customError;
      }

      req.user = decoded as UserSearch;

      const userDetails = await userRepository.getUserDetails(req.user);
      req.userDetails = userDetails;
      if (Number(req.userDetails?.userRoleId) === 1) {
        throw new CustomError({
          responseCode: 400,
          responseMessage: "User type restricted from accessing this route",
          statusCode: 401
        });
      }
      next();
    } catch (error) {
      console.log(error, "check");
      return errorHandler.errorHandleMiddleware(
        error as CustomError,
        req,
        res,
        next
      );
    }
  };

  customerVerifyToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        throw new CustomError({
          responseCode: 400,
          responseMessage: "Please provide token",
          statusCode: 401
        });
      }

      const decoded = jwt.verify(token, ACCESSS_TOKEN_SECRET) as TokenPayload;
      if (
        !decoded ||
        !decoded?.mobile ||
        !decoded?.userId ||
        !decoded?.userCode
      ) {
        this.customError.responseCode = 400;
        this.customError.responseMessage = "Please provide valid access token";
        throw this.customError;
      }

      req.user = decoded as UserSearch;

      const userDetails = await userRepository.getUserDetails(req.user);
      req.userDetails = userDetails;
      if (Number(req.userDetails?.userRoleId) != 1) {
        throw new CustomError({
          responseCode: 400,
          responseMessage: "User type restricted from accessing this route",
          statusCode: 401
        });
      }
      next();
    } catch (error) {
      console.log(error, "check");
      return errorHandler.errorHandleMiddleware(
        error as CustomError,
        req,
        res,
        next
      );
    }
  };
}

export const authMiddleware = new AuthMiddleware();

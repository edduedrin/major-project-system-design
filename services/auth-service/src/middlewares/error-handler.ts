import { NextFunction, Request, Response } from "express";
import { CustomError } from "../types";
import { MulterError } from "multer";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

class ErrorHandler {
  errorHandleMiddleware(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    let activeError = err;

    if (err instanceof TokenExpiredError) {
      activeError = new CustomError({
        statusCode: 440,
        responseCode: 440,
        responseMessage: "Session expired, Please re-initiate",
      });
    } else if (
      err instanceof JsonWebTokenError &&
      (err?.message === "invalid signature" || err?.message === "invalid token")
    ) {
      activeError = new CustomError({
        statusCode: 401,
        responseCode: 401,
        responseMessage: "Invalid session, Please re-initiate",
      });
    } else if (err instanceof MulterError) {
      let msg = "Invalid File";
      if (err.code === "LIMIT_FILE_SIZE") {
        msg = "File size exceeded";
      }
      activeError = new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: msg,
      });
    } else if (!(err instanceof CustomError)) {
      console.error(err);
      activeError = new CustomError({
        statusCode: 500,
        responseCode: 500,
        responseMessage: "Internal server issue, Please try again",
      });
    }

    const statusCode = activeError.statusCode || 500;
    const errorDetails = {
      code: activeError.responseCode || 500,
      message: activeError.responseMessage,
      error: process.env.NODE_ENV === "development" ? err.message || err : undefined,
      validationErrors: activeError.validationErrors || undefined,
    };

    return res.status(statusCode as number).json(errorDetails);
  }
}

const errorHandler = new ErrorHandler();
export default errorHandler;

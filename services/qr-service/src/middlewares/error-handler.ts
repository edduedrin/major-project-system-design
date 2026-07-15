import { NextFunction, Request, Response } from "express";
import { CustomError } from "../types";
import { MulterError } from "multer";

class ErrorHandler {
  errorHandleMiddleware(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    let activeError = err;

    if (err instanceof MulterError) {
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

import { NextFunction, Request, Response } from "express";
import { CustomError } from "../types";
import { MulterError } from "multer";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

class ErrorHandler {
  errorHandleMiddleware(
    err: CustomError,
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (err instanceof TokenExpiredError) {
      err.statusCode = 440;
      err.responseCode = 440;
      err.responseMessage = "Session expired, Please re-intiate";
    }

    if (
      err instanceof JsonWebTokenError &&
      (err?.message == "invalid signature" || err?.message == "invalid token")
    ) {
      err.statusCode = 401;
      err.responseCode = 401;
      err.responseMessage = "Invalid session, Please re-intiate";
    }

    if (!(err instanceof CustomError)) console.log(err);

    if (err instanceof MulterError) {
      err.responseCode = 400;
    }
    if (err instanceof MulterError && err?.code === "LIMIT_FILE_SIZE") {
      err.responseMessage = "File size exceed";
    }

    if (err instanceof MulterError && err?.code === "LIMIT_UNEXPECTED_FILE") {
      err.responseMessage = "Invalid File";
    }

    const statusCode = err?.statusCode || 200;
    const errorDetails = {
      code: "syscall" in err ? 555 : err?.responseCode || 500,
      message:
        err?.responseMessage || "Internal server issue, Please try again",
      error: err?.responseMessage || "syscall" in err ? undefined : err?.message || err,
      validationErrors: err?.validationErrors || undefined,
    };

    return res.status(statusCode as number).json(errorDetails);
  }
}

const errorHandler = new ErrorHandler();

export default errorHandler;

import { Request, Response, NextFunction } from "express";
import { CustomError } from "../types";
import logger from "../utils/logger";

class ErrorHandler {
  public errorHandleMiddleware = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    logger.error(`[ErrorHandler] ${req.method} ${req.url} - ${err.message}`, {
      stack: err.stack,
    });

    if (err instanceof CustomError) {
      res.status(err.statusCode).json({
        responseCode: err.responseCode,
        responseMessage: err.responseMessage,
        validationErrors: err.validationErrors,
      });
      return;
    }

    res.status(500).json({
      responseCode: 500,
      responseMessage: err.message || "Internal Server Error",
    });
  };
}

export default new ErrorHandler();

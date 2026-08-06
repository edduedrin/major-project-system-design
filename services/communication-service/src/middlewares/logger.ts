import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

class LoggerMiddleware {
  public apiLogger = (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    res.on("finish", () => {
      const responseTime = Date.now() - startTime;
      logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${responseTime}ms`);
    });
    next();
  };
}

export default new LoggerMiddleware();

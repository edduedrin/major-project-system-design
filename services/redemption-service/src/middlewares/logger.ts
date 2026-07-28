import { NextFunction, Request, Response } from "express";
import { createLogger, format, Logger, transports } from "winston";
import { TempApiLog } from "../types";

const { combine, timestamp, printf, colorize } = format;

class LoggerMiddleware {
  logger: Logger;
  customFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`;
  });

  constructor() {
    this.logger = createLogger({
      level: "info",
      format: combine(
        colorize(),
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        this.customFormat
      ),
      transports: [new transports.Console()],
    });
  }

  apiLogger = (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    res.json = (body: any) => {
      const message = body?.message || "No message";
      const code = body?.code || "No code";
      const err = JSON.stringify(body?.error);
      res.locals.message = message;
      res.locals.code = code;
      res.locals.error = err;
      return originalJson.call(res, body);
    };

    res.on("finish", () => {
      this.logger.info(
        `${req.method} ${req.originalUrl} - Status: ${res.statusCode} ${
          res.locals.code !== 200 && res.locals.code !== undefined
            ? `❗Message: ${res?.locals?.message || ""} - Code: ${res?.locals?.code || ""}`
            : ""
        } ${res?.locals?.error ? `Error : ${res?.locals?.error}` : ""}`
      );
    });

    next();
  };

  tempApiLogs = async (payload: TempApiLog) => {
    // Console log or persist temp logs if required
  };

  tempApiLogger = () => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const tempLog = new TempApiLog({
        request: JSON.stringify(req.body),
        meta: JSON.stringify(req.metaData || {}),
        token: req?.headers?.["authorization"],
        url: req.originalUrl,
      });

      const oldJson = res.json;

      res.json = (data: any) => {
        tempLog.response = JSON.stringify(data);
        this.tempApiLogs(tempLog);
        return oldJson.call(res, data);
      };

      try {
        next();
      } catch (err: any) {
        tempLog.response = JSON.stringify(err?.message || err || "{}");
        this.tempApiLogs(tempLog);
        next(err);
      }
    };
  };
}

const loggerMiddleware = new LoggerMiddleware();
export default loggerMiddleware;

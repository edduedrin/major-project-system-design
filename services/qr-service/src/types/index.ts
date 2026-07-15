import { Router, Request } from "express";
export { CustomError } from "./custom-error";
export { TempApiLog } from "./logger";

export interface IRouter {
  path: string;
  router: Router;
}

export class MetaData {
  source: string;
  version: string;
  latitude: string;
  longitude: string;
  ip: string;

  constructor(data: Request) {
    this.source = (data?.headers["req-source"] as string) || "unknown";
    this.version = (data?.headers["app-version"] as string) || "1.0.0";
    this.latitude = (data?.headers["latitude"] as string) || "";
    this.longitude = (data?.headers["longitude"] as string) || "";
    this.ip = data.ip || "0.0.0.0";
  }
}

declare global {
  namespace Express {
    interface Request {
      metaData: MetaData;
      user?: any;
    }
  }
}

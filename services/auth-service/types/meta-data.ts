import { Request } from "express";

export class MetaData {
  source: string;
  version: string;
  latitude: string;
  longitude: string;
  ip: string;
  constructor(data: Request) {
    if (
      typeof data?.headers["req-source"] == "string" &&
      typeof data?.headers["app-version"] == "string" &&
      typeof data?.headers["latitude"] == "string" &&
      typeof data?.headers["longitude"] == "string"
    ) {
      this.source = data?.headers["req-source"] || "unknown";
      (this.version = data?.headers["app-version"] || "1.0.0"),
        (this.latitude = data?.headers["latitude"] || "");
      this.longitude = data?.headers["longitude"] || "";
      this.ip = data.ip || "0.0.0.0";
    } else {
      this.source = "";
      this.version = "";
      this.latitude = "";
      this.longitude = "";
      this.ip = "";
    }
  }
}


export class TDSTrackMetaDataColumn {
  serialNumber?: string;
  refereeUserId?: number;
  refererUserId?: number;
  userId?: number;
}

export class PassbookMetaDataColumn {
  serialNumber?: string;
  userId?: number;
  refereeUserId?: number;
  refererUserId?: number;
  schemeId?: number;
  slabId?: number;
  isTdsDeducted?: boolean;
  redemptionRef?: string;
  redemptionId?: number;
  reason?: string;
}
import { TDSTrackMetaDataColumn } from "./meta-data";

export class TDSConsent{
    consent: string; 
    panNumber: string;
    constructor(data: Partial<TDSConsent>){
        this.consent = data?.consent || ""
        this.panNumber = data?.panNumber || ""
    }
}

export interface TDSTrackPayload {
  earnType: "scan" | "register" | "referral";
  earnedPoints?: number | string;
  tdsDeducted?: number | string;
  totalPoints?: number | string;
  tdsSlab?: number | string;
  metaData?: TDSTrackMetaDataColumn;
}
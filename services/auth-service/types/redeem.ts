import {
  redemptionModeEnum,
  redemptionStatusEnum,
  blockLevelEnum
} from "../schemas/enum-index";
import { ReportPagination } from "./pagination";

export class RedemptionPayload {
  type: "upi" | "bank-transfer";
  value: string;
  accountNumber: string;
  upiId: string;
  constructor(data: any) {
    this.type = data?.type || "";
    this.value = data?.value || "";
    this.accountNumber = data?.accountNumber || "";
    this.upiId = data?.upiId || "";
  }
}

export class InsertRedeemPayload {
  points: string = "0";
  redemptionMode!: (typeof redemptionModeEnum.enumValues)[number];
  userId: number = 0;
  redemptionRef: string = "0";
  redemptionStatus: (typeof redemptionStatusEnum.enumValues)[number] =
    "Pending";
  createdBy: number = 0;
}

export class RedemptionHistoryFilter extends ReportPagination {
  status: string[];
  redemptionRef: string[];
  fromDate: string;
  toDate: string;
  constructor(data: RedemptionHistoryFilter) {
    super(data);
    this.status = data?.status || [];
    this.redemptionRef = data?.redemptionRef || [];
    this.fromDate = data?.fromDate || "";
    this.toDate = data?.toDate || "";
  }
}

export class RedemptionParterData {
  balancePoints: any;
  accountNumber!: string | null;
  accountIfsc!: string | null;
  accountType!: "Savings" | "Current" | null;
  bankName!: string | null;
  bankBranch!: string | null;
  accountHolderName!: string | null;
  upiId!: string | null;
  chequeUrl!: string | null;
  cnFlag!: boolean | null;
  upiFlag!: boolean | null;
  bankFlag!: boolean | null;
  blockStatus!: "none" | "digilocker" | "kyc" | "incomplete-registration" | "kyc-admin" | "login" | "scan" | "redeem" | "inactive" | "dormant" | "de-activated" | "tds-consent" | null;
  kycApproval: any;
}

export class ProcessRedemptionPayload {
  redemptionRef: string;
  status: "Approve" | "Reject";
  comment: string;
  constructor(data: any) {
    this.redemptionRef = data?.redemptionRef || "";
    this.status = data?.status || "";
    this.comment = data?.comment || "";
  }
}

export class FetchRedemptionByRef {
  redemptionStatus: typeof redemptionStatusEnum.enumValues[number];
  redemptionMode: typeof redemptionModeEnum.enumValues[number];
  blockStatus: typeof blockLevelEnum.enumValues[number];
  points: string;
  redemptionRef: string;
  userId: number;
  userRole: number;
  constructor(data: any) {
    this.redemptionStatus = data?.redemptionStatus || "";
    this.redemptionMode = data?.redemptionMode || "";
    this.blockStatus = data?.blockStatus || "";
    this.points = data?.points || "";
    this.redemptionRef = data?.redemptionRef || ""
    this.userId = data?.userId || 0
    this.userRole = data?.userRole || 0
  }
}

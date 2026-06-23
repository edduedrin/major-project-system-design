import { transactionActionEnum } from "../schemas/passbook-audit-model";
import { CustomMulterFilesField, S3FileUrlType } from "../types";

export const ROLES = {
  MECHANIC: 1,
  REGION_MANAGER: 2,
  CALL_CENTRE_EXECUTIVE: 3,
  MARKETING_MANAGER: 4,
  OPERATOR: 5,
  VIEWER: 6
};

export const BLOCK_ID = {
  none: 1,
  login: 2,
  scan: 3,
  redeem: 4,
  profile: 5,
};

export const REDEMPTION_ID = {
  bankTransfer: 1,
  upi: 2,
  creditNote: 3,
};

export const REDEMPTION_STATUS = {
  pending: 0,
  approved: 1,
  rejected: 2,
};


export const FILE_TYPE: Record<'ticket', S3FileUrlType> = {
  ticket: 'ticket',
}

export const DATE_FORMAT = {
  ddmmyyyy: 'dd-MM-yyyy'
}

export const LOCAL_UTC = 5.5 * 60 * 60 * 1000


export const RETAILER_REGISTRATION: CustomMulterFilesField[] = [
  {
    name: "profileImage",
    maxCount: 1,
  },
  {
    name: "aadhaarFrontImage",
    maxCount: 1,
  },
  {
    name: "aadhaarBackImage",
    maxCount: 1,
  },
  {
    name: "panImage",
    maxCount: 1,
  },
  {
    name: "gstinImage",
    maxCount: 1,
  },
  {
    name: "passbookImage",
    maxCount: 1,
  },
];

export const PAGINATION_CONFIG = {
  skip: 0,
  limit: 10
}

export const TRANSACTION_ENUM_TYPE: Record<typeof transactionActionEnum.enumValues[number], typeof transactionActionEnum.enumValues[number]> = {
  QR_SCAN: "QR_SCAN",
  REGISTRATION: "REGISTRATION",
  BANK_TRANSFER: "BANK_TRANSFER",
  UPI: "UPI",
  VOUCHER: "VOUCHER",
  MARKETPLACE: "MARKETPLACE",
  REFUND: "REFUND",
  OTHERS: "OTHERS",
  TDS_DEDUCTED: "TDS_DEDUCTED",
  REFERRAL: "REFERRAL"
}

export const BUS_EVENTS = {
  REDEMPTION_REQUEST: "REDEMPTION_REQUEST",
  REDEMPTION_APPROVE: "REDEMPTION_APPROVE",
  REDEMPTION_REJECT: "REDEMPTION_REJECT",
};

export const REDEMPTION_REASON = {
  REDEMPTION_FAILED: "Redemption failed",
}

export const NOTIFICATION_MESSAGES = {
  SUCCESSFUL_SCAN: (points: number) => `Congratulations! You have successfully scanned a QR and earned ${points} points.`,
  SUCCESSFUL_REDEMPTION: (points: number) => `Your redemption of ${points} points was successful!`,
  KYC_APPROVED_REDEMPTION: (points: number) => `Your KYC has been approved and received ${points} points for successful registration!`
};
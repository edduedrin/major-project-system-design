import { blockLevelEnum } from "../schemas/user-model";
import { ReportPagination } from "./pagination";

export class ApplicationLoginPayload extends ReportPagination {
    fromDate: Date | null;
    toDate: Date | null;
    userName?: string | null;
    userMobile?: string | null;
    constructor(data: Partial<ApplicationLoginPayload>) {
        super(data);
        this.fromDate = data?.fromDate ? new Date(data.fromDate) : null;
        this.toDate = data?.toDate ? new Date(data.toDate) : null;
        this.userName = data?.userName ?? null;
        this.userMobile = data?.userMobile ?? null;
    }
}

export class RegisteredUsersPayload extends ReportPagination {
    fromDate: Date | null;
    toDate: Date | null;
    userName?: string | null;
    userMobile?: string | null;
    status?: typeof blockLevelEnum.enumValues[number];
    constructor(data: Partial<RegisteredUsersPayload>) {
        super(data);
        this.fromDate = data?.fromDate ? new Date(data.fromDate) : null;
        this.toDate = data?.toDate ? new Date(data.toDate) : null;
        this.userName = data?.userName ?? null;
        this.userMobile = data?.userMobile ?? null;
        this.status = data?.status ?? undefined;
    }
}

export class QRTransactionPayload extends ReportPagination {
    fromDate: Date | null;
    toDate: Date | null;
    userName?: string | null;
    userMobile?: string | null;
    status?: string | null;
    constructor(data: Partial<QRTransactionPayload>) {
        super(data);
        this.fromDate = data?.fromDate ? new Date(data.fromDate) : null;
        this.toDate = data?.toDate ? new Date(data.toDate) : null;
        this.userName = data?.userName ?? null;
        this.userMobile = data?.userMobile ?? null;
        this.status = data?.status ?? null;
    }
}

export class AdminReferalHistoryPayload extends ReportPagination {
    fromDate: Date | null;
    toDate: Date | null;
    receiverMobileNumber?: string | null;
    referralCode?: string | null;
    constructor(data: Partial<AdminReferalHistoryPayload>) {
        super(data);
        this.fromDate = data?.fromDate ? new Date(data.fromDate) : null;
        this.toDate = data?.toDate ? new Date(data.toDate) : null;
        this.receiverMobileNumber = data?.receiverMobileNumber ?? null;
        this.referralCode = data?.referralCode ?? null;
    }
}


export class StandardReportPayload extends ReportPagination {
    fromDate: Date | null;
    toDate: Date | null;
    constructor(data: Partial<StandardReportPayload>) {
        super(data);
        this.fromDate = data?.fromDate ? new Date(data.fromDate) : null;
        this.toDate = data?.toDate ? new Date(data.toDate) : null;
    }
}

export class BankDetailsPayload extends StandardReportPayload {
    uniqueCode?: string; name?: string; roleName?: string; mobileNumber?: string; bankName?: string; accountNumber?: string; ifscCode?: string; accountType?: string; upiId?: string;
    constructor(data: Partial<BankDetailsPayload>) {
        super(data);
        this.uniqueCode = data?.uniqueCode; this.name = data?.name; this.roleName = data?.roleName; this.mobileNumber = data?.mobileNumber; this.bankName = data?.bankName; this.accountNumber = data?.accountNumber; this.ifscCode = data?.ifscCode; this.accountType = data?.accountType; this.upiId = data?.upiId;
    }
}

export class KycReportPayload extends StandardReportPayload {
    uniqueCode?: string; name?: string; roleName?: string; mobileNumber?: string; emailId?: string; status?: string; aadhaarNumber?: string; kycDocStatus?: string;
    constructor(data: Partial<KycReportPayload>) {
        super(data);
        this.uniqueCode = data?.uniqueCode; this.name = data?.name; this.roleName = data?.roleName; this.mobileNumber = data?.mobileNumber; this.emailId = data?.emailId; this.status = data?.status; this.aadhaarNumber = data?.aadhaarNumber; this.kycDocStatus = data?.kycDocStatus;
    }
}

export class ProductWiseReportPayload extends StandardReportPayload {
    memberName?: string; productCode?: string; productCategory?: string; productType?: string; userType?: string; district?: string; state?: string; scandate?: Date | null;
    constructor(data: Partial<ProductWiseReportPayload>) {
        super(data);
        this.memberName = data?.memberName; this.productCode = data?.productCode; this.productCategory = data?.productCategory; this.productType = data?.productType; this.userType = data?.userType; this.district = data?.district; this.state = data?.state;
        this.scandate = data?.scandate ? new Date(data.scandate) : null;
    }
}

export class CategoryReportPayload extends StandardReportPayload {
    categoryName?: string; userType?: string;
    constructor(data: Partial<CategoryReportPayload>) {
        super(data);
        this.categoryName = data?.categoryName; this.userType = data?.userType;
    }
}

export class ErrorTransactionReportPayload extends StandardReportPayload {
    username?: string; userMobileNumber?: string; userType?: string; district?: string; state?: string; serialNumber?: string; productCode?: string; productStatus?: string;
    constructor(data: Partial<ErrorTransactionReportPayload>) {
        super(data);
        this.username = data?.username; this.userMobileNumber = data?.userMobileNumber; this.userType = data?.userType; this.district = data?.district; this.state = data?.state; this.serialNumber = data?.serialNumber; this.productCode = data?.productCode; this.productStatus = data?.productStatus;
    }
}

export class NotificationReportPayload extends StandardReportPayload { }

export class BlockedMemberReportPayload extends StandardReportPayload {
    username?: string; mobileNumber?: string; userType?: string; district?: string; state?: string; upiId?: string; accountNumber?: string; accountHolderName?: string; ifscCode?: string; bankName?: string; status?: string;
    constructor(data: Partial<BlockedMemberReportPayload>) {
        super(data);
        this.username = data?.username; this.mobileNumber = data?.mobileNumber; this.userType = data?.userType; this.district = data?.district; this.state = data?.state; this.upiId = data?.upiId; this.accountNumber = data?.accountNumber; this.accountHolderName = data?.accountHolderName; this.ifscCode = data?.ifscCode; this.bankName = data?.bankName; this.status = data?.status;
    }
}

export class BlockedMemberQrScanReportPayload extends StandardReportPayload {
    username?: string; mobileNumber?: string; district?: string; state?: string; serialNumber?: string; productCategory?: string; productCode?: string; productName?: string; scanStatus?: string;
    constructor(data: Partial<BlockedMemberQrScanReportPayload>) {
        super(data);
        this.username = data?.username; this.mobileNumber = data?.mobileNumber; this.district = data?.district; this.state = data?.state; this.serialNumber = data?.serialNumber; this.productCategory = data?.productCategory; this.productCode = data?.productCode; this.productName = data?.productName; this.scanStatus = data?.scanStatus;
    }
}

export class AnomalyTransactionsReportPayload extends StandardReportPayload {
    referenceId?: number; district?: string; state?: string; influencerName?: string; userMobileNumber?: string; productQR?: string;
    constructor(data: Partial<AnomalyTransactionsReportPayload>) {
        super(data);
        this.referenceId = data?.referenceId; this.district = data?.district; this.state = data?.state; this.influencerName = data?.influencerName; this.userMobileNumber = data?.userMobileNumber; this.productQR = data?.productQR;
    }
}

export class ShockReplacementReportPayload extends StandardReportPayload {
    userId?: number;
    constructor(data: Partial<ShockReplacementReportPayload>) {
        super(data);
        this.userId = data?.userId ? Number(data.userId) : undefined;
    }
}

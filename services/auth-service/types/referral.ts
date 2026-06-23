import { ReportPagination } from "./pagination";

export class ReferralHistoryPayload extends ReportPagination {
    referredBy: number | null;
    createdBy: number | null;
    referralCode: string;
    constructor(data: Partial<ReferralHistoryPayload>) {
        super(data);
        this.createdBy = data?.createdBy || null;
        this.referralCode = data?.referralCode || "";
        this.referredBy = data?.referredBy || null;
    }
}
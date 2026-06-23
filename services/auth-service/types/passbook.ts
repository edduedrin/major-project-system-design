import { ReportPagination } from "./pagination";

export class PassbookHistoryPayload extends ReportPagination {
    fromDate: string;
    toDate: string;
    constructor(data: Partial<PassbookHistoryPayload>) {
        super(data);
        this.fromDate = data?.fromDate || "";
        this.toDate = data?.toDate || "";
    }
}

export interface PassbookStatementPayload {
    userId: number;
    user: { name: string; role: string; firmName: string };
    summary: { totalBalance: number; totalEarned: number; totalRedeemed: number };
    transactions: Array<{
        sno: number;
        remarks: string;
        dr: number;
        cr: number;
        balance: number;
        date: Date | string;
    }>;
}
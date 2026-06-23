export interface PayoutRequest {
    account_number: string;
    reference_id: string;
    amount: number;
    currency?: string;
    mode: 'UPI' | 'NEFT' | 'RTGS' | 'IMPS';
    purpose: string;
    fund_account: {
        account_type: 'bank_account' | 'vpa';
        bank_account?: {
            name: string;
            ifsc: string;
            account_number: string;
        };
        vpa?: {
            address: string;
        };
        contact: {
            name: string;
            email: string;
            contact: string;
            type?: string;
            reference_id?: string;
        };
        queue_if_low_balance?: boolean;
        notes?: Record<string, any>;
    };
}

export interface PayoutResponse {
    id: string;
    entity: string;
    fund_account_id: string;
    amount: number;
    currency: string;
    notes: Record<string, any>;
    fees: number;
    tax: number;
    status: string;
    utr: string;
    mode: string;
    purpose: string;
    reference_id: string;
    narration: string;
    created_at: number;
}

export interface RazorpayError {
    error: {
        code: string;
        description: string;
        source: string;
        step: string;
        reason: string;
        metadata: any;
        field: string;
    };
}

export interface WebhookPayload {
    event: string;
    payload: {
        payout?: {
            entity: {
                id: string;
                status: string;
                reference_id: string;
                fund_account_id: string;
                utr: string;
                failure_reason?: string;
                notes: {
                    type: 'UPI' | 'BANK_TRANSFER';
                };
            };
        };
        transaction?: {
            entity: any;
        };
    };
}

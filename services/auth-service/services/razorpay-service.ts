import axios, { AxiosInstance, AxiosError } from "axios";
import crypto from "crypto";
import { RAZORPAY_ACCOUNT_NUMBER, RAZORPAY_BASE_URL, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_TIMEOUT, RAZORPAY_WEBHOOK_SECRET } from "../configs/config";
import { CustomError, PayoutRequest, PayoutResponse, RazorpayError, ServiceProviderLog, TempApiLog } from "../types";
import { loggerRepository } from "../repositories";
import { RedisClient } from "./redis-client";
import { Request } from "express";
import { redemptionRepository } from "../repositories/redemption-repository";

export class RazorpayService {
    private client: AxiosInstance;
    private redisClient = RedisClient.getInstance();

    constructor() {
        this.client = axios.create({
            baseURL: RAZORPAY_BASE_URL,
            timeout: RAZORPAY_TIMEOUT,
            auth: {
                username: RAZORPAY_KEY_ID,
                password: RAZORPAY_KEY_SECRET,
            },
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    private async checkIdempotency(key: string): Promise<PayoutResponse | null> {
        if (this.redisClient.isLive()) {
            const cached = await this.redisClient.getValueString(`idempotency:razorpay:${key}`);
            return cached ? JSON.parse(cached) : null;
        }
        return null;
    }

    private async storeIdempotency(key: string, data: PayoutResponse) {
        if (this.redisClient.isLive()) {
            await this.redisClient.setKeyString(`idempotency:razorpay:${key}`, JSON.stringify(data));
        }
    }

    async redemptionPayout(data: { redemptionId: number; redemptionRef: string; points: string; type: string; partnerData: any; userDetails: any; }) {
        const payoutRequest: PayoutRequest = {
            account_number: RAZORPAY_ACCOUNT_NUMBER,
            reference_id: data.redemptionRef,
            amount: Number(data.points) * 100, // Convert to paise
            currency: "INR",
            mode: data.type === "upi" ? "UPI" : "IMPS",
            purpose: "payout",
            fund_account: {
                account_type: data.type === "upi" ? "vpa" : "bank_account",
                ...(data.type === "bank-transfer" && {
                    bank_account: {
                        name: data?.partnerData?.accountHolderName,
                        ifsc: data?.partnerData?.accountIfsc,
                        account_number: data?.partnerData?.accountNumber,
                    },
                }),
                ...(data.type === "upi" && {
                    vpa: {
                        address: data?.partnerData?.upiId,
                    },
                }),
                contact: {
                    name: data?.userDetails?.userName || "",
                    email: data?.userDetails?.userEmail || "",
                    contact: data?.userDetails?.userMobile || "",
                    type: "customer",
                    reference_id: data?.userDetails?.userCode || "",
                },
                queue_if_low_balance: true,
                notes: {},
            },
        };

        return this.createPayout(payoutRequest, data.redemptionId, data.userDetails.userId);
    }

    async createPayout(
        request: PayoutRequest,
        redemptionId: number,
        createdBy?: number
    ): Promise<PayoutResponse> {
        const url = "payouts"
        const logData = new ServiceProviderLog({
            url: this.client.defaults.baseURL + url,
            request: JSON.stringify(request),
            response: "",
            createdAt: new Date(),
            createdBy: createdBy || 0,
        });

        try {
            const response = await this.client.post<PayoutResponse>(url, request);
            logData.response = JSON.stringify(response?.data);
            await redemptionRepository.updateRazorpayResponse(redemptionId, response?.data);

            return response.data;
        } catch (error: any) {
            const axiosError = error as AxiosError<RazorpayError>;
            const statusCode = axiosError?.response?.status || 500;
            const errorDescription = axiosError?.response?.data?.error?.description || error?.message;
            logData.response = JSON.stringify(axiosError?.response?.data || error?.message);

            throw new CustomError({
                responseMessage: errorDescription,
                statusCode: statusCode
            });
        } finally {
            loggerRepository.serviceProviderInsert(logData);
        }
    }

    async getPayoutStatus(payoutId: string, redemptionId?: number, createdBy?: number): Promise<PayoutResponse> {
        const url = `payouts/${payoutId}`;
        const logData = new ServiceProviderLog({
            url: this.client.defaults.baseURL + url,
            request: JSON.stringify({ payoutId }),
            response: "",
            createdAt: new Date(),
            createdBy: createdBy || 0,
        });

        try {
            const response = await this.client.get<PayoutResponse>(url);
            logData.response = JSON.stringify(response?.data);

            return response.data;
        } catch (error: any) {
            const axiosError = error as AxiosError<RazorpayError>;
            logData.response = JSON.stringify(axiosError?.response?.data || error?.message);

            throw new CustomError({
                responseMessage: axiosError?.response?.data?.error?.description || 'Failed to fetch payout status',
                statusCode: axiosError?.response?.status || 500
            });
        } finally {
            loggerRepository.serviceProviderInsert(logData);
        }
    }

    verifyWebhookSignature(payload: string, signature: string): boolean {
        const hmac = crypto.createHmac("sha256", RAZORPAY_WEBHOOK_SECRET || "");
        hmac.update(payload);
        const generatedSignature = hmac.digest("hex");
        return generatedSignature === signature;
    }

    async logWebhook(req: Request, response: any) {
        const tempLog = new ServiceProviderLog({
            request: JSON.stringify(req.body),
            response: JSON.stringify(response),
            url: req?.url,
            createdAt: new Date()
        });
        await loggerRepository.serviceProviderInsert(tempLog);
    }
}

export const razorpayService = new RazorpayService();
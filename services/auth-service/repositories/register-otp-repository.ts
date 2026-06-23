// repositories/register-otp-repository.ts
import { RegisterOtpModel } from "../schemas/register-otp-model";
import { database } from "../server";
import { CustomError, RegisterOtpPayload } from "../types";
import { eq, lt, desc, and, gt } from "drizzle-orm";

export class RegisterOtpRepository {
    customError: CustomError;
    constructor() {
        this.customError = new CustomError({
            responseCode: 400,
            responseMessage: "",
        });
    }

    async createOtp(payload: RegisterOtpPayload) {
        await database.insert(RegisterOtpModel).values({
            mobile: payload.mobile,
            otpCode: payload.otpCode,
            expiresAt: payload.expiresAt,
            isUsed: false,
        });
    }

    async getLatestOtp(mobile: string) {
        const [result] = await database
            .select()
            .from(RegisterOtpModel)
            .where(
                and(
                    eq(RegisterOtpModel.mobile, mobile),
                    eq(RegisterOtpModel.isUsed, false),
                    gt(RegisterOtpModel.expiresAt, new Date())
                )
            )
            .orderBy(desc(RegisterOtpModel.createdAt))
            .limit(1);

        if(!result){
            this.customError.responseMessage = "Please re-initiate the otp";
            throw this.customError;
        }

        return result;
    }

    async markOtpAsUsed(id: number) {
        await database
            .update(RegisterOtpModel)
            .set({ isUsed: true })
            .where(eq(RegisterOtpModel.id, id));
    }

    async markAllOtpsAsUsed(mobile: string) {
        await database
            .update(RegisterOtpModel)
            .set({ isUsed: true })
            .where(
                and(
                    eq(RegisterOtpModel.mobile, mobile),
                    eq(RegisterOtpModel.isUsed, false)
                )
            );
    }

    async deleteExpiredOtps() {
        await database
            .delete(RegisterOtpModel)
            .where(lt(RegisterOtpModel.expiresAt, new Date()));
    }
}

export const registerOtpRepository = new RegisterOtpRepository();

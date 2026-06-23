// repositories/otp-repository.ts
import { database } from "../server";
import { OtpModel } from "../schemas/index"; // adjust import if needed
import { eq, and, desc, sql } from "drizzle-orm";
type OtpType = typeof OtpModel.otpType["_"]["data"];
export class OtpRepository {
    /**
     * Create a new OTP entry
     */
    async createOtp({
        otp,
        userId,
        expiryAt,
        otpType,
    }: {
        otp: string;
        userId: number;
        expiryAt: Date;
        otpType: "forgot-password"; // later extend to enum type
    }) {
        const [created] = await database
            .insert(OtpModel)
            .values({
                otp,
                userId,
                expiryAt,
                otpType,
            })
            .returning();
        return created;
    }

    /**
     * Get latest OTP for user by type
     */
    async getLatestOtp(userId: number, otpType: OtpType) {
        const [otp] = await database
            .select()
            .from(OtpModel)
            .where(and(eq(OtpModel.userId, userId), eq(OtpModel.otpType, otpType)))
            .orderBy(desc(OtpModel.createdAt))
            .limit(1);

        return otp || null;
    }

    /**
     * Mark OTP as verified
     */
    async markOtpAsVerified(otpId: number) {
        return database
            .update(OtpModel)
            .set({ isVerified: true })
            .where(eq(OtpModel.otpId, otpId));
    }

    /**
     * Decrement OTP attempts
     */
    async decrementAttempts(otpId: number) {
        return database
            .update(OtpModel)
            .set({
                otpAttempt: sql`${OtpModel.otpAttempt} - 1`,
            })
            .where(eq(OtpModel.otpId, otpId));
    }

    /**
     * Invalidate all OTPs for a user+type
     */
    async invalidateAllOtps(userId: number, otpType: OtpType) {
        return database
            .delete(OtpModel)
            .where(
                and(
                    eq(OtpModel.userId, userId),
                    eq(OtpModel.otpType, otpType) // type matches enum
                )
            );
    }
}

export const otpRepository = new OtpRepository();

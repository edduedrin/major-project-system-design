import { DatabaseConnection } from "../../../database/database-connection";
import { otpVerification } from "../../../database/schema/schema";
import { eq, and, desc } from "drizzle-orm";

export class OtpRepository {
  private get db() {
    return DatabaseConnection.db;
  }

  async createOtp(data: {
    userId: string;
    mobile: string;
    otp: string;
    purpose: string;
    expiresAt: Date;
  }) {
    const [result] = await this.db
      .insert(otpVerification)
      .values({
        userId: data.userId,
        mobile: data.mobile,
        otp: data.otp,
        purpose: data.purpose,
        expiresAt: data.expiresAt,
        verified: false,
      })
      .returning();
    return result;
  }

  async findLatestUnverifiedOtp(
    userId: string,
    mobile: string,
    purpose: string
  ) {
    const results = await this.db
      .select()
      .from(otpVerification)
      .where(
        and(
          eq(otpVerification.userId, userId),
          eq(otpVerification.mobile, mobile),
          eq(otpVerification.purpose, purpose),
          eq(otpVerification.verified, false)
        )
      )
      .orderBy(desc(otpVerification.createdAt))
      .limit(1);

    return results[0] || null;
  }

  async markOtpAsVerified(otpId: string) {
    const [result] = await this.db
      .update(otpVerification)
      .set({ verified: true })
      .where(eq(otpVerification.id, otpId))
      .returning();
    return result;
  }
}
export default new OtpRepository();

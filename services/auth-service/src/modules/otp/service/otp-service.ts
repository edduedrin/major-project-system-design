import otpRepository from "../repository/otp-repository";
import { CustomError } from "../../../types";

export class OtpService {
  generateNumericOtp(length = 6): string {
    let otp = "";
    for (let i = 0; i < length; i++) {
      otp += Math.floor(Math.random() * 10).toString();
    }
    return otp;
  }

  async sendOtp(userId: string, mobile: string, purpose: string): Promise<string> {
    const otp = this.generateNumericOtp();
    // Expiry set to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await otpRepository.createOtp({
      userId,
      mobile,
      otp,
      purpose,
      expiresAt,
    });

    // Mock send - print to console
    console.log(`\n========================================`);
    console.log(`[OTP SERVICE] Sent OTP to ${mobile}`);
    console.log(`Purpose: ${purpose}`);
    console.log(`OTP Code: ${otp}`);
    console.log(`========================================\n`);

    return otp;
  }

  async verifyOtp(userId: string, mobile: string, otp: string, purpose: string): Promise<boolean> {
    const latestOtp = await otpRepository.findLatestUnverifiedOtp(userId, mobile, purpose);

    if (!latestOtp) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: "No OTP found or OTP has already been verified",
      });
    }

    if (new Date() > latestOtp.expiresAt) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: "OTP has expired",
      });
    }

    if (latestOtp.otp !== otp) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: "Invalid OTP code",
      });
    }

    await otpRepository.markOtpAsVerified(latestOtp.id);
    return true;
  }
}
export default new OtpService();

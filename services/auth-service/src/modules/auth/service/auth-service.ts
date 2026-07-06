import bcrypt from "bcryptjs";
import authRepository from "../repository/auth-repository";
import otpService from "../../otp/service/otp-service";
import sessionService from "../../session/service/session-service";
import { CustomError } from "../../../types";
import {
  validateEmail,
  validateMobile,
  validatePassword,
} from "../../../utils/validation";
import { generateResetToken, verifyToken } from "../../../utils/jwt-helper";

export class AuthService {
  async register(data: {
    email?: string;
    mobile?: string;
    password?: string;
    pin?: string;
  }) {
    const { email, mobile, password, pin } = data;

    if (!email && !mobile) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: "Either email or mobile must be provided",
      });
    }

    if (email && !validateEmail(email)) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: "Invalid email format",
      });
    }

    if (mobile && !validateMobile(mobile)) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: "Invalid mobile number format",
      });
    }

    if (!password || !validatePassword(password)) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: "Password must be at least 6 characters long",
      });
    }

    // Check email uniqueness
    if (email) {
      const existingUser = await authRepository.findUserByEmail(email);
      if (existingUser) {
        throw new CustomError({
          statusCode: 400,
          responseCode: 400,
          responseMessage: "Email is already registered",
        });
      }
    }

    // Check mobile uniqueness
    if (mobile) {
      const existingUser = await authRepository.findUserByMobile(mobile);
      if (existingUser) {
        throw new CustomError({
          statusCode: 400,
          responseCode: 400,
          responseMessage: "Mobile number is already registered",
        });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const pinHash = pin ? await bcrypt.hash(pin, 10) : undefined;

    const user = await authRepository.createUser({
      email,
      mobile,
      passwordHash,
      pinHash,
      status: "ACTIVE", // Mark immediately active for testing/use
    });

    return {
      id: user.id,
      email: user.email,
      mobile: user.mobile,
      status: user.status,
      createdAt: user.createdAt,
    };
  }

  async signIn(data: {
    email?: string;
    mobile?: string;
    password?: string;
    metaData?: any;
  }) {
    const { email, mobile, password, metaData } = data;

    if (!email && !mobile) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: "Either email or mobile must be provided",
      });
    }

    if (!password) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: "Password is required",
      });
    }

    let user = null;
    if (email) {
      user = await authRepository.findUserByEmail(email);
    } else if (mobile) {
      user = await authRepository.findUserByMobile(mobile);
    }

    if (!user || !user.passwordHash) {
      throw new CustomError({
        statusCode: 401,
        responseCode: 401,
        responseMessage: "Invalid credentials",
      });
    }

    if (user.status === "BLOCKED") {
      throw new CustomError({
        statusCode: 403,
        responseCode: 403,
        responseMessage: "Your account is blocked. Please contact support.",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      throw new CustomError({
        statusCode: 401,
        responseCode: 401,
        responseMessage: "Invalid credentials",
      });
    }

    // Update last login
    await authRepository.updateUser(user.id, { lastLoginAt: new Date() });

    // Create session
    const tokens = await sessionService.createSession(
      user.id,
      user.email || undefined,
      user.mobile || undefined,
      metaData
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        mobile: user.mobile,
        status: user.status,
      },
      ...tokens,
    };
  }

  async sendOtpForSignIn(data: { mobile?: string; email?: string }) {
    const { mobile, email } = data;

    if (!mobile && !email) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: "Either mobile or email is required to send OTP",
      });
    }

    let user = null;
    if (mobile) {
      user = await authRepository.findUserByMobile(mobile);
    } else if (email) {
      user = await authRepository.findUserByEmail(email);
    }

    if (!user) {
      throw new CustomError({
        statusCode: 404,
        responseCode: 404,
        responseMessage: "User not found",
      });
    }

    if (!user.mobile) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: "No mobile number registered for this account",
      });
    }

    const otp = await otpService.sendOtp(user.id, user.mobile, "SIGNIN");

    return {
      message: "OTP sent successfully",
      // Only return OTP in response for development convenience
      ...(process.env.NODE_ENV === "development" ? { otp } : {}),
    };
  }

  async verifyOtpForSignIn(data: {
    mobile?: string;
    email?: string;
    otp: string;
    metaData?: any;
  }) {
    const { mobile, email, otp, metaData } = data;

    if (!otp) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: "OTP is required",
      });
    }

    let user = null;
    if (mobile) {
      user = await authRepository.findUserByMobile(mobile);
    } else if (email) {
      user = await authRepository.findUserByEmail(email);
    }

    if (!user || !user.mobile) {
      throw new CustomError({
        statusCode: 404,
        responseCode: 404,
        responseMessage: "User not found or does not have a registered mobile",
      });
    }

    await otpService.verifyOtp(user.id, user.mobile, otp, "SIGNIN");

    // Update last login
    await authRepository.updateUser(user.id, { lastLoginAt: new Date() });

    // Create session
    const tokens = await sessionService.createSession(
      user.id,
      user.email || undefined,
      user.mobile || undefined,
      metaData
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        mobile: user.mobile,
        status: user.status,
      },
      ...tokens,
    };
  }

  async forgotPassword(data: { email?: string; mobile?: string }) {
    const { email, mobile } = data;

    if (!email && !mobile) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: "Either email or mobile must be provided",
      });
    }

    let user = null;
    if (email) {
      user = await authRepository.findUserByEmail(email);
    } else if (mobile) {
      user = await authRepository.findUserByMobile(mobile);
    }

    // Generic response for security to avoid user enumeration
    if (!user || !user.mobile) {
      return {
        message: "If the account exists, an OTP has been sent to the registered mobile",
      };
    }

    const otp = await otpService.sendOtp(user.id, user.mobile, "PASSWORD_RESET");

    return {
      message: "If the account exists, an OTP has been sent to the registered mobile",
      ...(process.env.NODE_ENV === "development" ? { otp } : {}),
    };
  }

  async sendOtpForPasswordReset(data: { email?: string; mobile?: string }) {
    const { email, mobile } = data;

    if (!email && !mobile) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: "Either email or mobile must be provided",
      });
    }

    let user = null;
    if (email) {
      user = await authRepository.findUserByEmail(email);
    } else if (mobile) {
      user = await authRepository.findUserByMobile(mobile);
    }

    if (!user || !user.mobile) {
      throw new CustomError({
        statusCode: 404,
        responseCode: 404,
        responseMessage: "User not found or has no mobile associated",
      });
    }

    const otp = await otpService.sendOtp(user.id, user.mobile, "PASSWORD_RESET");

    return {
      message: "OTP sent successfully",
      ...(process.env.NODE_ENV === "development" ? { otp } : {}),
    };
  }

  async verifyOtpForPasswordReset(data: {
    email?: string;
    mobile?: string;
    otp: string;
  }) {
    const { email, mobile, otp } = data;

    if (!otp) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: "OTP is required",
      });
    }

    let user = null;
    if (email) {
      user = await authRepository.findUserByEmail(email);
    } else if (mobile) {
      user = await authRepository.findUserByMobile(mobile);
    }

    if (!user || !user.mobile) {
      throw new CustomError({
        statusCode: 404,
        responseCode: 404,
        responseMessage: "User not found",
      });
    }

    await otpService.verifyOtp(user.id, user.mobile, otp, "PASSWORD_RESET");

    const resetToken = generateResetToken(user.id);

    return {
      message: "OTP verified successfully",
      resetToken,
    };
  }

  async resetPassword(data: { resetToken: string; newPassword?: string }) {
    const { resetToken, newPassword } = data;

    if (!resetToken) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: "Reset token is required",
      });
    }

    if (!newPassword || !validatePassword(newPassword)) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: "New password must be at least 6 characters long",
      });
    }

    let decoded: any;
    try {
      decoded = verifyToken(resetToken, "reset");
    } catch (error) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: "Invalid or expired reset token",
      });
    }

    if (decoded.type !== "password_reset") {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: "Invalid token type",
      });
    }

    const user = await authRepository.findUserById(decoded.userId);
    if (!user) {
      throw new CustomError({
        statusCode: 404,
        responseCode: 404,
        responseMessage: "User not found",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await authRepository.updateUser(user.id, { passwordHash });

    return {
      message: "Password reset successfully",
    };
  }
}
export default new AuthService();

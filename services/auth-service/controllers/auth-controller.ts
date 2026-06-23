// controllers/auth-controller.ts
import { CompareHash, CustomError, OtpInsert, OtpRequest, OtpSms, ResetPassword, UserDetails, UserLogin, UserSearch, userSignInPayload, VerifyOtpRequest, VerifyUserRequest } from "../types";
import { RedisClient } from "../services/redis-client";
import e, { NextFunction, Request, Response } from "express";
import { customValidators } from "../utils/custom-validators";
import { registerOtpRepository } from "../repositories/register-otp-repository";
import { userRepository } from "../repositories";
import { compareHash, generateHash, generateOtp } from "../utils/random";
import { authMiddleware } from "../middlewares/auth-middleware";
import { addMinutes } from "date-fns";
import { fileMiddleware } from "../middlewares/file-middleware";
import { smsHelper } from "../services";

export class AuthController {
    private customError: CustomError;
    private redisClient = RedisClient.getInstance();

    constructor() {
        this.customError = new CustomError({
            responseCode: 400,
            responseMessage: "",
            statusCode: 200,
        });
    }

    test = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const d = await fileMiddleware.getFileSignedUrl('1764660323283_rn_image_picker_lib_temp_2a12ff4e-3c1b-4f4f-a1b4-eb626b03b6a4.jpg', 'aadhaar-front');
            return res.send(d)
        } catch (error) {
            next(error)
        }
    }

    sendOtp = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = new OtpRequest(req?.body);
            customValidators.sendOtpReqValidator(payload);

            switch (payload.type) {
                case "register-user":
                    await this.registerUserOtp(payload.mobile);
                    break;
                case "forgot-password":
                    await this.forgotPasswordOtp(payload);
                    break;
                case "login-otp":
                    await this.loginOtp(payload.mobile);
                    break;
                default:
                    this.customError.responseMessage = "Invalid OTP type";
                    throw this.customError;
            }

            return res.json({
                code: 200,
                message: "OTP sent successfully. OTP will be valid for next 5 mins",
            });
        } catch (error) {
            next(error);
        }
    };

    verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
        try {

            let tempToken: string = "";
            const payload = customValidators.verifyUserValidator(req.body);

            switch (payload.type) {
                case "register-user":
                    await this.verifyRegisterUserOtp(payload.mobile, payload.otp);
                    break;
                case "forgot-password":
                    await this.forgotPasswordLogin(payload);
                    break;
                case "login-otp":
                    await this.otpVerification(payload);
                    break;
                default:
                    this.customError.responseMessage = "Invalid OTP type";
                    throw this.customError;
            }

            tempToken = authMiddleware.generateMobileToken(payload);

            return res.status(200).json({
                code: 200,
                message: "OTP verified successfully",
                token: tempToken || undefined
            });
        } catch (error) {
            next(error);
        }
    };

    signIn = async (
        req: Request, res: Response, next: NextFunction
    ): Promise<void> => {
        try {
            customValidators.userSignInPayloadValidator(req.body);
            const payload = new userSignInPayload(req.body);
            const hashedPassword: string = await userRepository.getHashedPassword({
                mobile: payload.mobile,
                email: payload.email,
            } as UserSearch);
            if (!hashedPassword) {
                this.customError.responseMessage = "Please set your password";
            }

            let comparePayload = new CompareHash({
                originalValue: payload.password,
                hashedValue: hashedPassword,
            });

            if (!(await compareHash(comparePayload))) {
                this.customError.responseMessage = "Incorrect password";
                throw this.customError;
            }
            let userData = {} as UserLogin;
            userData.userDetails = await userRepository.getUserDetails({
                mobile: payload.mobile,
                email: payload.email,
            } as UserSearch, true);
            const tokenPayload = new UserSearch({
                mobile: userData.userDetails.userMobile,
                userId: userData.userDetails.userId,
                email: userData.userDetails.userEmail,
                userCode: userData.userDetails.userCode
            } as any);
            userData.tokens = authMiddleware.generateUserToken(tokenPayload);

            if (this.redisClient.isLive()) {
                await this.redisClient.setKey(
                    userData.userDetails.userId,
                    userData.tokens.refreshToken
                );
            }
            await userRepository.updateLastLoginTime(userData.userDetails.userId, payload?.fcmToken);
            await userRepository.logActivity(userData.userDetails.userId, "login");
            res.status(200).json({
                code: 200,
                message: "Signed in successfully",
                token: userData.tokens,
                data: userData.userDetails,
            });
        } catch (error) {
            next(error);
        }
    };

    private forgotPasswordOtp = async (payload: OtpRequest): Promise<void> => {
        let createdAt = new Date();

        let otpInsert = new OtpInsert({
            userMobile: payload.mobile,
            // otp: "3018",
            otp: generateOtp()?.toString(),
            createdAt,
            expiryAt: addMinutes(createdAt, 5),
        });
        await userRepository.insertOtp(otpInsert);

        const userData = await userRepository.getUserDetails(new UserSearch({ mobile: payload.mobile, email: '', userId: 0, userCode: '' }));
        const name = userData?.userName || 'User';

        smsHelper.sendZFPasswordReset(otpInsert.userMobile, name, otpInsert.otp)
            .catch((error) => console.log('Reset Password SMS Failed', error));
    };

    private forgotPasswordLogin = async (payload: VerifyUserRequest) => {
        await this.otpVerification(payload);
        return authMiddleware.generateMobileToken(payload);
    };

    private otpVerification = async (payload: VerifyUserRequest) => {
        let searchPayload = {
            mobile: payload.mobile,
            email: payload.email,
        } as UserSearch;

        const userData = await userRepository.getUserDetails(searchPayload);
        if (!userData.userId) {
            this.customError.responseMessage = "User not found";
            throw this.customError;
        }

        const otpData = await userRepository.getRecentOtp(searchPayload, "active");

        if (!otpData?.otpTable) {
            this.customError.responseMessage = "Please re-initiate OTP";
            throw this.customError;
        }

        if (otpData?.otpTable?.otp != payload.otp) {
            await userRepository.updateOtp(otpData?.otpTable, "decr");
            this.customError.responseMessage =
                "Incorrect OTP, Please provide valid OTP";
            throw this.customError;
        }

        await userRepository.updateOtp(otpData?.otpTable, "verified");
    };

    private async registerUserOtp(mobile: string) {
        const existingUsers = await userRepository.getUserByMobile(mobile);
        if (existingUsers?.userId) {
            this.customError.responseMessage = "Mobile number is already registered";
            throw this.customError;
        }
        await registerOtpRepository.markAllOtpsAsUsed(mobile);

        // const otp = "3018"
        const otp = generateOtp()?.toString();

        const expiresAt = addMinutes(new Date(), 5);

        await registerOtpRepository.createOtp({
            mobile,
            otpCode: otp,
            expiresAt,
        });

        // Use 'User' temporarily for registration flow as user record is not yet created
        smsHelper.sendZFOtp(mobile, 'User', otp)
            .catch((error) => console.error('Registration SMS Failed', error));
    }

    private async loginOtp(mobile: string) {
        const userData = await userRepository.getUserDetails(new UserSearch({ mobile, email: '', userId: 0, userCode: '' }));
        if (!userData.userId) {
            this.customError.responseMessage = "Mobile number not registered";
            throw this.customError;
        }

        // const otp = "3018";
        const otp = generateOtp()?.toString();
        const createdAt = new Date();

        const otpInsert = new OtpInsert({
            userMobile: mobile,
            otp: otp,
            createdAt,
            expiryAt: addMinutes(createdAt, 5),
        });

        await userRepository.insertOtp(otpInsert);

        const name = userData?.userName || 'User';
        smsHelper.sendZFLogin(mobile, name, otp)
            .catch((error) => console.log('Login SMS Failed', error));
    }

    private async verifyRegisterUserOtp(mobile: string, otp: string) {
        const latestOtp = await registerOtpRepository.getLatestOtp(mobile);

        if (
            !latestOtp ||
            latestOtp.otpCode.trim() !== otp.trim()
        ) {
            this.customError.responseMessage = "Incorrect otp, please re-initiate the otp";
            throw this.customError;
        }

        await registerOtpRepository.markOtpAsUsed(latestOtp.id);
    }


    setNewPassword = async (req: Request, res: Response, next: NextFunction) => {
        try {

            let { mobile } = req?.user;
            let { password, type = "" } = customValidators.validateForgotPassword(req?.body);

            let newPwdPayload = new ResetPassword({
                mobile,
                password: await generateHash(password),
                passwordRaw: password,
                type,
            });

            await userRepository.setNewPassword(newPwdPayload);

            return res.json({
                code: 200,
                message: "Password has been reset successfully",
            });
        } catch (error) {
            next(error);
        }
    };

    userLogout = async (req: Request, res: Response, next: NextFunction) => {
        try {
            await userRepository.updateLastLogoutTime(req?.user?.userId);
            await userRepository.logActivity(req?.user?.userId, "logout");
            return res.json({
                message: "User logged out successfully",
                code: 200,
            })
        } catch (error) {
            next(error)
        }
    }

    setPin = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.setPinValidator(req.body);
            const { userId } = req.user;

            const pinHash = await generateHash(payload.pin);
            await userRepository.updatePinHash(userId, pinHash);

            return res.json({
                code: 200,
                message: "PIN has been set successfully",
            });
        } catch (error) {
            next(error);
        }
    };

    verifyPin = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.verifyPinValidator(req.body);
            const { userId } = req.user;

            const pinHash = await userRepository.getPinHash(userId);
            if (!pinHash) {
                this.customError.responseMessage = "PIN not set, please set your PIN first";
                throw this.customError;
            }

            const isMatch = await compareHash({
                originalValue: payload.pin,
                hashedValue: pinHash,
            });

            if (!isMatch) {
                this.customError.responseMessage = "Incorrect PIN";
                throw this.customError;
            }

            return res.json({
                code: 200,
                message: "PIN verified successfully",
            });
        } catch (error) {
            next(error);
        }
    };

}

export const authController = new AuthController();

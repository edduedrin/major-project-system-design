import { NextFunction, Request, Response } from "express";
import { CompareHash, CustomError, UserLogin, UserSearch, userSignInPayload } from "../types";
import { RedisClient } from "../services/redis-client";
import { customValidators } from "../utils/custom-validators";
import { userRepository } from "../repositories";
import { compareHash } from "../utils/random";
import { authMiddleware } from "../middlewares/auth-middlewares";

class AuthController {
    private customError: CustomError;
    private redisClient = RedisClient.getInstance();

    constructor() {
        this.customError = new CustomError({
            responseCode: 400,
            responseMessage: "",
            statusCode: 200,
        });
    }

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
}

export const authController = new AuthController();
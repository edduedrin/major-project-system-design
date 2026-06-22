import { database } from "../db/db-connection";
import { users } from "../db/schemas/member-model";
import { ActivityLogModel } from "../db/schemas/activity-log-model";
import { CustomError, UserDetails, UserSearch } from "../types";
import { eq, or } from "drizzle-orm";

export class UserRepository {
    customError: CustomError;
    constructor() {
        this.customError = new CustomError({
            responseCode: 400,
            responseMessage: "",
        });
    }

    async getHashedPassword(userSearch: UserSearch): Promise<string> {
        const [userData] = await database
            .select({ password: users.userPassword })
            .from(users)
            .where(
                or(
                    userSearch?.mobile ? eq(users.userMobile, userSearch.mobile) : undefined,
                    userSearch?.email ? eq(users.userEmail, userSearch.email) : undefined
                )
            )
            .limit(1);

        if (!userData) {
            this.customError.responseMessage =
                "User not found, Please provide valid email or mobile";

            throw this.customError;
        }
        return userData.password || "";
    }

    async getUserDetails(payload: UserSearch, userRequest: boolean = false): Promise<UserDetails> {
        const [result] = await database
            .select()
            .from(users)
            .where(
                or(
                    payload?.mobile ? eq(users.userMobile, payload?.mobile) : undefined,
                    payload?.email ? eq(users.userEmail, payload?.email) : undefined,
                    payload?.userId ? eq(users.userId, payload?.userId) : undefined,
                    payload?.userCode ? eq(users.userCode, payload?.userCode) : undefined,
                )
            )
            .limit(1);

        if (!result) {
            throw new CustomError({
                responseMessage: "User not found",
                statusCode: 401,
            });
        }

        return new UserDetails({
            ...result,
            isPinSet: !!result.pinHash,
            blockStatus: result.userStatus || "none",
            isShockReplacement: false
        });
    }

    async updateLastLoginTime(userId: number, fcmToken: string) {
        const [updatedUser] = await database
            .update(users)
            .set({
                lastLoginAt: new Date(),
                fcmToken: fcmToken,
            })
            .where(eq(users.userId, userId))
            .returning({
                userId: users.userId,
                userName: users.userName,
                lastLoginAt: users.lastLoginAt,
            });

        return updatedUser;
    }

    async logActivity(userId: number, activityType: "login" | "logout") {
        const [log] = await database
            .insert(ActivityLogModel)
            .values({
                userId: userId,
                activityType: activityType,
                createdBy: userId,
            })
            .returning({
                logId: ActivityLogModel.logId,
                activityType: ActivityLogModel.activityType,
                userId: ActivityLogModel.userId,
                createdAt: ActivityLogModel.createdAt,
            });
        return log;
    }
}

export const userRepository = new UserRepository();

import { database } from "../db/db-connection";
import { MemberModel } from "../db/schemas/member-model";
import { ActivityLogModel } from "../db/schemas/activity-log-model";
import { CustomError, UserDetails, UserSearch } from "../types";
import { eq, or } from "drizzle-orm";
import { ilike } from "drizzle-orm/gel-core/expressions";

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
            .select({ password: MemberModel.userPassword })
            .from(MemberModel)
            .where(
                or(
                    userSearch?.mobile ? eq(MemberModel.userMobile, userSearch.mobile) : undefined,
                    userSearch?.email ? ilike(MemberModel.userEmail, userSearch.email) : undefined
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
            .from(MemberModel)
            .where(
                or(
                    payload?.mobile ? eq(MemberModel.userMobile, payload?.mobile) : undefined,
                    payload?.email ? eq(MemberModel.userEmail, payload?.email) : undefined,
                    payload?.userId ? eq(MemberModel.userId, payload?.userId) : undefined,
                    payload?.userCode ? eq(MemberModel.userCode, payload?.userCode) : undefined,
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
            .update(MemberModel)
            .set({
                lastLoginAt: new Date(),
                fcmToken: fcmToken,
            })
            .where(eq(MemberModel.userId, userId))
            .returning({
                userId: MemberModel.userId,
                userName: MemberModel.userName,
                lastLoginAt: MemberModel.lastLoginAt,
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

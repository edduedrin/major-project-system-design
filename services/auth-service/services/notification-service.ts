import admin from "../configs/firebase";
import { database } from "../server";
import { NotificationLogModel, UserModel } from "../schemas";
import { isNotNull } from "drizzle-orm";

export class NotificationService {
    public static async sendBroadcastNotification(
        notificationId: number,
        title: string,
        body: string,
        scheduledAt: Date | null,
        imageUrl?: string
    ): Promise<{ successCount: number, failureCount: number }> {
        try {
            // Fetch all users with valid FCM tokens
            const users = await database
                .select({
                    userId: UserModel.userId,
                    fcmToken: UserModel.fcmToken
                })
                .from(UserModel)
                .where(isNotNull(UserModel.fcmToken));

            // userMap to map token back to userId for logging
            // Note: If multiple users have same token (unlikely but possible), this map might overwrite.
            // Better: array of objects {userId, fcmToken}
            const validUsers = users.filter(user => user.fcmToken !== null && user.fcmToken !== "");

            if (validUsers.length === 0) {
                console.log("No users with valid FCM tokens found.");
                return { successCount: 0, failureCount: 0 };
            }

            // Firebase multicast limit is 500 tokens per batch
            const batchSize = 500;
            let totalSuccessCount = 0;
            let totalFailureCount = 0;

            for (let i = 0; i < validUsers.length; i += batchSize) {
                const batchUsers = validUsers.slice(i, i + batchSize);
                const batchTokens = batchUsers.map(u => u.fcmToken as string);

                const message: admin.messaging.MulticastMessage = {
                    notification: {
                        title,
                        body,
                        ...(imageUrl && { imageUrl })
                    },
                    tokens: batchTokens
                };

                const response = await admin.messaging().sendEachForMulticast(message);
                totalSuccessCount += response.successCount;
                totalFailureCount += response.failureCount;

                const logEntries: any[] = [];
                const processedAt = new Date();

                response.responses.forEach((resp, idx) => {
                    const user = batchUsers[idx];
                    logEntries.push({
                        notificationId,
                        userId: user.userId,
                        status: resp.success ? "SENT" : "FAILED",
                        failureReason: resp.success ? null : (resp.error?.code || resp.error?.message || "Unknown error"),
                        scheduledAt: scheduledAt,
                        processedAt: processedAt
                    });
                });

                if (logEntries.length > 0) {
                    await database.insert(NotificationLogModel).values(logEntries);
                }
            }

            console.log(`Broadcast Notification Sent: Success: ${totalSuccessCount}, Failure: ${totalFailureCount}`);
            return { successCount: totalSuccessCount, failureCount: totalFailureCount };

        } catch (error) {
            console.error("Error sending broadcast notification:", error);
            throw error;
        }
    }
}

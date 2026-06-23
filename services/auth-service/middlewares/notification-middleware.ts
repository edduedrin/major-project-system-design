import { database } from "../server";
import { UserModel, NotificationModel } from "../schemas";
import { publishJob } from "../services/rabbitMqNew/publisher";
import { eq, isNotNull, and, gt } from "drizzle-orm";
import { NOTIFICATION_MESSAGES } from "../utils/constant";

export class NotificationMiddleware {
    /**
     * Internal method to trigger a single-user transactional notification 
     * without causing a global fan-out broadcast.
     */
    public static async sendTransactionalNotification(
        userId: number,
        title: string,
        body: string,
        imageUrl?: string,
        redirectionLink?: string
    ) {
        try {
            console.log('----HERE2----')
            // 1. Fetch user's FCM token
            const [user] = await database
                .select({ fcmToken: UserModel.fcmToken })
                .from(UserModel)
                .where(
                    and(
                        eq(UserModel.userId, userId),
                        isNotNull(UserModel.fcmToken),
                        gt(UserModel.fcmToken, "")
                    )
                )
                .limit(1);

            if (!user || !user.fcmToken) {
                console.warn(`[InternalNotification] User ${userId} has no valid FCM token, skipping push notification.`);
                return;
            }

            // 2. Insert into tbl_notifications as FANNED_OUT to bypass global fan-out
            // Setting totalUsers: 1 so the worker will immediately complete it after this batch.
            const [notification] = await database
                .insert(NotificationModel)
                .values({
                    title,
                    body,
                    imageUrl: imageUrl || null,
                    redirectionLink: redirectionLink || null,
                    status: "FANNED_OUT",
                    type: "REGULAR",
                    totalUsers: 1
                })
                .returning();

            // 3. Publish directly to the user queue skipping the exact fan-out step
            await publishJob({
                type: "notification.user",
                payload: {
                    notificationId: notification.id,
                    title: notification.title,
                    body: notification.body,
                    imageUrl: notification.imageUrl,
                    redirectionLink: notification.redirectionLink,
                    scheduledAt: null,
                    users: [{ userId, fcmToken: user.fcmToken }]
                }
            });
            console.log(`[InternalNotification] Successfully queued notification for user ${userId}.`);
        } catch (error) {
            console.error(`[InternalNotification] Failed to send transactional notification for user ${userId}:`, error);
        }
    }

    /**
     * Triggered internally after a successful QR scan.
     */
    public static async notifySuccessfulScan(userId: number, points: number) {
        console.log('----Here-----')
        await this.sendTransactionalNotification(
            userId,
            "Scan Successful",
            NOTIFICATION_MESSAGES.SUCCESSFUL_SCAN(points)
        );
    }

    /**
     * Triggered internally after a successful redemption.
     */
    public static async notifySuccessfulRedemption(userId: number, points: number) {
        await this.sendTransactionalNotification(
            userId,
            "Redemption Successful",
            NOTIFICATION_MESSAGES.SUCCESSFUL_REDEMPTION(points)
        );
    }
    public static async notifyKycApproved(userId: number, points: number) {
        await this.sendTransactionalNotification(
            userId,
            "KYC Approved",
            NOTIFICATION_MESSAGES.KYC_APPROVED_REDEMPTION(points)
        );
    }
}
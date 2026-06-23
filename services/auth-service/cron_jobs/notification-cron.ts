import cron from 'node-cron';
import { database } from '../server';
import { NotificationModel } from '../schemas';
import { eq, and, lte, or, isNull, isNotNull, lt } from 'drizzle-orm';
import { publishJob } from '../services/rabbitMqNew/publisher';

const timeZone = 'Asia/Kolkata';

/**
 * Safety-net cron: re-queues PENDING notifications that were never picked up by the queue.
 *
 * This handles the race condition where the server crashed after DB insert but
 * before the RabbitMQ publish in the controller, leaving notifications stuck
 * as PENDING forever.
 *
 * Runs every minute — the queue consumer handles real-time delivery.
 */
export async function rescuePendingNotifications() {
    try {
        const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        // PENDING: controller crashed before publishing to RabbitMQ (grace = 1 min)
        // PROCESSING / FANNED_OUT: fan-out consumer crashed mid-work (grace = 5 min)
        const stuckNotifications = await database
            .select()
            .from(NotificationModel)
            .where(
                or(
                    // 1. Stuck immediate notifications (crashed between insert and publish)
                    and(
                        eq(NotificationModel.status, "PENDING"),
                        isNull(NotificationModel.scheduledAt),
                        lt(NotificationModel.createdAt, oneMinuteAgo)
                    ),
                    // 2. Valid scheduled notifications that are now due to be sent
                    and(
                        eq(NotificationModel.status, "PENDING"),
                        isNotNull(NotificationModel.scheduledAt),
                        lte(NotificationModel.scheduledAt, new Date())
                    ),
                    // 3. Rescuing stuck process-level fan-outs
                    and(
                        or(
                            eq(NotificationModel.status, "PROCESSING"),
                            eq(NotificationModel.status, "FANNED_OUT")
                        ),
                        lt(NotificationModel.updatedAt, fiveMinutesAgo)
                    )
                )
            );

        if (stuckNotifications.length === 0) return;

        console.log(`[NotificationCron] Rescuing ${stuckNotifications.length} stuck notification(s)...`);

        for (const notification of stuckNotifications) {
            try {
                await publishJob({
                    type: "notification",
                    payload: { notificationId: notification.id }
                });
                console.log(`[NotificationCron] Re-queued notification ID: ${notification.id} (was ${notification.status})`);
            } catch (publishError) {
                console.error(`[NotificationCron] Failed to re-queue notification ID ${notification.id}:`, publishError);
            }
        }

    } catch (error) {
        console.error("[NotificationCron] Error during rescue sweep:", error);
    }
}

// Runs every minute — queue consumer handles real-time delivery
// const notificationTask = cron.schedule(
//     '* * * * *',
//     () => {
//         rescuePendingNotifications().catch((err) => {
//             console.error('[NotificationCron] Unhandled error:', err);
//         });
//     },
//     { timezone: timeZone }
// );

// export default notificationTask;

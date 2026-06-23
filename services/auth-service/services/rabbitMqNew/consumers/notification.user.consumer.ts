import { createConsumerChannel } from "../connection";
import { NotificationBatchPayload, NotificationController } from "../../../controllers/notification-controller";
import { database } from "../../../server";
import { NotificationLogModel } from "../../../schemas";

// How many batch messages may be processed in parallel per consumer instance.
// Each batch fires ONE sendEachForMulticast call covering up to 500 tokens.
const PREFETCH_COUNT = 1;

export async function startNotificationUserConsumer() {
    const channel = await createConsumerChannel();

    await channel.prefetch(PREFETCH_COUNT);

    channel.consume(
        "notification.user.queue",
        async (msg) => {
            if (!msg) return;

            let payload: NotificationBatchPayload | null = null;

            try {
                const data = JSON.parse(msg.content.toString());
                payload = data.payload as NotificationBatchPayload;

                await NotificationController.sendBatch(payload);

                channel.ack(msg);
            } catch (error) {
                console.error(
                    `[notification.user] Batch failed for notificationId=${payload?.notificationId}:`,
                    error
                );

                // Best-effort: mark every user in the batch as FAILED in one bulk INSERT.
                // onConflictDoNothing ensures this is safe even if sendBatch partially
                // succeeded before throwing (some rows may already exist).
                if (payload) {
                    const reason = (error as Error).message ?? "Consumer error";
                    const failedRows = payload.users.map(u => ({
                        notificationId: payload!.notificationId,
                        userId: u.userId,
                        status: "FAILED" as const,
                        failureReason: reason,
                        scheduledAt: payload!.scheduledAt ? new Date(payload!.scheduledAt) : null,
                        processedAt: new Date()
                    }));

                    await database
                        .insert(NotificationLogModel)
                        .values(failedRows)
                        .onConflictDoNothing()
                        .catch(() => { });

                    // Recompute exact counts from the log table
                    await NotificationController.syncCounts(payload.notificationId).catch(() => { });
                }

                channel.nack(msg, false, false);
                // → DLQ, no requeue (avoids poison-pill loop)
            }
        },
        { noAck: false }
    );
}

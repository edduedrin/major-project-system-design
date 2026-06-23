import { createConsumerChannel } from "../connection";
import { NotificationController } from "../../../controllers/notification-controller";

export async function startNotificationConsumer() {
    const channel = await createConsumerChannel();

    await channel.prefetch(1);
    // Notification = I/O heavy (Firebase API calls) → allow some concurrency

    channel.consume(
        "notification.queue",
        async (msg) => {
            if (!msg) return;

            try {
                const data = JSON.parse(msg.content.toString());
                const notificationId = data.payload.notificationId as number;

                await NotificationController.processNotification(notificationId);

                channel.ack(msg);
            } catch (error) {
                console.error("Notification consumer failed:", error);
                channel.nack(msg, false, false);
                // Send to DLQ — no requeue to avoid poison-pill loop
            }
        },
        { noAck: false }
    );
}
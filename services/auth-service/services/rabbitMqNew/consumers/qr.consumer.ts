import { createConsumerChannel } from "../connection";
import { qrController } from "../../../controllers/qr-controller";

export async function startQrConsumer() {
    const channel = await createConsumerChannel();

    await channel.prefetch(1);
    // CPU heavy → one at a time

    channel.consume(
        "qr.queue",
        async (msg) => {
            if (!msg) return;

            try {
                const data = JSON.parse(msg.content.toString());

                // RabbitMQ wrap payload inside data.payload
                await qrController.generateQr(data.payload);

                channel.ack(msg);
            } catch (error) {
                console.error("QR failed:", error);
                channel.nack(msg, false, false);
            }
        },
        { noAck: false }
    );
}
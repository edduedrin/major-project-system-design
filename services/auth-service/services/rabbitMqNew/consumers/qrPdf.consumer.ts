import { createConsumerChannel } from "../connection";
import { qrController } from "../../../controllers/qr-controller";

export async function startQrPdfConsumer() {
    const channel = await createConsumerChannel();

    await channel.prefetch(1);
    // PDF generation is heavy

    channel.consume(
        "qr_pdf.queue",
        async (msg) => {
            if (!msg) return;

            try {
                const data = JSON.parse(msg.content.toString());

                // RabbitMQ wrap payload inside data.payload
                await qrController.generateQrPdf(data.payload);

                channel.ack(msg);
            } catch (error) {
                console.error("QR PDF failed:", error);
                channel.nack(msg, false, false);
            }
        },
        { noAck: false }
    );
}
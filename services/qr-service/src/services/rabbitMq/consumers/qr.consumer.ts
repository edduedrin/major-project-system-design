import { createConsumerChannel } from "../connection";
import qrService from "../../../modules/qr/service/qr-service";
import qrRepository from "../../../modules/qr/repository/qr-repository";

export async function startQrConsumer() {
    const channel = await createConsumerChannel();

    await channel.prefetch(1);
    // CPU heavy -> one at a time

    console.log("📥 QR Generation Consumer started, listening on qr.queue...");

    channel.consume(
        "qr.queue",
        async (msg) => {
            if (!msg) return;

            try {
                const data = JSON.parse(msg.content.toString());
                const payload = data.payload?.payload;
                const jobId = data.payload?.jobId;
                const createdBy = data.payload?.createdBy;

                const productId = payload?.productId;
                const productName = payload?.productName;
                const quantity = payload?.quantity;

                console.log(`Processing QR job: quantity=${quantity}, productId=${productId}`);

                // Update job status in DB if jobId is provided
                if (jobId) {
                    await qrRepository.updateJobStatus(jobId, "PROCESSING");
                }

                // Generate codes and insert them
                await qrService.generateCodes({
                    productId,
                    productName,
                    quantity
                });

                if (jobId) {
                    await qrRepository.updateJobStatus(jobId, "COMPLETED");
                }

                channel.ack(msg);
                console.log(`Job successfully processed and acknowledged.`);
            } catch (error: any) {
                console.error("QR Consumer processing failed:", error);
                
                try {
                    const data = JSON.parse(msg.content.toString());
                    const jobId = data.payload?.jobId;
                    if (jobId) {
                        await qrRepository.updateJobStatus(jobId, "FAILED", error.message || String(error));
                    }
                } catch (dbErr) {
                    console.error("Failed to write failure status to DB:", dbErr);
                }

                // Re-queue false, requeueing to DLQ
                channel.nack(msg, false, false);
            }
        },
        { noAck: false }
    );
}
export async function startQrPdfConsumer() {
    const channel = await createConsumerChannel();
    await channel.prefetch(1);
    channel.consume(
        "qr_pdf.queue",
        async (msg) => {
            if (!msg) return;
            try {
                // Stub for pdf generation queue
                channel.ack(msg);
            } catch (err) {
                channel.nack(msg, false, false);
            }
        }
    );
}

import { createConsumerChannel } from "../connection";
import qrRepository from "../../../modules/qr/repository/qr-repository";
import { generateQrPdf } from "../../../utils/pdf-generator";

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
                const rawData = JSON.parse(msg.content.toString());
                const payloadData = rawData.payload?.payload || rawData.payload || rawData;
                
                const jobId = payloadData?.jobId;
                const productId = payloadData?.productId;
                const productName = payloadData?.productName;
                const serialNumbers: string[] = payloadData?.serialNumbers || [];

                console.log(`Processing QR PDF job [${jobId}]: serialNumbersCount=${serialNumbers.length}, productId=${productId}`);

                if (jobId) {
                    await qrRepository.updateJobStatus(jobId, "PROCESSING");
                }

                if (serialNumbers.length > 0 && jobId) {
                    // Generate QR codes & PDF document asynchronously
                    const { pdfFileName, pdfPath } = await generateQrPdf({
                        jobId,
                        productId,
                        productName,
                        serialNumbers,
                    });

                    console.log(`PDF successfully generated: ${pdfFileName} at ${pdfPath}`);

                    // Update database record with generated PDF details and status COMPLETED
                    await qrRepository.updateJobPdfDetails(jobId, pdfFileName, pdfPath, "COMPLETED");
                } else if (jobId) {
                    await qrRepository.updateJobStatus(jobId, "COMPLETED");
                }

                channel.ack(msg);
                console.log(`Job [${jobId}] successfully processed and acknowledged.`);
            } catch (error: any) {
                console.error("QR Consumer processing failed:", error);
                
                try {
                    const rawData = JSON.parse(msg.content.toString());
                    const payloadData = rawData.payload?.payload || rawData.payload || rawData;
                    const jobId = payloadData?.jobId;
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

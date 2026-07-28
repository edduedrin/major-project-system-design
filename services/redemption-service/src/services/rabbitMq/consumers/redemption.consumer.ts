import { createConsumerChannel } from "../connection";
import redemptionRepository from "../../../modules/redemption/repository/redemption-repository";

export async function startRedemptionConsumer() {
    const channel = await createConsumerChannel();
    await channel.prefetch(5);

    console.log("📥 Redemption Consumer started, listening on redemption.queue...");

    channel.consume(
        "redemption.queue",
        async (msg) => {
            if (!msg) return;

            try {
                const rawData = JSON.parse(msg.content.toString());
                const payloadData = rawData.payload?.payload || rawData.payload || rawData;

                const redemptionId = payloadData?.redemptionId;
                const status = payloadData?.status;

                console.log(`Processing redemption queue job for ID: ${redemptionId}`);

                if (redemptionId && status) {
                    await redemptionRepository.updateRedemptionStatus(redemptionId, status);
                }

                channel.ack(msg);
                console.log(`Redemption job [${redemptionId}] processed successfully.`);
            } catch (error: any) {
                console.error("Redemption Consumer processing failed:", error);
                channel.nack(msg, false, false);
            }
        },
        { noAck: false }
    );
}

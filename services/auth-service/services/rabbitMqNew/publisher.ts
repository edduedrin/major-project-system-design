import { getPublishChannel } from "./connection";

export type JobType = "notification" | "notification.user" | "qr" | "qr_pdf";

export interface PublishOptions {
    type: JobType;
    payload: any;
}

export async function publishJob(options: PublishOptions) {
    console.log('----HERE3----')
    const channel = getPublishChannel();

    const message = {
        type: options.type,
        createdAt: new Date().toISOString(),
        payload: options.payload,
    };
    // Simple message structure.
    // No idempotency for now.
    console.log("--------Publishing JobType ", options.type, "-----");
    channel.publish(
        "app.exchange",
        options.type, // routing key
        Buffer.from(JSON.stringify(message)),
        {
            persistent: true,
            // ✅ Handles: Broker crash
            // Message written to disk, survives restart.

            contentType: "application/json",

            mandatory: true,
            // ✅ Handles: No queue bound
            // Prevents silent drop if routing key not bound.
        }
    );

    // Wait for broker confirmation
    await channel.waitForConfirms();
    // ✅ Handles: Silent message loss
    // Ensures broker actually stored message before returning success.

    return true;
}
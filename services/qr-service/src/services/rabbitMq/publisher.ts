import { getPublishChannel } from "./connection";

export type JobType = "notification" | "notification.user" | "qr" | "qr_pdf";

export interface PublishOptions {
    type: JobType;
    payload: any;
}

export async function publishJob(options: PublishOptions) {
    const channel = getPublishChannel();

    const message = {
        type: options.type,
        createdAt: new Date().toISOString(),
        payload: options.payload,
    };

    console.log("--------Publishing JobType ", options.type, "-----");
    channel.publish(
        "app.exchange",
        options.type, // routing key
        Buffer.from(JSON.stringify(message)),
        {
            persistent: true,
            contentType: "application/json",
            mandatory: true,
        }
    );

    // Wait for broker confirmation
    await channel.waitForConfirms();

    return true;
}

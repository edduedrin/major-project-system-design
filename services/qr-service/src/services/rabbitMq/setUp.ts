import { getPublishChannel } from "./connection";

export async function setupInfrastructure() {
    const channel = getPublishChannel();

    // 1️⃣ MAIN EXCHANGE
    await channel.assertExchange("app.exchange", "direct", {
        durable: true,
    });

    // 2️⃣ SHARED DEAD LETTER EXCHANGE
    await channel.assertExchange("app.dlx", "direct", {
        durable: true,
    });

    const jobTypes = ["notification", "notification.user", "qr", "qr_pdf"];

    for (const type of jobTypes) {
        // 3️⃣ MAIN QUEUE
        await channel.assertQueue(`${type}.queue`, {
            durable: true,
            arguments: {
                "x-dead-letter-exchange": "app.dlx",
            },
        });

        // 4️⃣ DEAD LETTER QUEUE
        await channel.assertQueue(`${type}.dlq`, {
            durable: true,
        });

        // 5️⃣ BIND MAIN QUEUE
        await channel.bindQueue(
            `${type}.queue`,
            "app.exchange",
            type
        );

        // 6️⃣ BIND DLQ
        await channel.bindQueue(
            `${type}.dlq`,
            "app.dlx",
            type
        );
    }
}

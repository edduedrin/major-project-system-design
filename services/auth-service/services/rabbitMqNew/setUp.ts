import { getPublishChannel } from "./connection";

export async function setupInfrastructure() {
    const channel = getPublishChannel();

    // ===============================
    // 1️⃣ MAIN EXCHANGE
    // ===============================
    await channel.assertExchange("app.exchange", "direct", {
        durable: true,
    });
    // ✅ Handles: Broker restart
    // Durable exchange survives restart.
    // Prevents routing failure after crash.

    // ===============================
    // 2️⃣ SHARED DEAD LETTER EXCHANGE
    // ===============================
    await channel.assertExchange("app.dlx", "direct", {
        durable: true,
    });
    // ✅ Handles: Failed message routing
    // Central DLX ensures rejected messages are not lost.

    const jobTypes = ["notification", "notification.user", "qr", "qr_pdf"];

    for (const type of jobTypes) {
        // ===============================
        // 3️⃣ MAIN QUEUE
        // ===============================
        await channel.assertQueue(`${type}.queue`, {
            durable: true,
            arguments: {
                "x-dead-letter-exchange": "app.dlx",
            },
        });
        // ✅ Handles: Broker restart
        // Queue survives restart.
        // If consumer rejects message, it moves to DLX.
        // Prevents poison message blocking main queue forever.

        // ===============================
        // 4️⃣ DEAD LETTER QUEUE
        // ===============================
        await channel.assertQueue(`${type}.dlq`, {
            durable: true,
        });
        // ✅ Handles: Permanent failures
        // Failed messages stored for debugging.
        // Prevents silent data loss.

        // ===============================
        // 5️⃣ BIND MAIN QUEUE
        // ===============================
        await channel.bindQueue(
            `${type}.queue`,
            "app.exchange",
            type
        );
        // ✅ Handles: Proper routing
        // Ensures only matching routing keys reach this queue.

        // ===============================
        // 6️⃣ BIND DLQ
        // ===============================
        await channel.bindQueue(
            `${type}.dlq`,
            "app.dlx",
            type
        );
        // ✅ Handles: Failed message isolation per job type
    }
}
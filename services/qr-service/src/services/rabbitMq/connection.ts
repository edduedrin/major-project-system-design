import amqp, {
    ChannelModel,
    ConfirmChannel,
    Channel
} from "amqplib";

let connection: ChannelModel | null = null;
let publishChannel: ConfirmChannel | null = null;

let isConnecting = false;
const RECONNECT_DELAY = 5000;

// Store consumer bootstrap function
let consumerStarter: (() => Promise<void>) | null = null;

export function registerConsumers(starter: () => Promise<void>) {
    consumerStarter = starter;
}

// ===============================
// CONNECT
// ===============================
export async function connectRabbit(): Promise<void> {
    if (isConnecting) return;
    isConnecting = true;

    try {
        console.log("🔄 Connecting to RabbitMQ...");

        const rabbitUrl = process.env.RABBIT_URL || "amqp://localhost:5672";
        const conn = await amqp.connect(
            rabbitUrl,
            { heartbeat: 30 }
        );

        connection = conn;

        console.log("✅ RabbitMQ connected");

        connection.on("close", () => {
            console.error("❌ RabbitMQ connection closed");
            reset();
            reconnect();
        });

        connection.on("error", (err) => {
            console.error("⚠️ RabbitMQ connection error:", err.message);
        });

        publishChannel = await connection.createConfirmChannel();

        console.log("✅ Publish channel created");

        // Restart all consumers automatically
        if (consumerStarter) {
            console.log("🔁 Restarting all consumers...");
            await consumerStarter();
        }

    } catch (err: any) {
        console.error(
            "❌ RabbitMQ connection failed:",
            err.message
        );
        reconnect();
    } finally {
        isConnecting = false;
    }
}

// ===============================
// RECONNECT
// ===============================
function reconnect() {
    console.log(`🔁 Reconnecting in ${RECONNECT_DELAY / 1000}s...`);
    setTimeout(connectRabbit, RECONNECT_DELAY);
}

// ===============================
// RESET
// ===============================
function reset() {
    connection = null;
    publishChannel = null;
}

// ===============================
// PUBLISH CHANNEL
// ===============================
export function getPublishChannel(): ConfirmChannel {
    if (!publishChannel) {
        throw new Error("Publish channel not initialized");
    }
    return publishChannel;
}

// ===============================
// CONSUMER CHANNEL
// ===============================
export async function createConsumerChannel(): Promise<Channel> {
    if (!connection) {
        throw new Error("Connection not initialized");
    }
    return connection.createChannel();
}

export async function waitForRabbit(): Promise<void> {
    while (!publishChannel) {
        console.log("⏳ Waiting for RabbitMQ...");
        await new Promise(res => setTimeout(res, 1000));
    }
}

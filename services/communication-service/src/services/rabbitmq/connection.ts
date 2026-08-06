import amqp, { ChannelModel, ConfirmChannel, Channel } from "amqplib";
import { config } from "../../config";
import logger from "../../utils/logger";

let connection: ChannelModel | null = null;
let publishChannel: ConfirmChannel | null = null;

let isConnecting = false;
const RECONNECT_DELAY = 5000;

let consumerStarter: (() => Promise<void>) | null = null;

export function registerConsumers(starter: () => Promise<void>) {
  consumerStarter = starter;
}

export async function connectRabbit(): Promise<void> {
  if (isConnecting) return;
  isConnecting = true;

  try {
    logger.info("🔄 Connecting to RabbitMQ...");

    const rabbitUrl = config.rabbit.url;
    const conn = await amqp.connect(rabbitUrl, { heartbeat: 30 });
    connection = conn;

    logger.info("✅ RabbitMQ connected");

    connection.on("close", () => {
      logger.error("❌ RabbitMQ connection closed");
      reset();
      reconnect();
    });

    connection.on("error", (err) => {
      logger.error("⚠️ RabbitMQ connection error: " + err.message);
    });

    publishChannel = await connection.createConfirmChannel();
    logger.info("✅ Publish channel created");

    await setupTopology(publishChannel);

    if (consumerStarter) {
      logger.info("🔁 Registering RabbitMQ consumers...");
      await consumerStarter();
    }
  } catch (err: any) {
    logger.error("❌ RabbitMQ connection failed: " + err.message);
    reconnect();
  } finally {
    isConnecting = false;
  }
}

async function setupTopology(channel: Channel): Promise<void> {
  const exchange = config.rabbit.exchange;
  await channel.assertExchange(exchange, "topic", { durable: true });

  const queues = config.rabbit.queues;

  // Assert all queues with x-max-priority 10
  const queueOptions = {
    durable: true,
    arguments: {
      "x-max-priority": 10,
    },
  };

  await channel.assertQueue(queues.push, queueOptions);
  await channel.assertQueue(queues.email, queueOptions);
  await channel.assertQueue(queues.retry, queueOptions);
  await channel.assertQueue(queues.deadletter, queueOptions);
  await channel.assertQueue(queues.sms, queueOptions);
  await channel.assertQueue(queues.whatsapp, queueOptions);
  await channel.assertQueue(queues.inapp, queueOptions);

  // Bind queues to exchange with routing keys
  await channel.bindQueue(queues.push, exchange, "notification.push.#");
  await channel.bindQueue(queues.push, exchange, "push.#");
  await channel.bindQueue(queues.email, exchange, "notification.email.#");
  await channel.bindQueue(queues.email, exchange, "email.#");
  await channel.bindQueue(queues.retry, exchange, "notification.retry.#");
  await channel.bindQueue(queues.deadletter, exchange, "notification.deadletter.#");

  logger.info("✅ RabbitMQ exchange and queues topology asserted");
}

function reconnect() {
  logger.info(`🔁 Reconnecting in ${RECONNECT_DELAY / 1000}s...`);
  setTimeout(connectRabbit, RECONNECT_DELAY);
}

function reset() {
  connection = null;
  publishChannel = null;
}

export function getPublishChannel(): ConfirmChannel {
  if (!publishChannel) {
    throw new Error("RabbitMQ publish channel not initialized");
  }
  return publishChannel;
}

export async function createConsumerChannel(): Promise<Channel> {
  if (!connection) {
    throw new Error("RabbitMQ connection not initialized");
  }
  return connection.createChannel();
}

export async function waitForRabbit(): Promise<void> {
  while (!publishChannel) {
    logger.info("⏳ Waiting for RabbitMQ...");
    await new Promise((res) => setTimeout(res, 1000));
  }
}

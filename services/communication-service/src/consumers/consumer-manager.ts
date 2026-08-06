import { registerConsumers } from "../services/rabbitmq/connection";
import { PushNotificationConsumer } from "./push.consumer";
import { EmailNotificationConsumer } from "./email.consumer";
import { RetryNotificationConsumer } from "./retry.consumer";
import logger from "../utils/logger";

export function initializeConsumers(): void {
  registerConsumers(async () => {
    logger.info("🚀 Initializing RabbitMQ Consumer Workers...");

    const pushConsumer = new PushNotificationConsumer();
    await pushConsumer.start();

    const emailConsumer = new EmailNotificationConsumer();
    await emailConsumer.start();

    const retryConsumer = new RetryNotificationConsumer();
    await retryConsumer.start();

    logger.info("✅ All RabbitMQ Consumer Workers initialized successfully");
  });
}

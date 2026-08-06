import { Channel, ConsumeMessage } from "amqplib";
import { createConsumerChannel } from "../services/rabbitmq/connection";
import { config } from "../config";
import { QueueLogRepository } from "../repositories/queue-log.repository";
import { RabbitMQPublisher } from "../publishers/rabbitmq-publisher";
import logger from "../utils/logger";

export class RetryNotificationConsumer {
  private channel: Channel | null = null;
  private queueLogRepo: QueueLogRepository;
  private publisher: RabbitMQPublisher;

  constructor() {
    this.queueLogRepo = new QueueLogRepository();
    this.publisher = RabbitMQPublisher.getInstance();
  }

  public async start(): Promise<void> {
    try {
      this.channel = await createConsumerChannel();
      const queueName = config.rabbit.queues.retry;

      await this.channel.prefetch(5);
      logger.info(`🎧 Retry Consumer listening on queue: ${queueName}`);

      this.channel.consume(
        queueName,
        async (msg: ConsumeMessage | null) => {
          if (!msg) return;
          await this.handleMessage(msg);
        },
        { noAck: false }
      );
    } catch (error: any) {
      logger.error("Failed to start Retry Consumer", { error: error.message });
    }
  }

  private async handleMessage(msg: ConsumeMessage): Promise<void> {
    try {
      const contentStr = msg.content.toString();
      const event = JSON.parse(contentStr);

      const maxRetry = config.retry.maxCount;
      const retryCount = event.retryCount || 1;
      const targetQueue = event.targetQueue;

      if (!targetQueue) {
        logger.error("Target queue not specified in retry event. Moving to deadletter queue.", { event });
        await this.publisher.publishToQueue(config.rabbit.queues.deadletter, event, event.priority);
        this.channel?.ack(msg);
        return;
      }

      if (retryCount > maxRetry) {
        logger.warn(`Event ${event.eventId} exceeded max retries (${retryCount}/${maxRetry}). Moving to Dead Letter Queue.`);

        // Log dead letter status
        await this.queueLogRepo.create({
          eventId: event.eventId,
          queueName: config.rabbit.queues.deadletter,
          exchangeName: config.rabbit.exchange,
          routingKey: msg.fields.routingKey,
          notificationType: event.notificationType,
          payload: event,
          status: "DeadLetter",
          retryCount,
          errorMessage: `Exceeded max retry count (${maxRetry}). Last error: ${event.lastError || "Unknown"}`,
        });

        await this.publisher.publishToQueue(
          config.rabbit.queues.deadletter,
          event,
          event.priority
        );
      } else {
        logger.info(`Scheduling retry attempt ${retryCount}/${maxRetry} for event ${event.eventId} in ${config.retry.delayMs}ms...`);

        // Wait retry delay before re-publishing to target queue
        await new Promise((resolve) => setTimeout(resolve, config.retry.delayMs));

        await this.publisher.publishToQueue(
          targetQueue,
          event,
          event.priority
        );
      }

      this.channel?.ack(msg);
    } catch (error: any) {
      logger.error("Error processing retry message", { error: error.message });
      this.channel?.nack(msg, false, false);
    }
  }
}

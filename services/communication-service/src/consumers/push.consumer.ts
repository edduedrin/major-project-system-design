import { Channel, ConsumeMessage } from "amqplib";
import { createConsumerChannel } from "../services/rabbitmq/connection";
import { config } from "../config";
import { PushNotificationService } from "../services/push-notification.service";
import { QueueLogRepository } from "../repositories/queue-log.repository";
import { RabbitMQPublisher } from "../publishers/rabbitmq-publisher";
import { CommunicationEventPayload, PushPayload } from "../types";
import logger from "../utils/logger";

export class PushNotificationConsumer {
  private channel: Channel | null = null;
  private pushService: PushNotificationService;
  private queueLogRepo: QueueLogRepository;
  private publisher: RabbitMQPublisher;

  constructor() {
    this.pushService = new PushNotificationService();
    this.queueLogRepo = new QueueLogRepository();
    this.publisher = RabbitMQPublisher.getInstance();
  }

  public async start(): Promise<void> {
    try {
      this.channel = await createConsumerChannel();
      const queueName = config.rabbit.queues.push;

      await this.channel.prefetch(10);
      logger.info(`🎧 Push Notification Consumer listening on queue: ${queueName}`);

      this.channel.consume(
        queueName,
        async (msg: ConsumeMessage | null) => {
          if (!msg) return;
          await this.handleMessage(msg);
        },
        { noAck: false }
      );
    } catch (error: any) {
      logger.error("Failed to start Push Notification Consumer", { error: error.message });
    }
  }

  private async handleMessage(msg: ConsumeMessage): Promise<void> {
    const startTime = Date.now();
    let queueLogId: string | null = null;
    let event: CommunicationEventPayload<PushPayload> | null = null;

    try {
      const contentStr = msg.content.toString();
      event = JSON.parse(contentStr) as CommunicationEventPayload<PushPayload>;

      // Idempotency check: If eventId processed successfully already, ack and skip
      if (event.eventId) {
        const existingLogs = await this.queueLogRepo.findByEventId(event.eventId);
        const alreadySent = existingLogs.find((l: any) => l.status === "Sent");
        if (alreadySent) {
          logger.info(`EventId ${event.eventId} already processed successfully. Skipping duplicate execution.`);
          this.channel?.ack(msg);
          return;
        }
      }

      // Create initial queue log entry
      const logEntry = await this.queueLogRepo.create({
        eventId: event.eventId || `generated-${Date.now()}`,
        queueName: config.rabbit.queues.push,
        exchangeName: config.rabbit.exchange,
        routingKey: msg.fields.routingKey,
        notificationType: "PUSH",
        payload: event as any,
        status: "Processing",
        retryCount: event.retryCount || 0,
        startedAt: new Date(startTime),
      });
      queueLogId = logEntry.id;

      // Process Push Notification
      await this.pushService.processPushEvent(event);

      const endTime = Date.now();
      if (queueLogId) {
        await this.queueLogRepo.updateStatus(queueLogId, {
          status: "Sent",
          completedAt: new Date(endTime),
          processingTime: endTime - startTime,
        });
      }

      this.channel?.ack(msg);
      logger.info(`Successfully processed PUSH event for eventId: ${event.eventId}`);
    } catch (error: any) {
      const endTime = Date.now();
      logger.error(`Error processing PUSH notification for eventId ${event?.eventId}: ${error.message}`);

      if (queueLogId) {
        await this.queueLogRepo.updateStatus(queueLogId, {
          status: "Failed",
          errorMessage: error.message,
          completedAt: new Date(endTime),
          processingTime: endTime - startTime,
        });
      }

      // Re-publish to retry queue
      if (event) {
        const currentRetryCount = (event.retryCount || 0) + 1;
        const retryEvent = {
          ...event,
          retryCount: currentRetryCount,
          targetQueue: config.rabbit.queues.push,
          lastError: error.message,
        };

        await this.publisher.publishToQueue(
          config.rabbit.queues.retry,
          retryEvent,
          event.priority
        );
      }

      this.channel?.ack(msg);
    }
  }
}

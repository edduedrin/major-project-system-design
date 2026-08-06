import { getPublishChannel } from "../services/rabbitmq/connection";
import { config } from "../config";
import { EventPriority } from "../types";
import logger from "../utils/logger";

export class RabbitMQPublisher {
  private static instance: RabbitMQPublisher | null = null;

  public static getInstance(): RabbitMQPublisher {
    if (!RabbitMQPublisher.instance) {
      RabbitMQPublisher.instance = new RabbitMQPublisher();
    }
    return RabbitMQPublisher.instance;
  }

  private getPriorityNumber(priority?: EventPriority): number {
    switch (priority) {
      case "CRITICAL":
        return 10;
      case "HIGH":
        return 7;
      case "MEDIUM":
        return 4;
      case "LOW":
      default:
        return 1;
    }
  }

  public async publishToQueue(queueName: string, data: any, priority?: EventPriority): Promise<boolean> {
    try {
      const channel = getPublishChannel();
      const priorityNum = this.getPriorityNumber(priority);
      const content = Buffer.from(JSON.stringify(data));

      return new Promise((resolve, reject) => {
        channel.sendToQueue(
          queueName,
          content,
          {
            persistent: true,
            priority: priorityNum,
          },
          (err) => {
            if (err) {
              logger.error(`Failed to publish message to queue ${queueName}`, { error: err.message });
              return resolve(false);
            }
            logger.info(`Message published to queue ${queueName} with priority ${priorityNum}`);
            resolve(true);
          }
        );
      });
    } catch (error: any) {
      logger.error(`Error in publishToQueue for ${queueName}`, { error: error.message });
      return false;
    }
  }

  public async publishToExchange(routingKey: string, data: any, priority?: EventPriority): Promise<boolean> {
    try {
      const channel = getPublishChannel();
      const priorityNum = this.getPriorityNumber(priority);
      const content = Buffer.from(JSON.stringify(data));
      const exchange = config.rabbit.exchange;

      return new Promise((resolve, reject) => {
        channel.publish(
          exchange,
          routingKey,
          content,
          {
            persistent: true,
            priority: priorityNum,
          },
          (err) => {
            if (err) {
              logger.error(`Failed to publish message to exchange ${exchange} (${routingKey})`, { error: err.message });
              return resolve(false);
            }
            logger.info(`Message published to exchange ${exchange} with key ${routingKey}`);
            resolve(true);
          }
        );
      });
    } catch (error: any) {
      logger.error(`Error in publishToExchange for key ${routingKey}`, { error: error.message });
      return false;
    }
  }
}

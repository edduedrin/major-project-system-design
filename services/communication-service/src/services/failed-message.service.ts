import { QueueLogRepository } from "../repositories/queue-log.repository";
import { RabbitMQPublisher } from "../publishers/rabbitmq-publisher";
import { CustomError } from "../types";

export class FailedMessageService {
  private queueLogRepo: QueueLogRepository;

  constructor() {
    this.queueLogRepo = new QueueLogRepository();
  }

  public async getFailedMessages(limit = 50, offset = 0) {
    const deadLetterLogs = await this.queueLogRepo.findLogs({
      status: "DeadLetter",
      limit,
      offset,
    });
    const failedLogs = await this.queueLogRepo.findLogs({
      status: "Failed",
      limit,
      offset,
    });
    return [...deadLetterLogs, ...failedLogs];
  }

  public async retryFailedMessage(id: string) {
    const log = await this.queueLogRepo.findById(id);
    if (!log) {
      throw new CustomError({
        statusCode: 404,
        responseCode: 404,
        responseMessage: "Failed message log not found",
      });
    }

    if (!log.payload || !log.queueName) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: "Log entry missing payload or queue information for retry",
      });
    }

    // Reset log status to Retrying and increment retry count
    const updatedLog = await this.queueLogRepo.updateStatus(id, {
      status: "Retrying",
      retryCount: (log.retryCount || 0) + 1,
      errorMessage: undefined,
    });

    const payloadObj = log.payload as any;
    payloadObj.retryCount = (log.retryCount || 0) + 1;
    payloadObj.queueLogId = log.id;

    // Publish to the appropriate queue
    const targetQueue = log.queueName;
    const publisher = RabbitMQPublisher.getInstance();
    await publisher.publishToQueue(targetQueue, payloadObj, payloadObj.priority);

    return updatedLog;
  }

  public async deleteFailedMessage(id: string) {
    const deleted = await this.queueLogRepo.delete(id);
    if (!deleted) {
      throw new CustomError({
        statusCode: 404,
        responseCode: 404,
        responseMessage: "Failed message log not found",
      });
    }
    return deleted;
  }
}

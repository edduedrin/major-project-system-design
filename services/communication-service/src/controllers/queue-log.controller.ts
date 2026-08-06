import { Request, Response, NextFunction } from "express";
import { QueueLogRepository } from "../repositories/queue-log.repository";

class QueueLogController {
  private queueLogRepo: QueueLogRepository;

  constructor() {
    this.queueLogRepo = new QueueLogRepository();
  }

  public getQueueLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, queueName, eventId, startDate, endDate, page, limit } = req.query;

      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 50;
      const offset = (pageNum - 1) * limitNum;

      const logs = await this.queueLogRepo.findLogs({
        status: status as string,
        queueName: queueName as string,
        eventId: eventId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: limitNum,
        offset,
      });

      res.status(200).json({
        responseCode: 200,
        responseMessage: "Queue logs retrieved successfully",
        data: logs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          count: logs.length,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new QueueLogController();

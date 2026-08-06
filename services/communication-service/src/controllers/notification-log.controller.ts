import { Request, Response, NextFunction } from "express";
import { NotificationLogRepository } from "../repositories/notification-log.repository";
import { NotificationType } from "../types";

class NotificationLogController {
  private notificationLogRepo: NotificationLogRepository;

  constructor() {
    this.notificationLogRepo = new NotificationLogRepository();
  }

  public getNotificationLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, notificationType, status, startDate, endDate, page, limit } = req.query;

      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 50;
      const offset = (pageNum - 1) * limitNum;

      const logs = await this.notificationLogRepo.findLogs({
        recipientId: userId as string,
        notificationType: notificationType as NotificationType,
        status: status as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: limitNum,
        offset,
      });

      res.status(200).json({
        responseCode: 200,
        responseMessage: "Notification logs retrieved successfully",
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

export default new NotificationLogController();

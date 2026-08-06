import { Request, Response, NextFunction } from "express";
import { FailedMessageService } from "../services/failed-message.service";

class FailedMessageController {
  private failedMessageService: FailedMessageService;

  constructor() {
    this.failedMessageService = new FailedMessageService();
  }

  public getFailedMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = req.query;
      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 50;
      const offset = (pageNum - 1) * limitNum;

      const failedMessages = await this.failedMessageService.getFailedMessages(limitNum, offset);

      res.status(200).json({
        responseCode: 200,
        responseMessage: "Failed messages retrieved successfully",
        data: failedMessages,
      });
    } catch (error) {
      next(error);
    }
  };

  public retryFailedMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const retried = await this.failedMessageService.retryFailedMessage(id);

      res.status(200).json({
        responseCode: 200,
        responseMessage: "Failed message re-queued for retry successfully",
        data: retried,
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteFailedMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.failedMessageService.deleteFailedMessage(id);

      res.status(200).json({
        responseCode: 200,
        responseMessage: "Failed message deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new FailedMessageController();

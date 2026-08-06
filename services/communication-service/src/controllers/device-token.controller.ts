import { Request, Response, NextFunction } from "express";
import { DeviceTokenRepository } from "../repositories/device-token.repository";
import { ValidationUtils } from "../utils/validation";
import { CustomError } from "../types";

class DeviceTokenController {
  private deviceTokenRepo: DeviceTokenRepository;

  constructor() {
    this.deviceTokenRepo = new DeviceTokenRepository();
  }

  public registerToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, deviceToken, platform, appVersion } = req.body;
      ValidationUtils.validateRequired(req.body, ["userId", "deviceToken", "platform"]);

      const tokenObj = await this.deviceTokenRepo.upsertToken({
        userId,
        deviceToken,
        platform,
        appVersion,
      });

      res.status(200).json({
        responseCode: 200,
        responseMessage: "Device token registered successfully",
        data: tokenObj,
      });
    } catch (error) {
      next(error);
    }
  };

  public deactivateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { deviceToken } = req.body;
      ValidationUtils.validateRequired(req.body, ["deviceToken"]);

      const deactivated = await this.deviceTokenRepo.deactivateToken(deviceToken);
      if (!deactivated) {
        throw new CustomError({
          statusCode: 404,
          responseCode: 404,
          responseMessage: "Device token not found",
        });
      }

      res.status(200).json({
        responseCode: 200,
        responseMessage: "Device token deactivated successfully",
        data: deactivated,
      });
    } catch (error) {
      next(error);
    }
  };

  public getTokens = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req.query.userId as string) || req.user?.id;
      if (!userId) {
        throw new CustomError({
          statusCode: 400,
          responseCode: 400,
          responseMessage: "userId query parameter is required",
        });
      }

      const tokens = await this.deviceTokenRepo.findActiveTokensByUserId(userId);

      res.status(200).json({
        responseCode: 200,
        responseMessage: "User device tokens retrieved successfully",
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new DeviceTokenController();

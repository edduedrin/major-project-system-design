import { Request, Response, NextFunction } from "express";
import authService from "../service/auth-service";

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async signIn(req: Request, res: Response, next: NextFunction) {
    try {
      const deviceId = req.headers["x-client-uuid"] as string;
      const deviceType = req.headers["user-agent"] as string;
      const { email, mobile, password, fcmToken } = req.body;

      const result = await authService.signIn({
        email,
        mobile,
        password,
        metaData: {
          deviceId,
          deviceType,
          fcmToken,
          ipAddress: req.metaData?.ip,
        },
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async sendOtpForSignIn(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.sendOtpForSignIn(req.body);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyOtpForSignIn(req: Request, res: Response, next: NextFunction) {
    try {
      const deviceId = req.headers["x-client-uuid"] as string;
      const deviceType = req.headers["user-agent"] as string;
      const { email, mobile, otp, fcmToken } = req.body;

      const result = await authService.verifyOtpForSignIn({
        email,
        mobile,
        otp,
        metaData: {
          deviceId,
          deviceType,
          fcmToken,
          ipAddress: req.metaData?.ip,
        },
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.forgotPassword(req.body);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async sendOtpForPasswordReset(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.sendOtpForPasswordReset(req.body);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyOtpForPasswordReset(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.verifyOtpForPasswordReset(req.body);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.resetPassword(req.body);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}
export default new AuthController();

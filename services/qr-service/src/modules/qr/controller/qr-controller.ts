import { Request, Response, NextFunction } from "express";
import qrService from "../service/qr-service";

export class QrController {
  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await qrService.generateCodes(req.body);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCodes(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId, status, page, limit } = req.query;
      const filters = {
        productId: productId as string,
        status: status as string,
      };
      const activePage = page ? parseInt(page as string, 10) : 1;
      const activeLimit = limit ? parseInt(limit as string, 10) : 10;

      const result = await qrService.getCodes(filters, activePage, activeLimit);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async validate(req: Request, res: Response, next: NextFunction) {
    try {
      const { serialNumber } = req.params;
      const result = await qrService.validateCode(serialNumber as string);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async scan(req: Request, res: Response, next: NextFunction) {
    try {
      const { qrContent, scanMethod } = req.body;
      const ipAddress = req.metaData?.ip || req.ip || "0.0.0.0";
      const userAgent = req.headers["user-agent"] as string || "";
      const latitude = req.metaData?.latitude || (req.headers["latitude"] as string) || "";
      const longitude = req.metaData?.longitude || (req.headers["longitude"] as string) || "";

      const result = await qrService.scanCode({
        qrContent,
        scanMethod,
        metaData: {
          ipAddress,
          userAgent,
          latitude,
          longitude,
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

  async getQrImage(req: Request, res: Response, next: NextFunction) {
    try {
      const { serialNumber } = req.params;
      const buffer = await qrService.getQrCodeImage(serialNumber as string);
      res.setHeader("Content-Type", "image/png");
      res.status(200).send(buffer);
    } catch (error) {
      next(error);
    }
  }
}

export default new QrController();

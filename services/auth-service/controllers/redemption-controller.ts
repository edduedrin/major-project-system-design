import { NextFunction, Request, Response } from "express";
import { customValidators } from "../utils/custom-validators";
import { redemptionRepository } from "../repositories/redemption-repository";
import { razorpayService } from "../services";
import { WebhookPayload } from "../types/razorpay";
import { BUS_EVENTS } from "../utils/constant";
import { CustomError } from "../types/custom-error";
import { RAZORPAY_KEY_SECRET } from "../configs/config";
import { redemptionStatusEnum } from "../schemas/redemption-model";
import { NotificationMiddleware } from "../middlewares/notification-middleware";

class RedemptionController {
  customError: CustomError;
  constructor() {
    this.customError = new CustomError({
      responseCode: 400,
      responseMessage: "",
    });
  }

  redeemPoints = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = customValidators.redemptionValidators(req.body);
      const insertedData = await redemptionRepository.insertRedemption(
        req.userDetails,
        payload
      );
      
      if (insertedData?.points && req?.userDetails?.userId) {
          NotificationMiddleware.notifySuccessfulRedemption(req.userDetails.userId, Number(insertedData.points)).catch(err => console.error("Notification Error:", err));
      }

      const data = {
        points: insertedData.points,
        transactionRef: insertedData.redemptionRef,
        status: "Pending",
      };
      return res.json({
        message: "Redemption request raised successfully",
        code: 200,
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  // bulkRedeemPoints = async (req: Request, res: Response, next: NextFunction) => {
  //   try {
  //     console.log(req.body)
  //     const payload = customValidators.redemptionValidators(req.body);
  //     console.log('----',payload,'------')
  //     const insertedData = await redemptionRepository.insertBulkRedemption(
  //       "ZFP0100002",
  //       payload
  //     );
  //     const data = {
  //       points: insertedData.points,
  //       transactionRef: insertedData.redemptionRef,
  //       status: "Pending",
  //     };
  //     return res.json({
  //       message: "Redemption request raied successfully",
  //       code: 200,
  //       data,
  //     });
  //   } catch (error) {
  //     next(error);
  //   }
  // };

  bulkRedeemPoints = async (req: Request, res: Response, next: NextFunction) => {
    try {

      // Validate the request body
      const payload = customValidators.bulkRedemptionValidators(req.body);

      /**
       * Expected payload format:
       * {
       *    items: [
       *      { userCode: "USR001", payload: { type: "upi", value: 100 } },
       *      { userCode: "USR002", payload: { type: "bank-transfer", value: 200 } }
       *    ]
       * }
       */

      // if (!payload?.items || !Array.isArray(payload.items) || payload.items.length === 0) {
      //   throw new CustomError({
      //     responseCode: 400,
      //     responseMessage: "Invalid payload: items[] required",
      //   });
      // }

      // Call the BULK repository method
      const result = await redemptionRepository.insertBulkRedemptionForMultipleUsers(
        payload.items
      );

      return res.json({
        message: "Bulk redemption processed",
        code: 200,
        data: result,
      });

    } catch (error) {
      next(error);
    }
  };

  redemptionHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const payload = customValidators.redemptionHistoryValidator(req.body);
      const data = await redemptionRepository.redemptionHistory(
        req.userDetails,
        payload
      );
      return res.json({
        message: "Redemption History fetched successfully",
        code: 200,
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  processRedemption = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const payload = customValidators.processRedemptionValidators(req.body?.payload);
      const processedData = await redemptionRepository.processRedemption(
        payload,
        req.files as Express.Multer.File[],
        req.userDetails
      );

      // Trigger payouts for approved redemptions in background
      if (processedData?.success && Array.isArray(processedData?.success)) {
        for (const item of processedData?.success) {
          const successItem = item;
          if (
            successItem?.status === "Success" &&
            successItem?.data &&
            successItem?.redemptionRef &&
            payload?.find(p =>
              p?.redemptionRef === successItem?.redemptionRef &&
              p?.status === "Approve"
            )) {
            razorpayService.redemptionPayout(successItem?.data).catch(err => {
              console.error(`Payout error for ${successItem?.redemptionRef}:`, err);
            });
          }
        }
      }

      return res.json({
        message: "success",
        code: 200,
        data: processedData || []
      });
    } catch (error) {
      next(error);
    }
  };

  handleWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = req.body as WebhookPayload;
      const event = payload.event;
      const signature = req.headers['x-razorpay-signature'] as string;

      console.log(signature, RAZORPAY_KEY_SECRET, signature == RAZORPAY_KEY_SECRET)

      if (!signature) {
        console.warn('\n[Webhook] Missing X-Razorpay-Signature header\n');
        this.customError.responseMessage = "Missing signature";
        this.customError.responseCode = 401;
        this.customError.statusCode = 401;
        throw this.customError;
      }

      if (event.startsWith('payout.')) {
        await this.handlePayoutWebhook(req, res, event);
        return res.json({ success: true, message: 'Payout webhook handled' });
      }

      if (event === 'transaction.created') {
        const responseObj = { success: true, message: 'Transaction logged' }
        await razorpayService.logWebhook(req, responseObj);
        return res.json(responseObj);
      }

      return res.json({ success: true, message: 'Event acknowledged' });
    } catch (error) {
      next(error);
    }
  };

  private handlePayoutWebhook = async (req: Request, res: Response, eventType: string) => {
    const payload: WebhookPayload = req?.body;
    const signature = req?.headers['x-razorpay-signature'] as string;

    const payloadString = JSON.stringify(payload);
    const isValid = razorpayService.verifyWebhookSignature(payloadString, signature);

    if (!isValid) {
      razorpayService.logWebhook(req, this.customError);
      this.customError.responseCode = 401;
      this.customError.statusCode = 401;
      this.customError.responseMessage = "Invalid signature";
      throw this.customError;
    }

    const payoutEntity = payload?.payload?.payout?.entity;

    if (!payoutEntity) {
      this.customError.responseCode = 400;
      this.customError.statusCode = 400;
      this.customError.responseMessage = "Missing payout entity";
      throw this.customError;
    }

    let redemption = await redemptionRepository.getRedemption({
      redemptionRef: payoutEntity?.reference_id
    });

    if (!redemption) {
      redemption = await redemptionRepository.findRedemptionByPayoutId(payoutEntity.id);
    }

    if (!redemption) {
      this.customError.responseMessage = "Redemption not found";
      this.customError.responseCode = 404;
      this.customError.statusCode = 404;
      throw this.customError;
    }

    if (await redemptionRepository.isWebhookProcessed(payoutEntity?.id, eventType)) {
      this.customError.responseMessage = "Already processed";
      this.customError.responseCode = 400;
      this.customError.statusCode = 400;
      throw this.customError;
    }

    let statusToSet: typeof redemptionStatusEnum.enumValues[number] = "Processing"
    let shouldRefund = false;
    let eventMessage: string | null = null;

    switch (eventType) {
      case 'payout.initiated':
        statusToSet = 'Processing';
        eventMessage = BUS_EVENTS.REDEMPTION_REQUEST;
        break;

      case 'payout.updated':
        if (payoutEntity.status === 'processed') {
          statusToSet = 'Completed';
          eventMessage = BUS_EVENTS.REDEMPTION_APPROVE;
        } else if (payoutEntity.status === 'processing') {
          statusToSet = 'Processing';
        } else if (payoutEntity.status === 'reversed') {
          statusToSet = 'Failed';
          shouldRefund = true;
          eventMessage = BUS_EVENTS.REDEMPTION_REJECT;
        }
        break;

      case 'payout.processed':
        statusToSet = 'Completed';
        eventMessage = BUS_EVENTS.REDEMPTION_APPROVE;
        break;

      case 'payout.failed':
        statusToSet = 'Failed';
        shouldRefund = true;
        eventMessage = BUS_EVENTS.REDEMPTION_REJECT;
        break;

      case 'payout.reversed':
        statusToSet = 'Failed';
        shouldRefund = true;
        eventMessage = BUS_EVENTS.REDEMPTION_REJECT;
        break;

      case 'payout.rejected':
        statusToSet = 'Rejected';
        shouldRefund = true;
        eventMessage = BUS_EVENTS.REDEMPTION_REJECT;
        break;
    }

    await redemptionRepository.updateRedemptionStatus(redemption?.redemptionRef, statusToSet, payload);

    if (shouldRefund) {
      await redemptionRepository.refundPoints(redemption?.redemptionRef);
    }
  };
}

export const redemptionController = new RedemptionController();

import express, { Router } from "express";
import { voucherController } from "../controllers";
import { authMiddleware } from "../middlewares/auth-middleware";

const router: Router = express.Router();

/**
 * @openapi
 * /voucher/user-details:
 *   get:
 *     summary: Get Verified User Details
 *     description: Fetches verified user details and wallet balance.
 *     tags:
 *       - Voucher
 *     parameters:
 *       - in: header
 *         name: x-api-key
 *         schema:
 *           type: string
 *         required: true
 *         description: API Key for authentication
 *       - in: header
 *         name: x-channel-partner
 *         schema:
 *           type: string
 *         required: true
 *         description: Channel Partner ID
 *       - in: query
 *         name: mobile
 *         schema:
 *           type: string
 *         required: true
 *         description: User Mobile Number
 *     responses:
 *       200:
 *         description: User details fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userId:
 *                   type: string
 *                 name:
 *                   type: string
 *                 mobileNumber:
 *                   type: string
 *                 email:
 *                   type: string
 *                 currentBalance:
 *                   type: decimal
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.get("/user-details", voucherController.getUserDetails);

/**
 * @openapi
 * /voucher/session/gyftr:
 *   get:
 *     summary: Get Voucher Redirect URL
 *     description: Returns the voucher redirect URL with a short-lived token.
 *     tags:
 *       - Voucher
 *     responses:
 *       200:
 *         description: Redirect URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     redirectUrl:
 *                       type: string
 *       401:
 *         description: Unauthorized
 */
router.get("/session/gyftr", voucherController.getRedirectUrl);

/**
 * @openapi
 * /voucher/place-order:
 *   post:
 *     summary: Place Voucher Order
 *     description: Places an order for vouchers.
 *     tags:
 *       - Voucher
 *     parameters:
 *       - in: header
 *         name: x-api-key
 *         schema:
 *           type: string
 *         required: true
 *       - in: header
 *         name: x-channel-partner
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - totalCartValue
 *               - itemDetails
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID (currently unused — derived from Bearer token)
 *               orderId:
 *                 type: string
 *               totalCartValue:
 *                 type: number
 *               itemDetails:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     txnId:
 *                       type: string
 *                     voucherName:
 *                       type: string
 *                     rate:
 *                       type: number
 *                     qty:
 *                       type: number
 *     responses:
 *       200:
 *         description: Order placed successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post("/placeOrder", voucherController.placeOrder);

/**
 * @openapi
 * /voucher/webhooks/gyftr:
 *   post:
 *     summary: Voucher Settlement Callback
 *     description: Callback to mark order as Refund(R) or Completed(C).
 *     tags:
 *       - Voucher
 *     parameters:
 *       - in: header
 *         name: x-api-key
 *         schema:
 *           type: string
 *         required: true
 *       - in: header
 *         name: x-channel-partner
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - orderId
 *               - orderStatus
 *               - itemDetails
 *             properties:
 *               userId:
 *                 type: string
 *               orderId:
 *                 type: string
 *               orderStatus:
 *                 type: string
 *                 description: R for Refund, C for Completed
 *               itemDetails:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     txnId:
 *                       type: string
 *                     voucherName:
 *                       type: string
 *                     rate:
 *                       type: number
 *                     qty:
 *                       type: number
 *                     status:
 *                       type: string
 *                       description: R for Refund, C for Completed
 *     responses:
 *       200:
 *         description: Settlement processed successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *       409:
 *         description: Order conflict
 */
router.post("/webhooks/gyftr", voucherController.settlementCallback);

/**
 * @openapi
 * /voucher/order-status:
 *   post:
 *     summary: Get Order Status
 *     description: Retrieve order status for failed responses.
 *     tags:
 *       - Voucher
 *     parameters:
 *       - in: header
 *         name: x-api-key
 *         schema:
 *           type: string
 *         required: true
 *       - in: header
 *         name: x-channel-partner
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order details fetched successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 */
router.post("/orderStatus", voucherController.getOrderStatus);

export default router;

import express, { Router } from "express";
import { redemptionController } from "../controllers/redemption-controller";
import { authMiddleware } from "../middlewares/auth-middleware";

const router: Router = express.Router();

router.post("/redeem-points", authMiddleware.customerVerifyToken, redemptionController.redeemPoints);
router.post("/bulk-redeem-points", authMiddleware.adminVerifyToken, redemptionController.bulkRedeemPoints);
router.post("/history", authMiddleware.verifyToken, redemptionController.redemptionHistory);
router.patch("/redemptions", authMiddleware.adminVerifyToken, redemptionController.processRedemption);
router.post("/razorpay-webhook", redemptionController.handleWebhook);
export default router;   
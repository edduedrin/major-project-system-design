import express, { Router } from "express";
import { authMiddleware } from "../middlewares/auth-middleware";
import { reportController } from "../controllers";


const router: Router = express.Router();

router.post("/ticket-history", authMiddleware.verifyToken, reportController.ticketHistory);
router.post("/scan-history", authMiddleware.verifyToken, reportController.scanHistory);
router.post("/referral-history", authMiddleware.verifyToken, reportController.referralHistory);
router.post("/application-login", authMiddleware.verifyToken, reportController.applicationLogin);
router.post("/registered-users", authMiddleware.verifyToken, reportController.registeredUsers);
router.post("/qr-transaction", authMiddleware.verifyToken, reportController.qrTransaction);
router.post("/admin-referal-history", authMiddleware.verifyToken, reportController.adminReferalHistory);
router.get("/otp-report", authMiddleware.adminVerifyToken, reportController.otpReport);

router.post("/bank-details-report", authMiddleware.verifyToken, reportController.bankDetailsReport);
router.post("/kyc-report", authMiddleware.verifyToken, reportController.kycReport);
router.post("/product-wise-report", authMiddleware.verifyToken, reportController.productWiseReport);
router.post("/category-report", authMiddleware.verifyToken, reportController.categoryReport);
router.post("/error-transaction-report", authMiddleware.verifyToken, reportController.errorTransactionReport);
router.post("/notification-report", authMiddleware.verifyToken, reportController.notificationReport);
router.post("/blocked-member-report", authMiddleware.verifyToken, reportController.blockedMemberReport);
router.post("/blocked-member-qr-scan-report", authMiddleware.verifyToken, reportController.blockedMemberQrScanReport);
router.post("/anomaly-transactions-report", authMiddleware.verifyToken, reportController.anomalyTransactionsReport);
router.post("/shock-replacement-report", authMiddleware.verifyToken, reportController.shockReplacementReport);

export default router;
import express, { Router } from "express";
import { authMiddleware } from "../middlewares/auth-middleware";
import { masterController } from "../controllers";
import { fileMiddleware } from "../middlewares/file-middleware";

const router: Router = express.Router();

router.get("/tickets", authMiddleware.verifyToken, masterController.getTicketList);
router.get("/points/scanned", authMiddleware.verifyToken, masterController.getScannedPoints);
router.get("/points/redeemed", authMiddleware.verifyToken, masterController.getRedeemedPoints);
router.get("/scans/total", authMiddleware.verifyToken, masterController.getTotalScans);
router.get("/kyc/status", authMiddleware.verifyToken, masterController.getKycDataPoints);
router.get("/users/registered", authMiddleware.verifyToken, masterController.getUsersRegisteredGraphData);
router.get("/points/points-graph", authMiddleware.verifyToken, masterController.getPointsTransactionDataGraph);
router.get("/points/recent-transactions", authMiddleware.verifyToken, masterController.getRecentActivity);
router.get("/users/top-performers", authMiddleware.verifyToken, masterController.getTopPerformers);
router.get("/inventory/total-count", authMiddleware.verifyToken, masterController.getTotalQRCodes);
router.get("/tickets/count/status/:status?", masterController.getTicketCountByStatus);
router.get("/tickets/count/category/:categoryId", authMiddleware.verifyToken, masterController.getTicketCount);
router.get("/tickets/categories", authMiddleware.verifyToken, masterController.getTicketCategories);
router.get("/tickets/statuses", authMiddleware.verifyToken, masterController.getTicketStatuses);

// FAQ Routes
router.get("/faqs", authMiddleware.verifyToken, masterController.getFAQs);
router.post("/faqs", authMiddleware.verifyToken, masterController.createFAQ);
router.delete("/faqs/:id", authMiddleware.verifyToken, masterController.deleteFAQ);

// Asset Management Routes
router.get("/assets", masterController.getAssets);
router.post("/assets", fileMiddleware.acceptSingleFile("file"), masterController.upsertAsset);
router.put("/assets/:id", fileMiddleware.acceptSingleFile("file"), masterController.upsertAsset);
router.delete("/assets/:id", masterController.deleteAsset);

export default router;

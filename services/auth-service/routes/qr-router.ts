import express, { Router } from "express";
import { authMiddleware } from "../middlewares/auth-middleware";
import { qrController, skuMasterController } from "../controllers";

const router: Router = express.Router();

router.post("/qrs", authMiddleware.adminVerifyToken, qrController.enqueueQrGeneration);
router.get("/qrs/file", authMiddleware.adminVerifyToken, qrController.fetchQrFile);

router.get("/qrs/history", authMiddleware.adminVerifyToken, qrController.fetchQrHistory);
router.post("/qrs/publish", authMiddleware.adminVerifyToken, qrController.publishBatchId);

router.post("/product-scan", authMiddleware.customerVerifyToken, qrController.productScan);
router.post("/bulk-product-scan", authMiddleware.adminVerifyToken, qrController.bulkProductScan);
export default router;
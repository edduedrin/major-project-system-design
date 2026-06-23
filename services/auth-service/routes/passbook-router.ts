import express, { Router } from "express";
import { authMiddleware } from "../middlewares/auth-middleware";
import { passbookController } from "../controllers/passbook-controller";
const router: Router = express.Router();

router.post("/passbook-history", authMiddleware.verifyToken, passbookController.getPassbook);
router.post("/download-statement", authMiddleware.verifyToken, passbookController.downloadStatement);
// router.post("/test", authMiddleware.verifyToken, passbookController.test)
export default router;
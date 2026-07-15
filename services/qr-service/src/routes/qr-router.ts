import { Router } from "express";
import qrController from "../modules/qr/controller/qr-controller";
import { authMiddleware } from "../middlewares/auth-middleware";

const qrRouter = Router();

// Test check route
qrRouter.get("/", (req, res) => {
  res.json({ message: "QR service routing working" });
});

// APIs
qrRouter.post("/generate", (req, res, next) => qrController.generate(req, res, next));
qrRouter.post("/qrs", authMiddleware.adminVerifyToken, (req, res, next) => qrController.enqueueQrGeneration(req, res, next));
qrRouter.get("/codes", (req, res, next) => qrController.getCodes(req, res, next));
qrRouter.get("/validate/:serialNumber", (req, res, next) => qrController.validate(req, res, next));
qrRouter.post("/scan", (req, res, next) => qrController.scan(req, res, next));
qrRouter.get("/code/:serialNumber", (req, res, next) => qrController.getQrImage(req, res, next));

export default qrRouter;

import { Router } from "express";
import redemptionController from "../modules/redemption/controller/redemption-controller";
import { authMiddleware } from "../middlewares/auth-middleware";

const redemptionRouter = Router();

// Test check route
redemptionRouter.get("/health-check", (req, res) => {
  res.json({ message: "Redemption service routing working" });
});

// APIs
redemptionRouter.post("/", authMiddleware.adminVerifyToken, (req, res, next) => redemptionController.create(req, res, next));
redemptionRouter.get("/", (req, res, next) => redemptionController.getRedemptions(req, res, next));
redemptionRouter.get("/:id", (req, res, next) => redemptionController.getById(req, res, next));
redemptionRouter.patch("/:id/status", authMiddleware.adminVerifyToken, (req, res, next) => redemptionController.updateStatus(req, res, next));

export default redemptionRouter;

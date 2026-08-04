import { Router } from "express";
import redemptionController from "../modules/redemption/controller/redemption-controller";
import { ValidationMiddleware } from "../middlewares/validation-middleware";

const redemptionRouter = Router();

// Health check endpoint
redemptionRouter.get("/health-check", (req, res) => {
  res.json({ message: "Redemption service routing working" });
});

// Create Redemption Request
redemptionRouter.post(
  "/",
  ValidationMiddleware.validateRedemptionRequest,
  (req, res, next) => redemptionController.create(req, res, next)
);

// Get Redemption Requests List
redemptionRouter.get("/", (req, res, next) => redemptionController.getRedemptions(req, res, next));

// Get Redemption Request by ID
redemptionRouter.get("/:id", (req, res, next) => redemptionController.getById(req, res, next));

// Update Redemption Request Status
redemptionRouter.patch("/:id/status", (req, res, next) => redemptionController.updateStatus(req, res, next));

export default redemptionRouter;

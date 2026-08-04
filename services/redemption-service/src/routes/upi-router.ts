import { Router } from "express";
import upiDetailsController from "../modules/upi-details/controller/upi-details-controller";
import { ValidationMiddleware } from "../middlewares/validation-middleware";

const upiRouter = Router();

// GET /upi
upiRouter.get("/", (req, res, next) => upiDetailsController.getUpiDetails(req, res, next));

// POST /upi
upiRouter.post(
  "/",
  ValidationMiddleware.validateUpiDetails,
  (req, res, next) => upiDetailsController.saveUpiDetails(req, res, next)
);

export default upiRouter;

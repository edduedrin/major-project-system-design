import { Router } from "express";
import bankDetailsController from "../modules/bank-details/controller/bank-details-controller";
import { ValidationMiddleware } from "../middlewares/validation-middleware";

const bankDetailsRouter = Router();

// GET /bank-details
bankDetailsRouter.get("/", (req, res, next) => bankDetailsController.getBankDetails(req, res, next));

// POST /bank-details
bankDetailsRouter.post(
  "/",
  ValidationMiddleware.validateBankDetails,
  (req, res, next) => bankDetailsController.saveBankDetails(req, res, next)
);

export default bankDetailsRouter;

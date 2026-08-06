import { Router } from "express";
import deviceTokenController from "../controllers/device-token.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const deviceTokenRouter = Router();

deviceTokenRouter.post("/", deviceTokenController.registerToken);
deviceTokenRouter.delete("/", deviceTokenController.deactivateToken);
deviceTokenRouter.get("/", authMiddleware, deviceTokenController.getTokens);

export default deviceTokenRouter;

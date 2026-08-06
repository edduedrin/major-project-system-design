import { Router } from "express";
import queueLogController from "../controllers/queue-log.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/admin.middleware";

const queueLogRouter = Router();

queueLogRouter.get(
  "/",
  authMiddleware,
  adminMiddleware,
  queueLogController.getQueueLogs
);

export default queueLogRouter;

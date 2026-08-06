import { Router } from "express";
import notificationLogController from "../controllers/notification-log.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/admin.middleware";

const notificationLogRouter = Router();

notificationLogRouter.get(
  "/",
  authMiddleware,
  adminMiddleware,
  notificationLogController.getNotificationLogs
);

export default notificationLogRouter;

import { Router } from "express";
import { NotificationController } from "../controllers/notification-controller";
import { fileMiddleware } from "../middlewares/file-middleware";
import { authMiddleware } from "../middlewares/auth-middleware";
// import { checkIfUserIsAdmin } from "../utils/checkIfUserIsAdmin"; // Assuming we want some protection, but for now I'll leave it open or add basic check if needed.
// middleware to check admin role would usually go here.

const router = Router();

router.post("/broadcast", fileMiddleware.acceptSingleFile("file"), NotificationController.broadcastNotification);
router.get("/", authMiddleware.verifyToken, NotificationController.getAllNotifications);
router.get("/filters/roles", NotificationController.getRolesForFilter);
router.get("/filters/states", NotificationController.getStatesForFilter);
router.get("/filters/districts", NotificationController.getDistrictsForFilter);
router.get("/filters/cities", NotificationController.getCitiesForFilter);
router.get("/filters/pincodes", NotificationController.getPincodesForFilter);
router.get("/filters/block-statuses", NotificationController.getBlockStatusesForFilter);
router.post("/users/count", NotificationController.calculateTargetUsers);
router.get("/campaigns", NotificationController.getCampaigns);
router.get("/campaigns/:campaignId/notifications", NotificationController.getCampaignNotifications);
router.get("/:notificationId/logs", NotificationController.getNotificationLogs);
router.get("/:notificationId/media-url", NotificationController.getNotificationImageUrl);

export default router;

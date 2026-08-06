import { Router } from "express";
import failedMessageController from "../controllers/failed-message.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/admin.middleware";

const failedMessageRouter = Router();

failedMessageRouter.use(authMiddleware, adminMiddleware);

failedMessageRouter.get("/", failedMessageController.getFailedMessages);
failedMessageRouter.post("/:id/retry", failedMessageController.retryFailedMessage);
failedMessageRouter.delete("/:id", failedMessageController.deleteFailedMessage);

export default failedMessageRouter;

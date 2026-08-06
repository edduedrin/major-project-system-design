import { IRouter } from "../types";
import queueLogRouter from "./queue-log.router";
import notificationLogRouter from "./notification-log.router";
import failedMessageRouter from "./failed-message.router";
import deviceTokenRouter from "./device-token.router";

export const routers: IRouter[] = [
  { path: "/queue-logs", router: queueLogRouter },
  { path: "/notification-logs", router: notificationLogRouter },
  { path: "/failed-messages", router: failedMessageRouter },
  { path: "/device-token", router: deviceTokenRouter },
];

import { IRouter } from "../types";
import qrRouter from "./qr-router";

export const routers: IRouter[] = [
  { path: "/qr", router: qrRouter }
];

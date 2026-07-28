import { IRouter } from "../types";
import redemptionRouter from "./redemption-router";

export const routers: IRouter[] = [
  { path: "/redemption", router: redemptionRouter }
];

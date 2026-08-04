import { IRouter } from "../types";
import redemptionRouter from "./redemption-router";
import bankDetailsRouter from "./bank-details-router";
import upiRouter from "./upi-router";

export const routers: IRouter[] = [
  { path: "/bank-details", router: bankDetailsRouter },
  { path: "/upi", router: upiRouter },
  { path: "/redemption", router: redemptionRouter },
];

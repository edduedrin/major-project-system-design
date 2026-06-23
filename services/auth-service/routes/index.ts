import { IRouter } from "../types";
import authRouter from "./auth-router";
import userRouter from "./user-router"
import redemptionRouter from "./redemption-router"
import kycRouter from "./kyc-router"
import skuRouter from "./sku-router"
import qrRouter from "./qr-router"
import reportRouter from "./report-router"
import mastersRouter from "./masters-router"
import passbookRouter from "./passbook-router"
import amazonMarketRouter from "./amazon-market-router"
import voucherRouter from "./voucher-router"
import notificationRouter from "./notification-router"
import surveyRouter from "./survey-router"

export const routers: IRouter[] = [
    { path: "/auth", router: authRouter },
    { path: "/user", router: userRouter },
    { path: "/redeem", router: redemptionRouter },
    { path: "/kyc", router: kycRouter },
    { path: "/sku", router: skuRouter },
    { path: "/qr", router: qrRouter },
    { path: "/report", router: reportRouter },
    { path: "/masters", router: mastersRouter },
    { path: "/passbook", router: passbookRouter },
    { path: "/amazon-market", router: amazonMarketRouter },
    { path: "/voucher", router: voucherRouter },
    { path: "/notifications", router: notificationRouter },
    { path: "/surveys", router: surveyRouter }
];

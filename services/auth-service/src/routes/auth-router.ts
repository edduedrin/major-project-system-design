import { Router } from "express";
import authController from "../modules/auth/controller/auth-controller";

const authRouter = Router();

authRouter.get("/", (req, res) => {
  res.json({ message: "Auth service routing working" });
});

authRouter.post("/register", (req, res, next) => authController.register(req, res, next));
authRouter.post("/signin", (req, res, next) => authController.signIn(req, res, next));
authRouter.post("/signin/otp/send", (req, res, next) => authController.sendOtpForSignIn(req, res, next));
authRouter.post("/signin/otp/verify", (req, res, next) => authController.verifyOtpForSignIn(req, res, next));
authRouter.post("/forgot-password", (req, res, next) => authController.forgotPassword(req, res, next));
authRouter.post("/reset-password/send-otp", (req, res, next) => authController.sendOtpForPasswordReset(req, res, next));
authRouter.post("/reset-password/verify-otp", (req, res, next) => authController.verifyOtpForPasswordReset(req, res, next));
authRouter.post("/reset-password", (req, res, next) => authController.resetPassword(req, res, next));

export default authRouter;

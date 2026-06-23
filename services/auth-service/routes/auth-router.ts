import express, { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middlewares/auth-middleware";
import { fileMiddleware } from "../middlewares/file-middleware";
import { authController } from "../controllers";

const router: Router = express.Router();

/**
 * @openapi
 * /auth/health:
 *   get:
 *     summary: Health Check Route
 *     description: Health Check Route
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "OK"
 */
router.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "OK" });
});
router.get("/test", authController.test);

/**
 * @openapi
 * /auth/send-otp:
 *   post:
 *     summary: Generate OTP for a user
 *     description: Creates a new OTP for registration or other purposes
 *     tags:
 *       - OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mobile:
 *                 type: string
 *                 example: "9876543210"
 *               purpose:
 *                 type: string
 *                 example: "register-user"
 *     responses:
 *       201:
 *         description: OTP created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: "OTP created successfully. Valid for 5 mins"
 *       400:
 *         description: Invalid request
 */
// router.post("/send-otp", (req: Request, res: Response, next: NextFunction) => {
//     authController.sendOtp(req, res, next);
// });
router.post("/otps", authController.sendOtp);

/**
 * @openapi
 * /auth/otps/verify:
 *   post:
 *     summary: Verify OTP
 *     description: Verifies an OTP for a given mobile number and OTP type (e.g., register-user, forgot-password)
 *     tags:
 *       - OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobile
 *               - otp
 *               - type
 *             properties:
 *               mobile:
 *                 type: string
 *                 example: "9876543210"
 *                 description: Mobile number for which OTP was generated
 *               otp:
 *                 type: string
 *                 example: "123456"
 *                 description: OTP code received by the user
 *               type:
 *                 type: string
 *                 example: "register-user"
 *                 description: Type of OTP (register-user, forgot-password, etc.)
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "OTP verified successfully"
 *       400:
 *         description: Invalid request or OTP expired
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 responseCode:
 *                   type: number
 *                   example: 400
 *                 responseMessage:
 *                   type: string
 *                   example: "Invalid or expired OTP"
 */
router.post("/otps/verify", authController.verifyOtp);

/**
 * @openapi
 * /auth/signin:
 *   post:
 *     summary: User Sign-In
 *     description: Allows a user to sign in using either mobile or email along with password.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               mobile:
 *                 type: string
 *                 example: "9876543210"
 *                 description: Mobile number of the user
 *               password:
 *                 type: string
 *                 example: "StrongPassword123!"
 *                 description: User password
 *     responses:
 *       200:
 *         description: User signed in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Signed in successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: integer
 *                       example: 101
 *                     userName:
 *                       type: string
 *                       example: "John Doe"
 *                     token:
 *                       type: string
 *                       example: "jwt.access.token.here"
 *       400:
 *         description: Validation error or incorrect credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: "Incorrect password or invalid credentials"
 */
router.post("/signin", authController.signIn);

router.post(
  "/new-password",
  authMiddleware.mobileToken,
  authController.setNewPassword
);

router.get(
  "/user-logout",
  authMiddleware.verifyToken,
  authController.userLogout
);

router.post(
  "/set-pin",
  authMiddleware.verifyToken,
  authController.setPin
);

router.post(
  "/pin-verify",
  authMiddleware.verifyToken,
  authController.verifyPin
);

export default router;

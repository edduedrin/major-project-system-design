import express, { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middlewares/auth-middleware";
import { fileMiddleware } from "../middlewares/file-middleware";
import { authController } from "../controllers";
import { userController } from "../controllers/user-controller";

const router: Router = express.Router();

/**
 * @openapi
 * /user/users:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user in the system. OTP verification should be completed for mechanic/retailer roles.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userName
 *               - displayName
 *               - userEmail
 *               - userMobile
 *               - userRole
 *               - userPassword
 *             properties:
 *               userName:
 *                 type: string
 *                 example: "John Doe"
 *               displayName:
 *                 type: string
 *                 example: "John"
 *               userEmail:
 *                 type: string
 *                 example: "john@example.com"
 *               userMobile:
 *                 type: string
 *                 example: "9876543210"
 *               userRole:
 *                 type: integer
 *                 example: 1
 *               userPassword:
 *                 type: string
 *                 example: "StrongPassword123!"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: "User registered successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: integer
 *                       example: 101
 *       400:
 *         description: Validation error or user already exists
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
 *                   example: "User already exists"
 */
router.post("/users", authMiddleware.mobileToken, userController.registerUser);
router.post("/addUser", authMiddleware.verifyToken, userController.addUser);

/**
 * @openapi
 * /user/roles:
 *   get:
 *     summary: Get all active roles
 *     description: Fetches a list of all active roles in the system.
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: List of active roles fetched successfully
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
 *                   example: "Active roles fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       roleId:
 *                         type: integer
 *                         example: 1
 *                       roleName:
 *                         type: string
 *                         example: "mechanic"
 *                       roleDescription:
 *                         type: string
 *                         example: "Role for mechanics"
 *                       isActive:
 *                         type: boolean
 *                         example: true
 */
router.get("/roles", userController.listRoles);
router.post("/update-profile", authMiddleware.verifyToken, fileMiddleware.acceptSingleFile('user-profile'), userController.updateUserProfile);
router.get("/user-profile", authMiddleware.verifyToken, userController.getUserProfile);
router.post("/raise-ticket", authMiddleware.verifyToken, fileMiddleware.acceptSingleFile('ticket'), userController.raiseTicket);
router.post("/get-account-details", authMiddleware.verifyToken, userController.getAccountDetails)
router.post("/assign-ticket", authMiddleware.verifyToken, userController.assignTicket);
router.post("/resolve-ticket", authMiddleware.verifyToken, userController.resolveTickets);
router.get("/count", authMiddleware.verifyToken, userController.userCount);
router.get("/list", authMiddleware.verifyToken, userController.listUsers);
router.patch("/:userId/deactivate", authMiddleware.verifyToken, userController.deactivateUser);
router.patch("/:userId/activate", authMiddleware.verifyToken, userController.activateUser);
router.get("/activity/logs", authMiddleware.verifyToken, userController.listActivityLogs);
router.get("/tickets", authMiddleware.verifyToken, userController.fetchTickets);
router.get("/tickets/image", authMiddleware.verifyToken, userController.fetchTicketSignedUrl);
router.put("/users/:userId", userController.updateUserDetails);
export default router;

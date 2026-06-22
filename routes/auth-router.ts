
import express, { Router, Request, Response, NextFunction } from "express";
import { authController } from "../controllers/auth-controller";

const router: Router = express.Router();
router.post("/signin", authController.signIn);
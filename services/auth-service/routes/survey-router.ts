import express, { Router } from "express";
import { authMiddleware } from "../middlewares/auth-middleware";
import { surveyController } from "../controllers";

const router: Router = express.Router();

// Question Management
router.get("/questions", authMiddleware.verifyToken, surveyController.getQuestions);
router.post("/questions", authMiddleware.verifyToken, surveyController.createQuestion);
router.delete("/questions/:id", authMiddleware.verifyToken, surveyController.deleteQuestion);

// Response Management
router.post("/submit", authMiddleware.verifyToken, surveyController.submitSurvey);
router.get("/results", authMiddleware.verifyToken, surveyController.getSurveyResults);

export default router;

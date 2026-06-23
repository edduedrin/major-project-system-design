import { NextFunction, Request, Response } from "express";
import { surveyRepository } from "../repositories";
import { CustomError } from "../types";
import { customValidators } from "../utils/custom-validators";

class SurveyController {
    customError: CustomError;
    constructor() {
        this.customError = new CustomError({
            responseMessage: "",
            responseCode: 400
        })
    }

    createQuestion = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { questionText, answerType, options } = customValidators.validateSurveyQuestion(req.body);

            const question = await surveyRepository.createQuestion({
                questionText,
                answerType,
                options,
                createdBy: req.user?.userId
            });

            return res.json({
                message: "Survey question created successfully",
                code: 201,
                data: question
            })
        } catch (error) {
            next(error);
        }
    }

    getQuestions = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const questions = await surveyRepository.getQuestions();
            return res.json({
                message: "success",
                code: 200,
                data: questions
            })
        } catch (error) {
            next(error);
        }
    }

    deleteQuestion = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const questionId = customValidators.validateQuestionId(req.params.id);
            await surveyRepository.deleteQuestion(questionId);
            return res.json({
                message: "Survey question deleted successfully",
                code: 200
            })
        } catch (error) {
            next(error);
        }
    }

    submitSurvey = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const answers = customValidators.validateSurveySubmit(req.body);

            const response = await surveyRepository.submitResponse(req.user?.userId, answers);
            return res.json({
                message: "Survey submitted successfully",
                code: 201,
                data: response
            })
        } catch (error) {
            next(error);
        }
    }

    getSurveyResults = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const results = await surveyRepository.getSurveyResults();
            return res.json({
                message: "success",
                code: 200,
                data: results
            })
        } catch (error) {
            next(error);
        }
    }
}

export const surveyController = new SurveyController();

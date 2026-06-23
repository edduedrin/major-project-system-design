import { and, eq, sql } from "drizzle-orm";
import { SurveyQuestionModel, SurveyOptionModel, SurveyResponseModel, SurveyResponseDetailModel, UserModel } from "../schemas";
import { database } from "../server";
import { CustomError } from "../types";
import { CreateQuestionPayload, AnswerPayload } from "../types/survey";

class SurveyRepository {
    customError: CustomError;
    constructor() {
        this.customError = new CustomError({
            responseCode: 400,
            responseMessage: ""
        })
    }

    async createQuestion(data: CreateQuestionPayload): Promise<any> {
        return await database.transaction(async (tx) => {
            const [question] = await tx.insert(SurveyQuestionModel).values({
                questionText: data.questionText,
                answerType: data.answerType,
                createdBy: data.createdBy
            }).returning();

            if (data.options && data.options.length > 0) {
                await tx.insert(SurveyOptionModel).values(
                    data.options.map((optionText: string) => ({
                        questionId: question.questionId,
                        optionText
                    }))
                );
            }

            return question;
        });
    }

    async getQuestions(): Promise<any[]> {
        // We want questions with their options
        const questions = await database.select().from(SurveyQuestionModel)
            .where(eq(SurveyQuestionModel.isActive, true));

        const result = await Promise.all(questions.map(async (q) => {
            const options = await database.select().from(SurveyOptionModel).where(
                and(
                    eq(SurveyOptionModel.questionId, q.questionId),
                    eq(SurveyOptionModel.isActive, true)
                )
            );
            return { ...q, options };
        }));

        return result;
    }

    async deleteQuestion(questionId: number): Promise<any> {
        return await database.update(SurveyQuestionModel)
            .set({ isActive: false })
            .where(eq(SurveyQuestionModel.questionId, questionId))
            .returning();
    }

    async submitResponse(userId: number | undefined, answers: AnswerPayload[]): Promise<any> {
        if (!userId) {
            this.customError.responseMessage = "User ID is required";
            throw this.customError;
        }
        return await database.transaction(async (tx) => {
            const [response] = await tx.insert(SurveyResponseModel).values({
                userId: userId as number
            }).returning();

            for (const ans of answers) {
                if (ans.optionIds && ans.optionIds.length > 0) {
                    await tx.insert(SurveyResponseDetailModel).values(
                        ans.optionIds.map((optionId: number) => ({
                            responseId: response.responseId,
                            questionId: ans.questionId,
                            optionId: optionId
                        }))
                    );
                }
            }

            return response;
        });
    }

    async getSurveyResults(): Promise<any[]> {
        // This is the "show this data in one more read api"
        // Show responses with details and user info
        const responses = await database.select({
            responseId: SurveyResponseModel.responseId,
            userId: SurveyResponseModel.userId,
            userName: UserModel.userName,
            userMobile: UserModel.userMobile,
            createdAt: SurveyResponseModel.createdAt,
        })
            .from(SurveyResponseModel)
            .leftJoin(UserModel, eq(SurveyResponseModel.userId, UserModel.userId));

        const result = await Promise.all(responses.map(async (r) => {
            const details = await database
                .select({
                    questionId: SurveyResponseDetailModel.questionId,
                    questionText: SurveyQuestionModel.questionText,
                    optionId: SurveyResponseDetailModel.optionId,
                    optionText: SurveyOptionModel.optionText
                })
                .from(SurveyResponseDetailModel)
                .leftJoin(SurveyQuestionModel, eq(SurveyResponseDetailModel.questionId, SurveyQuestionModel.questionId))
                .leftJoin(SurveyOptionModel, eq(SurveyResponseDetailModel.optionId, SurveyOptionModel.optionId))
                .where(eq(SurveyResponseDetailModel.responseId, r.responseId));

            return { ...r, details };
        }));

        return result;
    }
}

export const surveyRepository = new SurveyRepository();

import { pgTable, serial, integer } from 'drizzle-orm/pg-core';
import { SurveyQuestionModel } from './survey-question-model';
import { SurveyOptionModel } from './survey-option-model';
import { SurveyResponseModel } from './survey-response-model';

export const SurveyResponseDetailModel = pgTable('tbl_survey_response_details', {
    detailId: serial('detail_id').primaryKey(),
    responseId: integer('response_id').references(() => SurveyResponseModel.responseId).notNull(),
    questionId: integer('question_id').references(() => SurveyQuestionModel.questionId).notNull(),
    optionId: integer('option_id').references(() => SurveyOptionModel.optionId),
});

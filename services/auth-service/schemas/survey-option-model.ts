import { pgTable, serial, text, boolean, timestamp, integer } from 'drizzle-orm/pg-core';
import { SurveyQuestionModel } from './survey-question-model';

export const SurveyOptionModel = pgTable('tbl_survey_options', {
    optionId: serial('option_id').primaryKey(),
    questionId: integer('question_id').references(() => SurveyQuestionModel.questionId).notNull(),
    optionText: text('option_text').notNull(),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
});

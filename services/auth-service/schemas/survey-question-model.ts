import { pgTable, serial, text, boolean, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';

export const surveyAnswerTypeEnum = pgEnum('survey_answer_type', ['radio', 'checkbox']);

export const SurveyQuestionModel = pgTable('tbl_survey_questions', {
    questionId: serial('question_id').primaryKey(),
    questionText: text('question_text').notNull(),
    answerType: surveyAnswerTypeEnum('answer_type').notNull(),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    createdBy: integer('created_by'),
});

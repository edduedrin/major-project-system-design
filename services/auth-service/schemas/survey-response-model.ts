import { pgTable, serial, timestamp, integer } from 'drizzle-orm/pg-core';
import { UserModel } from './user-model';

export const SurveyResponseModel = pgTable('tbl_survey_responses', {
    responseId: serial('response_id').primaryKey(),
    userId: integer('user_id').references(() => UserModel.userId).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});

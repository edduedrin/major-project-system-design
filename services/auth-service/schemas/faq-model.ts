import { pgTable, serial, text, boolean, timestamp, integer } from 'drizzle-orm/pg-core';

export const FAQModel = pgTable('tbl_faqs', {
    faqId: serial('faq_id').primaryKey(),
    faqQuestion: text('faq_question').notNull(),
    faqAnswer: text('faq_answer').notNull(),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    createdBy: integer('created_by').notNull(),
});

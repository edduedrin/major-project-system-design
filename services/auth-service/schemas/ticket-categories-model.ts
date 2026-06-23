import { pgTable, serial, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';

export const TicketCategoryModel = pgTable('tbl_ticket_categories', {
  ticketId: serial('ticket_id').primaryKey(),
  ticketCategory: varchar('ticket_category', { length: 100 }),
  ticketDescription: varchar('ticket_description', { length: 255 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
});
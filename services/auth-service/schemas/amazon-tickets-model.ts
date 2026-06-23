import { integer, pgEnum, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const AmazonTicketStatusEnum = pgEnum("amazon_ticket_status_enum", ["Pending", "Resolved", "Cancelled"])

export const AmazonTicketsModel = pgTable('tbl_amazon_tickets', {
  ticketId: serial('ticket_id').primaryKey(),
  ticketTypeId: integer('ticket_type_id'),// create a ticket categeory for amazon 
  orderId: integer('order_id'),
  userId: integer('user_id'),
  productId: integer('product_id'),
  reason: varchar('reason'),
  requestType: varchar('request_type', { length: 20 }),
  ticketStatus: AmazonTicketStatusEnum('status').default('Pending'),
  createdAt: timestamp('created_at').defaultNow(),
});
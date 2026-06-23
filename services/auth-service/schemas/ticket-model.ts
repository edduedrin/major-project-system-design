import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const ticketStatusEnum = pgEnum("ticket_status_enum", [
  "Pending",
  "Resolved",
  "Escalated"
])

export const TicketModel = pgTable("tbl_tickets", {
  ticketId: serial("ticket_id").primaryKey(),
  userId: integer("user_id").notNull(),
  ticketRef: varchar("ticket_ref"),
  ticketCategoryId: integer("ticket_list_id").notNull(),
  description: text("description").notNull(),
  ticketStatus: ticketStatusEnum("ticket_status").default("Pending").notNull(),
  imgUrl: varchar("img_url", { length: 100 }),
  // resolvedBy:integer("resolved_by"),
  resolvedComments: varchar("resolved_comments"),
  // resolvedAt:timestamp("resolved_at"),
  // updatedAt:timestamp("updated_at"),
  //escalate to higher role feature need to be implemented
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").notNull(),
  roleAssigned: integer("role_assigned").notNull().default(3)
});

import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { ticketStatusEnum } from "./ticket-model";


export const TicketTrailModel = pgTable('tbl_ticket_trails', {
    trailId: serial("trail_id").primaryKey(),
    ticketId: integer("ticket_id").notNull(),
    assignedRole: integer('assigned_role').notNull(),
    ticketStatus: ticketStatusEnum("ticket_status").default('Pending').notNull(),
    remarks: varchar('remarks').notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    createdBy: integer('created_by').notNull()
});
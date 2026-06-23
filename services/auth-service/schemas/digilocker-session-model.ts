import { boolean, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const DigilockerSessionModel = pgTable("tbl_digilocker_sessions", {
  digilockerSessionId: serial("digilocker_session_id").primaryKey().notNull(),
  sessionId: varchar("session_id", { length: 100 }).notNull(),
  userId: integer("user_id").notNull(),
  redirectionUrl: text("redirection_url").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

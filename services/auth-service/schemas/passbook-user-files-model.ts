import { pgTable, serial, integer, varchar, timestamp, date } from "drizzle-orm/pg-core";

export const UserPassbookFilesModel = pgTable("tbl_user_passbook_files", {
  fileId: serial("file_id").primaryKey(),
  userId: integer("user_id").notNull(),
  fileUrl: varchar("file_url", { length: 500 }).notNull(),
  generatedDate: date("generated_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

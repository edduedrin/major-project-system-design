import { pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const TempLogModel = pgTable("tbl_temp_logs", {
  logId: serial("log_id").primaryKey(),
  url: varchar("url"),
  request: varchar("request"),
  response: varchar("response"),
  apiMetaData: varchar("api_meta_data"),
  createdAt: timestamp("created_at", { withTimezone: true }),
});

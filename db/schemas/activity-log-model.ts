import { pgTable, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";

export const activityEnum = pgEnum("activity_type_enum", [
    "login",
    "logout"
]);

export const ActivityLogModel = pgTable("tbl_activity_logs", {
    logId: serial("log_id").primaryKey(),
    activityType: activityEnum("activity_type").notNull(),
    userId: integer("user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    createdBy: integer("created_by"),
});

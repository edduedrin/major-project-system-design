import { integer, pgEnum, pgTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { NotificationModel } from "./notification-model";
import { UserModel } from "./user-model";

export const notificationLogStatusEnum = pgEnum("notification_log_status", [
    "SENT",
    "FAILED"
]);

export const NotificationLogModel = pgTable(
    "tbl_notification_logs",
    {
        id: serial("id").primaryKey(),
        notificationId: integer("notification_id").references(() => NotificationModel.id).notNull(),
        userId: integer("user_id").references(() => UserModel.userId).notNull(),
        status: notificationLogStatusEnum("status").notNull(),
        failureReason: text("failure_reason"),
        scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
        processedAt: timestamp("processed_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
    },
    (t) => ({
        // One log entry per user per notification — prevents duplicate delivery records
        // on message redelivery. Pair the bulk INSERT with ON CONFLICT DO NOTHING if needed.
        uniqNotificationUser: uniqueIndex("uq_notification_log_notification_user").on(
            t.notificationId,
            t.userId
        )
    })
);

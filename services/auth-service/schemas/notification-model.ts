import { integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { CampaignModel } from "./campaign-model";

export const notificationStatusEnum = pgEnum("notification_status", [
    "PENDING",
    "PROCESSING",
    "FANNED_OUT",
    "COMPLETED",
    "FAILED"
]);

export const notificationTypeEnum = pgEnum("notification_type", [
    "REGULAR",
    "SCHEDULED",
    "CAMPAIGN"
]);

export const NotificationModel = pgTable("tbl_notifications", {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),
    imageUrl: varchar("image_url", { length: 500 }),
    redirectionLink: varchar("redirection_link", { length: 500 }),
    roleFilter: integer("role_filter").array(),
    stateFilter: varchar("state_filter", { length: 255 }).array(),
    districtFilter: varchar("district_filter", { length: 255 }).array(),
    cityFilter: varchar("city_filter", { length: 255 }).array(),
    pincodeFilter: integer("pincode_filter").array(),
    blockStatusFilter: varchar("block_status_filter", { length: 50 }).array(),
    status: notificationStatusEnum("status").default("PENDING").notNull(),
    type: notificationTypeEnum("type").default("REGULAR").notNull(),
    campaignId: integer("campaign_id").references(() => CampaignModel.id),
    sentCount: integer("sent_count").default(0),
    failureCount: integer("failure_count").default(0),
    totalUsers: integer("total_users").default(0),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

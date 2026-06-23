import { pgEnum, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const campaignRecurrenceEnum = pgEnum("campaign_recurrence", [
    "HOURLY",
    "DAILY",
    "WEEKLY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY"
]);

export const campaignStatusEnum = pgEnum("campaign_status", [
    "ACTIVE",
    "COMPLETED",
    "CANCELLED"
]);

export const CampaignModel = pgTable("tbl_campaign", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    scheduledTime: varchar("scheduled_time", { length: 10 }),
    recurrence: campaignRecurrenceEnum("recurrence").notNull(),
    status: campaignStatusEnum("status").default("ACTIVE").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

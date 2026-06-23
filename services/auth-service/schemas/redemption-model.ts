import {
  pgTable,
  serial,
  varchar,
  integer,
  timestamp,
  pgEnum,
  numeric,
  jsonb,
} from "drizzle-orm/pg-core";
import { RedemptionOrderAddressType } from "../types";
import { PayoutResponse, WebhookPayload } from "../types/razorpay";

export const redemptionStatusEnum = pgEnum("redemption_status_enum", [
  "Pending",
  "Approved",
  "Rejected",
  "Processing",
  "Completed",
  "Failed"
]);

export const redemptionModeEnum = pgEnum("redemption_mode_enum", [
  "UPI",
  "Bank Transfer",
  "Market Products"
]);

export const RedemptionModel = pgTable("tbl_redemptions", {
  redemptionId: serial("redemption_id").primaryKey(),
  redemptionRef: varchar("redemption_ref").notNull().unique(),
  userId: integer("user_id").notNull(),
  totalUnit: integer("total_unit").default(1).notNull(),
  points: numeric('points', { precision: 18, scale: 2 }).default("0.00"),
  redemptionStatus: redemptionStatusEnum("redemption_status").default('Pending'),
  redemptionMessage: varchar("redemption_message", { length: 255 }),
  ipAddress: varchar("ip_address", { length: 20 }),
  source: varchar("source", { length: 10 }),
  redemptionMode: redemptionModeEnum("redemption_mode").notNull(),
  orderAddress: jsonb("order_address").$type<RedemptionOrderAddressType>(),
  longitude: varchar("longitude", { length: 255 }),
  latitude: varchar("latitude", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  createdBy: integer("created_by").notNull(),
  processedBy: integer("processed_by"),
  comments: varchar("comments"),
  razorpayMetaData: jsonb("razorpay_meta_data").$type<PayoutResponse>(),
  webhookMetaData: jsonb("webhook_meta_data").$type<WebhookPayload>(),
  lastWebhookProcessedAt: timestamp("last_webhook_processed_at"),
});
// redemption mpdoel
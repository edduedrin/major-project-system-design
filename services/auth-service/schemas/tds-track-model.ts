import { integer, jsonb, numeric, pgEnum, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { TDSTrackMetaDataColumn } from "../types";

export const EarnTypeEnum = pgEnum("earn_type_enum", ["scan", "register", "referral"]);

export const TDSTrackModel = pgTable("tbl_tds_tracks", {
    trackId: serial("track_id").primaryKey(),
    userId: integer("user_id").notNull(),
    earnedPoints: numeric("earned_points", { precision: 18, scale: 2 }).default("0.00").notNull(),
    tdsDeducted: numeric("tds_deducted", { precision: 18, scale: 2 }).default("0.00").notNull(),
    totalPoints: numeric("total_points", { precision: 18, scale: 2 }).default("0.00").notNull(),
    tdsSlab: numeric("tds_slab", { precision: 18, scale: 2 }).default("20.00").notNull(),
    earnType: EarnTypeEnum("earn_type").notNull(),
    metaData: jsonb("meta_data").$type<TDSTrackMetaDataColumn>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
})
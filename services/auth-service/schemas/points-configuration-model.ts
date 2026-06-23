import { boolean, numeric, pgEnum, pgTable, serial, timestamp } from "drizzle-orm/pg-core";

export const pointsConfigTypeEnum = pgEnum("points_config_type_enum", ["Registration", "Referrer", "Referee", "Point-Conversion", "TDS-threshold"]);

export const PointConfigurationModel = pgTable("tbl_point_configurations", {
    pointId: serial("point_id").primaryKey(),
    configType: pointsConfigTypeEnum("config_type").notNull(),
    points: numeric("points", { precision: 18, scale: 2 }).default("0.00").notNull(),
    isActive: boolean("is_active").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
})
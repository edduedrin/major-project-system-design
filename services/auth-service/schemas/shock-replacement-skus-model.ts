import { pgTable, numeric, boolean, timestamp, varchar, text, integer } from "drizzle-orm/pg-core";

export const ShockReplacementSkusModel = pgTable("tbl_shock_replacement_skus", {
    id: numeric("id", { precision: 10, scale: 0 }).primaryKey().notNull(),
    skuCode: text("sku_code"),
    skuName: varchar("sku_name", { length: 100 }),
    createdAt: timestamp("created_at").defaultNow(),
    isActive: boolean("is_active").default(true),
    createdBy: integer("created_by"),
});

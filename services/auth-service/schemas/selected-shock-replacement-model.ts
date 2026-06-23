import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const SelectedShockReplacementModel = pgTable("tbl_selected_shock_replacement", {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    skuCode: text("sku_code").notNull(),
    quantity: integer("quantity").notNull().default(1),
    skuName: text("sku_name"),
    createdAt: timestamp("created_at").defaultNow(),
    createdBy: integer("created_by"),
});

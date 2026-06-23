import { create } from "domain";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const InventoryBatch = pgTable("tbl_inventory_batch", {
    batchId: serial("batch_id").primaryKey(),
    skuCode: varchar("sku_code", { length: 255 }).notNull(),
    quantity: integer("quantity").notNull(),
    fileUrl: varchar("file_url", { length: 255 }),
    isActive:boolean("is_active").notNull().default(true),
    createdBy: integer("created_by").notNull(),
    updatedBy: integer("updated_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
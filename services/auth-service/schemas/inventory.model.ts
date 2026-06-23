import { boolean, integer, pgTable, serial, varchar } from "drizzle-orm/pg-core";

export const InventoryModel = pgTable("tbl_inventory", {
    inventoryId: serial("inventory_id").primaryKey(),
    serialNumber: varchar("serial_number", { length: 255 }).notNull().unique(),
    batchId: integer("batch_id").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    isQrScanned:boolean("is_qr_scanned").notNull().default(false)
});
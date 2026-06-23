import { pgTable, serial, varchar, numeric, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

export const SkuMasterModel = pgTable('tbl_sku_masters', {
  skuId: serial('sku_id').primaryKey(),
  skuName: varchar('sku_name', { length: 255 }).notNull(),
  skuCode: varchar('sku_code', { length: 50 }).notNull(),
  skuDescription: varchar('sku_description', { length: 255 }).notNull(),
  productValue: numeric('product_value' , { precision: 18, scale: 2 }).notNull().default("0.00"),
  points: numeric('points' , { precision: 18, scale: 2 }).notNull().default("0.00"),
  subCategoryId: integer('sub_category_id').notNull(),
  categoryId: integer('category_id').notNull(),
  branchId: integer('branch_id').array(), // PostgreSQL array type for branchId
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow()
});
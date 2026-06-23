import { pgTable, serial, varchar } from 'drizzle-orm/pg-core';

export const PurchasingRetailersModel = pgTable('tbl_purchasing_retailers', {
  retailerId: serial('purchasing_retailer_id').primaryKey(),
  shopName: varchar('shop_name', { length: 150 }).notNull(),
  address: varchar('address', { length: 255 }).notNull(),
  mobile: varchar('mobile', { length: 10 }).notNull().unique(),
});

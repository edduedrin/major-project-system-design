import { pgTable, serial, varchar, integer, timestamp, text, numeric, pgEnum } from 'drizzle-orm/pg-core';

export const transactionStatusEnum = pgEnum("transaction_status_enum", ["Success", "Failure"])

export const TransactionModel = pgTable('tbl_transactions', {
  transactionId: serial('transaction_id').primaryKey(),
  userId: integer('user_id'),
  serialNumber: varchar('serial_number', { length: 100 }),
  totalPoints: numeric("total_points", { precision: 18, scale: 2 }).default("0.00").notNull(),
  productValue: numeric('product_value', { precision: 18, scale: 2 }).default("0.00").notNull(),
  transactionStatus: transactionStatusEnum('transaction_status').default('Failure').notNull(),
  transactionMessage: text('transaction_message'),
  skuCode: varchar('sku_code', { length: 50 }),
  baseSchemePoints: numeric("base_scheme_points", { precision: 18, scale: 2 }).default("0.00").notNull(),
  multiplier: numeric('multiplier', { precision: 5, scale: 2 }),
  schemeId: integer('scheme_id'),
  ipAddress: varchar('ip_address', { length: 50 }),
  source: varchar('source', { length: 50 }),
  longitude: varchar('longitude', { length: 50 }),
  latitude: varchar('latitude', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: integer('created_by')
});
import { pgTable, uuid, varchar, integer, numeric, timestamp, jsonb, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const bankDetails = pgTable('bank_details', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().unique(),
  accountHolderName: varchar('account_holder_name', { length: 255 }).notNull(),
  accountNumber: varchar('account_number', { length: 255 }).notNull(),
  ifscCode: varchar('ifsc_code', { length: 50 }).notNull(),
  bankName: varchar('bank_name', { length: 255 }).notNull(),
  branch: varchar('branch', { length: 255 }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const upiDetails = pgTable('upi_details', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().unique(),
  upiId: varchar('upi_id', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const redemptionRequests = pgTable('redemption_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  redemptionType: varchar('redemption_type', { length: 50 }).notNull(), // 'BANK', 'UPI'
  walletPoints: integer('wallet_points').notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).default('PENDING').notNull(), // 'PENDING', 'APPROVED', 'REJECTED', 'PAID'
  bankAccountSnapshot: jsonb('bank_account_snapshot'),
  upiSnapshot: text('upi_snapshot'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const userWallets = pgTable('user_wallets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().unique(),
  balance: integer('balance').default(0).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

// Legacy redemptions table alias for backwards compatibility if needed
export const redemptions = redemptionRequests;

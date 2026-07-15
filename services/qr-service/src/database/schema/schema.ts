import { pgTable, uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const productUniqueCodes = pgTable('product_unique_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  serialNumber: varchar('serial_number', { length: 100 }).unique().notNull(),
  productId: varchar('product_id', { length: 255 }),
  productName: varchar('product_name', { length: 255 }),
  status: varchar('status', { length: 50 }).default('GENERATED').notNull(),
  scannedCount: integer('scanned_count').default(0).notNull(),
  lastScannedAt: timestamp('last_scanned_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const qrScanHistory = pgTable('qr_scan_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  codeId: uuid('code_id')
    .references(() => productUniqueCodes.id, { onDelete: 'cascade' })
    .notNull(),
  scannedAt: timestamp('scanned_at', { mode: 'date' }).defaultNow().notNull(),
  scanMethod: varchar('scan_method', { length: 50 }).notNull(), // 'QR_SCAN' or 'MANUAL_ENTRY'
  ipAddress: varchar('ip_address', { length: 100 }),
  userAgent: varchar('user_agent', { length: 255 }),
  latitude: varchar('latitude', { length: 50 }),
  longitude: varchar('longitude', { length: 50 }),
});

export const productUniqueCodesRelations = relations(productUniqueCodes, ({ many }) => ({
  scanHistories: many(qrScanHistory),
}));

export const qrScanHistoryRelations = relations(qrScanHistory, ({ one }) => ({
  productCode: one(productUniqueCodes, {
    fields: [qrScanHistory.codeId],
    references: [productUniqueCodes.id],
  }),
}));

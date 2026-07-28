import { pgTable, uuid, varchar, integer, timestamp, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const redemptions = pgTable('redemptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  redemptionCode: varchar('redemption_code', { length: 100 }).unique().notNull(),
  totalPoints: integer('total_points').notNull(),
  status: varchar('status', { length: 50 }).default('PENDING').notNull(), // 'PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'
  remarks: text('remarks'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const redemptionItems = pgTable('redemption_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  redemptionId: uuid('redemption_id')
    .references(() => redemptions.id, { onDelete: 'cascade' })
    .notNull(),
  productId: varchar('product_id', { length: 255 }).notNull(),
  productName: varchar('product_name', { length: 255 }),
  pointsPerUnit: integer('points_per_unit').notNull(),
  quantity: integer('quantity').default(1).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const redemptionHistory = pgTable('redemption_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  redemptionId: uuid('redemption_id')
    .references(() => redemptions.id, { onDelete: 'cascade' })
    .notNull(),
  previousStatus: varchar('previous_status', { length: 50 }),
  newStatus: varchar('new_status', { length: 50 }).notNull(),
  changedBy: uuid('changed_by'),
  comment: text('comment'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const redemptionsRelations = relations(redemptions, ({ many }) => ({
  items: many(redemptionItems),
  history: many(redemptionHistory),
}));

export const redemptionItemsRelations = relations(redemptionItems, ({ one }) => ({
  redemption: one(redemptions, {
    fields: [redemptionItems.redemptionId],
    references: [redemptions.id],
  }),
}));

export const redemptionHistoryRelations = relations(redemptionHistory, ({ one }) => ({
  redemption: one(redemptions, {
    fields: [redemptionHistory.redemptionId],
    references: [redemptions.id],
  }),
}));

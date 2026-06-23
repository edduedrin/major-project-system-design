import { boolean, integer, pgTable, serial, timestamp, varchar, numeric } from "drizzle-orm/pg-core";

export const AmazonMarketAddressModel = pgTable('tbl_amazon_market_addresses', {
    addressId: serial('address_id').primaryKey(),
    userId: integer('user_id').notNull(),
    pincode: varchar('pincode', { length: 20 }).notNull(),
    addressLabel: varchar('address_label', { length: 255 }),
    addressLine1: varchar('address_line1', { length: 255 }).notNull(),
    addressLine2: varchar('address_line2', { length: 255 }),
    city: varchar('city', { length: 100 }),
    state: varchar('state', { length: 100 }),
    country: varchar('country', { length: 100 }).default('India').notNull(),
    latitude: numeric('latitude'),
    longitude: numeric('longitude'),
    isDefault: boolean('is_default').default(false).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
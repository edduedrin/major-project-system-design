import { boolean, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";

export const AmazonWishlistModel = pgTable('tbl_amazon_wishlist', {
    wishlistId: serial('wishlist_id').primaryKey(),
    userId: integer('user_id').notNull(),
    amazonMarketProductId: integer('amazon_market_product_id').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
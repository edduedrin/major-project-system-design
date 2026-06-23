import { boolean, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";

export const AmazonCartModel = pgTable('tbl_amazon_carts', {
    cartId: serial('cart_id').primaryKey(),
    userId: integer('user_id').notNull(),
    amazonMarketProductId: integer('amazon_market_product_id').notNull(),
    quantity: integer('quantity').default(1).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

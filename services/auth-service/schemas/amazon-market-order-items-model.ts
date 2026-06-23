import { boolean, integer, numeric, pgEnum, pgTable, serial, timestamp } from "drizzle-orm/pg-core";

// export const AmazonOrderStatusEnum = pgEnum("amazon_order_status_enum", ["Pending", "Approved", "Rejected", "Cancelled", "Hold", "Shipping", "Delivered", "Replacement"])
export const AmazonDeliveryStatusEnum = pgEnum("amazon_delivery_status_enum", ["Order Placed", "Shipping", "Delivered", "Pending"])

export const AmazonMarketOrderItemsModel = pgTable('tbl_amazon_market_order_items', {
    orderItemId: serial('order_item_id').primaryKey(),
    redemptionId: integer('redemption_id').notNull(),
    amazonProductId: integer('amazon_product_id').notNull(),
    productValue: numeric('product_value', { precision: 18, scale: 2 }).default('0.00').notNull(),
    deliveryStatus: AmazonDeliveryStatusEnum('delivery_status').default("Order Placed").notNull(),
    points: numeric('points', { precision: 18, scale: 2 }).default('0.00').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    dispatchedAt: timestamp('dispatched_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true })
});

// schema/order-items.ts
import {
    pgTable,
    uuid,
    varchar,
    numeric,
    integer,
    timestamp,
    uniqueIndex,
    index,
} from "drizzle-orm/pg-core";
import { voucherOrders } from "./voucher-orders-model";
// schema/enums.ts
import { pgEnum } from "drizzle-orm/pg-core"

export const voucherOrderItemStatusEnum = pgEnum("voucher_order_item_status_enum", [
    "CREATED",
    "COMPLETED",
    "FAILED",
    "REFUNDED",
]);

export const voucherOrderItems = pgTable(
    "voucher_order_items",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        orderId: integer("order_id")
            .notNull()
            .references(() => voucherOrders.id, { onDelete: "cascade" }),

        // One transaction per voucher (from Vouchagram)
        externalTxnId: varchar("external_txn_id", { length: 50 }).notNull(),

        voucherName: varchar("voucher_name", { length: 255 }).notNull(),

        rate: numeric("rate", {
            precision: 12,
            scale: 2,
        }).notNull(),

        quantity: integer("quantity").notNull(),

        itemStatus: voucherOrderItemStatusEnum("item_status").notNull(),

        txnTime: timestamp("txn_time", { withTimezone: true }).notNull(),

        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (table) => ({
        // Item-level idempotency
        orderTxnUniqueIdx: uniqueIndex("uq_order_items_order_txn").on(
            table.orderId,
            table.externalTxnId
        ),
        orderIdIdx: index("idx_order_items_order_id").on(table.orderId),
        statusIdx: index("idx_order_items_status").on(table.itemStatus),
    })
);
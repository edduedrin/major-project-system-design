// schema/orders.ts
import {
    pgTable,
    uuid,
    varchar,
    numeric,
    timestamp,
    index,
    uniqueIndex,
    serial,
} from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";

export const voucherOrderStatusEnum = pgEnum("voucher_order_status_enum", [
    "CREATED",
    "COMPLETED",
    "FAILED",
    "REFUNDED",
]);

export const voucherOrders = pgTable(
    "voucher_orders",
    {
        // Internal DB identity (not exposed)
        id: serial("id").primaryKey(),

        // Evolove reference ID (exposed to clients)
        refId: uuid("ref_id").defaultRandom().notNull(),
        userId: varchar("user_id", { length: 100 }).notNull(),

        // External order id from Vouchagram
        externalOrderId: varchar("external_order_id", { length: 50 }).notNull(),

        // Intended purchase value (INR)
        totalCartValue: numeric("total_cart_value", {
            precision: 12,
            scale: 2,
        }).notNull(),

        // What actually succeeded (INR)
        totalSuccessValue: numeric("total_success_value", {
            precision: 12,
            scale: 2,
        })
            .notNull()
            .default("0.00"),

        orderStatus: voucherOrderStatusEnum("order_status")
            .notNull()
            .default("CREATED"),

        createdAt: timestamp("created_at", { withTimezone: true })
            .notNull()
            .defaultNow(),

        updatedAt: timestamp("updated_at", { withTimezone: true })
            .notNull()
            .defaultNow(),
    },
    (table) => ({
        // Idempotency at order level
        externalOrderIdx: uniqueIndex("uq_orders_external_order_id").on(
            table.externalOrderId
        ),
        userIdIdx: index("idx_orders_user_id").on(table.userId),
        createdAtIdx: index("idx_orders_created_at").on(table.createdAt),
    })
);
import {
    pgTable,
    serial,
    varchar,
    integer,
    timestamp,
    pgEnum,
    numeric,
} from "drizzle-orm/pg-core";

export const UpiRedemptionModel = pgTable("tbl_upi_redemptions", {
    upiRedemptionId: serial("upi_redemption_id").primaryKey(),
    redemptionId: integer("redemption_id").notNull(),
    upiId: varchar("upi_id", { length: 255 }),
    vendorRequest: varchar("vendor_request"),
    vendorResponse: varchar("vendor_response"),
});

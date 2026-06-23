import {
    pgTable,
    serial,
    varchar,
    integer,
    timestamp,
    pgEnum,
    numeric,
} from "drizzle-orm/pg-core";

export const BankTransferRedemptionModel = pgTable("tbl_bank_transfer_redemptions", {
    bankTransferRedemptionId: serial("bank_transfer_redemption_id").primaryKey(),
    redemptionId: integer("redemption_id").notNull(),
    accountNumber: varchar("account_number", { length: 255 }),
    ifsc: varchar("ifsc", { length: 255 }),
    bankName: varchar("bank_name"),
    bankBranch: varchar("bank_branch"),
    accountHolderName: varchar("account_holder_name"),
    accountType: varchar("account_account"),
    vendorRequest: varchar("vendor_request"),
    vendorResponse: varchar("vendor_response"),
});

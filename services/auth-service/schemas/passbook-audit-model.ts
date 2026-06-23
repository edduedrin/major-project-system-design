import { pgTable, serial, varchar, uuid, integer, timestamp, jsonb, pgEnum, numeric } from "drizzle-orm/pg-core";
import { PassbookMetaDataColumn } from "../types";

export const transactionTypeEnum = pgEnum("transaction_type", ["Earn", "Redeem", "TDS", "Refund"]);

export const transactionActionEnum = pgEnum("transaction_action", [
    "QR_SCAN",
    "REGISTRATION",
    "REFERRAL",
    "BANK_TRANSFER",
    "UPI",
    "VOUCHER",
    "MARKETPLACE",
    "REFUND",
    "TDS_DEDUCTED",
    "OTHERS",
]);

export const PassbookAuditModel = pgTable("tbl_passbook_audits", {
    auditId: serial("audit_id").primaryKey(),
    userId: integer("user_id").notNull(),
    type: transactionTypeEnum("type").notNull(),
    action: transactionActionEnum("action").notNull(),
    referenceId: varchar("reference_id", { length: 255 }),
    amount: numeric("amount", { precision: 18, scale: 2 }).default("0.00").notNull(), // + for earning, - for redemption
    openingBalance: numeric("opening_balance", { precision: 18, scale: 2 }).default("0.00").notNull(),
    closingBalance: numeric("closing_balance", { precision: 18, scale: 2 }).default("0.00").notNull(),
    meta: jsonb("meta").$type<PassbookMetaDataColumn>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

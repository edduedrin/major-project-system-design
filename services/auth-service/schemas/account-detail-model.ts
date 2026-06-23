import {
  integer,
  varchar,
  boolean,
  pgTable,
  serial,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const accountTypeEnum = pgEnum("account_type_enum", [
  "Savings",
  "Current"
]);

export const AccountDetailModel = pgTable("tbl_bank_details", {
  bankDetailId: serial("bank_detail_id").primaryKey(),
  userId: integer("user_id"),
  accountNumber: varchar("account_number", { length: 255 }),
  accountIfsc: varchar("account_ifsc", { length: 255 }),
  accountType: accountTypeEnum("account_type"),
  bankName: varchar("bank_name", { length: 255 }),
  bankBranch: varchar("bank_branch", { length: 255 }),
  accountHolderName: varchar("account_holder_name", { length: 255 }),
  upiId: varchar("upi_id", { length: 255 }),
  chequeUrl: varchar("cheque_url", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: boolean("is_active").default(true),
  cnFlag:boolean("cn_flag").default(false),
  upiFlag:boolean("upi_flag").default(false),
  bankFlag:boolean("bank_flag").default(false),
});

import { pgTable, serial, integer, boolean, varchar, pgEnum, timestamp } from "drizzle-orm/pg-core";

export const preferredRetailersEnum = pgEnum("kyc_type_enum", [
    "aadhaar-front",
    "aadhaar-back",
    "pan-number",
    "pan-front",
    "preferred-retailers",
    "in-person-verification",
]);

export const kycDocStatusEnum = pgEnum("kyc_doc_status_enum", [
    "Pending",
    "Approved",
    "Rejected",
    "Completed"
]);

export const UserKycDetailsModel = pgTable("tbl_user_kyc_details", {
    detailId: serial("detail_id").notNull().primaryKey(),
    userId: integer("user_id").notNull(),
    kycType: preferredRetailersEnum("kyc_type").notNull(),
    kycDoc: varchar("kyc_doc").notNull(),
    docStatus: kycDocStatusEnum("doc_status").default("Pending").notNull(),
    regionalHeadDocStatus: kycDocStatusEnum("regional_head_doc_status").default("Pending").notNull(),
    marketingHeadDocStatus: kycDocStatusEnum("marketing_head_doc_status").default("Pending").notNull(),
    regionalHeadComment: varchar("regional_head_comment"),
    marketingHeadComment: varchar("marketing_head_comment"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    regionalUpdatedAt: timestamp("updated_at"),
    regionalUpdatedBy: integer("updated_by"),
    marketingHeadUpdatedAt: timestamp("marketing_head_updated_at"),
    marketingHeadUpdatedBy: integer("marketing_head_updated_by"),
    isActive: boolean("is_active").notNull().default(true),
});

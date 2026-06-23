import {
  pgTable,
  integer,
  varchar,
  boolean,
  serial,
  timestamp,
  numeric,
} from "drizzle-orm/pg-core";
import { genderEnum } from "./enum-index";

export const DealerModel = pgTable("tbl_dealers", {
  dealerId: serial("dealer_id").primaryKey(),
  userId: integer("user_id"),
  language: varchar("language",{length:20}).default("English"),
  gender: genderEnum("gender"),
  dob: timestamp("dob", { withTimezone: true }),
  firmName: varchar("firm_name", { length: 100 }),
  alternateMobile: varchar("alternate_mobile", { length: 15 }),
  whatsappMobile: varchar("whatsapp_mobile", { length: 15 }),
  maritalStatus: integer("marital_status"),
  annualIncome: varchar("annual_income", { length: 20 }),
  aadhaarNumber: varchar("aadhaar_number", { length: 12 }),
  panNumber: varchar("pan_number", { length: 255 }),
  softDelete: boolean("soft_delete").default(false),
  softDeleteAt: timestamp("soft_delete_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  updatedBy: integer("updated_by"),
  profileUrl: varchar("profile_url", { length: 255 }),
  aadhaarFrontUrl: varchar("aadhaar_front_url", { length: 255 }),
  aadhaarBackUrl: varchar("aadhaar_back_url", { length: 255 }),
  panUrl: varchar("pan_url", { length: 255 }),
  gstUrl: varchar("gst_url", { length: 255 }),
  earnedPoints: numeric("earned_points", { precision: 18, scale: 2 }).default("0.00"),
  redeemedPoints: numeric("redeemed_points", { precision: 18, scale: 2 }).default("0.00"), 
  balancePoints: numeric("balance_points", { precision: 18, scale: 2 }).default("0.00"), 
  bonusPoints: numeric("bonus_points", { precision: 18, scale: 2 }).default("0.00"), 
  tdsSlabs: varchar("tds_slabs").default("20%"), //points tables verify
  tdsConsent: boolean("tds_consent").default(false), //points tables verify
  gstNumber: varchar("gst_number", { length: 15 }),
  gssUserCode: varchar("gss_user_code", { length: 20 }),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  segment: varchar("segment", { length: 50 }),
  bankDetails: boolean("bank_details").default(false),
  upiDetails:boolean("upi_details").default(false),
  serviceCategory:varchar("service_category"),
  salesPerson:varchar("sales_person")
});

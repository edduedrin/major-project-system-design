import { boolean, integer, numeric, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { genderEnum } from "./user-model";

export const tiersEnum = pgEnum("tiers_enum", [
    "Gold",
    "Silver",
    "Platinum"
]);

export const languagesEnum = pgEnum("language_enum", [
    "English",
    "Kannada"
]);

export const MechanicModel = pgTable("tbl_mechanics", {
    mechanicId: serial("mechanic_id").primaryKey(),
    userId: integer("user_id").unique().notNull(),
    workshopName: varchar("workshop_name", { length: 255 }),
    gender: genderEnum("gender"),
    age: integer("age"),
    dob: varchar("dob", { length: 15 }),
    // currentAddress: varchar("current_address", { length: 255 }),
    // workshopAddress: varchar("workshop_address", { length: 255 }),
    // currentCity: varchar("current_city", { length: 50 }),
    // currentDistrict: varchar("current_district", { length: 50 }),
    // currentPincode: integer("current_pincode"),
    // currentState: varchar("current_state", { length: 50 }),
    profileUrl: text("profile_url"),
    tier: tiersEnum("tier").notNull().default('Silver'),
    language: languagesEnum("language"),
    referralCode: varchar("referral_code", { length: 30 }),
    panNumber: text("pan_number"),// encrypted with string, no 10 digit restrict
    panFrontUrl: text("pan_front_url"),
    aadhaarNumber: text("aadhaar_number"),// encrypted with string, no 12 digit restrict
    maskedAadhaarNumber: varchar("masked_aadhaar_number", { length: 15 }),// encrypted with string, no 12 digit restrict
    aadhaarProfileUrl: text("aadhaar_profile_url"),
    aadhaarFrontUrl: text("aadhaar_front_url"),
    aadhaarBackUrl: text("aadhaar_back_url"),

    earnedPoints: numeric("earned_points", { precision: 18, scale: 2 }).default("0.00").notNull(),
    redeemedPoints: numeric("redeemed_points", { precision: 18, scale: 2 }).default("0.00").notNull(),
    balancePoints: numeric("balance_points", { precision: 18, scale: 2 }).default("0.00").notNull(),
    redeemablePoints: numeric("redeemable_points", { precision: 18, scale: 2 }).default("0.00").notNull(),

    previousYearEarnedPoints: numeric("previous_year_earned_points", { precision: 18, scale: 2 }).default("0.00").notNull(),
    currentYearEarnedPoints: numeric("current_year_earned_points", { precision: 18, scale: 2 }).default("0.00").notNull(),

    scannedPoints: numeric("scanned_points", { precision: 18, scale: 2 }).default("0.00").notNull(),
    bonusPoints: numeric("bonus_points", { precision: 18, scale: 2 }).default("0.00").notNull(),

    tdsKitty: numeric("tds_kitty", { precision: 18, scale: 2 }).default("0.00").notNull(),
    tdsDeducted: numeric("tds_deducted", { precision: 18, scale: 2 }).default("0.00").notNull(),

    tdsConsent: boolean("tds_consent").default(false).notNull(),
    tdsSlabs: numeric("tds_slab", { precision: 18, scale: 2 }).default("20.00").notNull(),
    tdsAadhaarLinkage: boolean("tds_aadhaar_linkage").default(false).notNull(),
    tdsPanVerification: boolean("tds_pan_verification").default(false).notNull(),
    tdsITRVerification: boolean("tds_itr_verification").default(false).notNull(),

    kycApproval: boolean("kyc_approval").default(false).notNull(),
    upiFlag: boolean("upi_flag").default(false).notNull(),
    bankDetailsFlag: boolean("bank_details_flag").default(false).notNull(),
    mappedRetailers: varchar("mapped_retailers"),
    kycComment: text("kyc_comment"),
});

import {
    pgTable,
    serial,
    integer,
    varchar,
    text,
    boolean,
    timestamp,
    numeric,
    jsonb,
} from "drizzle-orm/pg-core";

export const MemberModel = pgTable("members", {
    userId: integer("user_id").unique().notNull(),

    userName: varchar("user_name", { length: 255 }),
    userCode: varchar("user_code", { length: 100 }),
    userEmail: varchar("user_email", { length: 255 }),
    userMobile: varchar("user_mobile", { length: 20 }),
    displayName: varchar("display_name", { length: 255 }),

    userPassword: text("user_password"),
    pinHash: text("pin_hash"),
    fcmToken: text("fcm_token"),

    userStatus: varchar("user_status", { length: 50 }),

    workshopDetails: jsonb("workshop_details"),

    gender: varchar("gender", { length: 20 }),
    age: integer("age"),
    dob: timestamp("dob"),

    profileUrl: text("profile_url"),

    tier: varchar("tier", { length: 100 }),
    referralCode: varchar("referral_code", { length: 100 }),

    panNumber: varchar("pan_number", { length: 20 }),
    panFrontUrl: text("pan_front_url"),

    aadhaarNumber: varchar("aadhaar_number", { length: 20 }),
    maskedAadhaarNumber: varchar("masked_aadhaar_number", { length: 20 }),
    aadhaarProfileUrl: text("aadhaar_profile_url"),
    aadhaarFrontUrl: text("aadhaar_front_url"),
    aadhaarBackUrl: text("aadhaar_back_url"),

    earnedPoints: numeric("earned_points", { precision: 18, scale: 2 }),
    redeemedPoints: numeric("redeemed_points", { precision: 18, scale: 2 }),
    balancePoints: numeric("balance_points", { precision: 18, scale: 2 }),
    redeemablePoints: numeric("redeemable_points", { precision: 18, scale: 2 }),
    previousYearEarnedPoints: numeric("previous_year_earned_points", {
        precision: 18,
        scale: 2,
    }),
    currentYearEarnedPoints: numeric("current_year_earned_points", {
        precision: 18,
        scale: 2,
    }),
    scannedPoints: numeric("scanned_points", { precision: 18, scale: 2 }),
    bonusPoints: numeric("bonus_points", { precision: 18, scale: 2 }),

    tdsKitty: numeric("tds_kitty", { precision: 18, scale: 2 }),
    tdsDeducted: numeric("tds_deducted", { precision: 18, scale: 2 }),

    tdsConsent: boolean("tds_consent"),
    tdsSlabs: jsonb("tds_slabs"),
    tdsAadhaarLinkage: boolean("tds_aadhaar_linkage"),
    tdsPanVerification: boolean("tds_pan_verification"),
    tdsITRVerification: boolean("tds_itr_verification"),

    kycApproval: boolean("kyc_approval"),

    upiFlag: boolean("upi_flag"),
    bankDetailsFlag: boolean("bank_details_flag"),

    lastLoginAt: timestamp("last_login_at"),
    lastLogoutAt: timestamp("last_logout_at"),
    firstLoginAt: timestamp("first_login_at"),

    createdAt: timestamp("created_at").defaultNow(),
    createdBy: integer("created_by"),
});

export type UserTableType = typeof MemberModel.$inferSelect;
export type UserTableNewUserType = typeof MemberModel.$inferInsert;
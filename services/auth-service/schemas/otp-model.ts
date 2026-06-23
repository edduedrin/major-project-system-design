import {
    integer,
    varchar,
    boolean,
    pgTable,
    serial,
    timestamp,
    pgEnum,
} from "drizzle-orm/pg-core";

// ✅ Define enum
export const otpTypeEnum = pgEnum("otp_type_enum", ["forgot-password"]);

export const OtpModel = pgTable("tbl_otps", {
    otpId: serial("otp_id").primaryKey(),
    otp: varchar("otp", { length: 255 }).notNull(),
    userId: integer("user_id").notNull(),
    otpAttempt: integer("otp_attempt").notNull().default(3),
    isVerified: boolean("is_verified").notNull().default(false),
    expiryAt: timestamp("expiry_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    otpType: otpTypeEnum("otp_type").notNull().default("forgot-password"),
});

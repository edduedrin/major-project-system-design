import { timestamp, pgTable, serial, varchar, boolean, integer, numeric } from "drizzle-orm/pg-core";

export const ReferralModel = pgTable("tbl_referrals", {
    referralId: serial("referral_id").primaryKey(),
    referralCode: varchar("referral_code", { length: 15 }).notNull(),
    referrerUserId: integer("referrer_user_id").notNull(),
    referrerPoints: numeric("referrer_points", { precision: 18, scale: 2 }).default("0.00").notNull(),
    refereeUserId: integer("referee_user_id").notNull(),
    refereePoints: numeric("referee_points", { precision: 18, scale: 2 }).default("0.00").notNull(),
    isClaimed: boolean("is_claimed").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    isActive: boolean("is_active").notNull().default(true),
});

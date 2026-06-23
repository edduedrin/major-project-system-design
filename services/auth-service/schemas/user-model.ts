import {
  integer,
  varchar,
  timestamp,
  pgTable,
  serial,
  text,
  pgEnum
} from "drizzle-orm/pg-core";

export const blockLevelEnum = pgEnum("block_level_enum", [
  "none",
  "digilocker",
  "kyc",
  "incomplete-registration",
  "kyc-admin",
  "login",
  "scan",
  "redeem",
  "inactive",
  "dormant",
  "de-activated",
  "tds-consent"
]);

export const genderEnum = pgEnum("gender_enum", [
  "Male",
  "Female",
  "Others",
]);


export const UserModel = pgTable("tbl_users", {
  userId: serial("user_id").primaryKey(),
  userName: varchar("user_name", { length: 255 }).notNull(),
  userCode: varchar("user_code", { length: 255 }),
  userEmail: varchar("user_email", { length: 255 }),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  userPassword: text("user_password"),
  pinHash: varchar("pin_hash", { length: 255 }),
  userMobile: varchar("user_mobile", { length: 10 }).notNull().unique(),
  userRole: integer("user_role").notNull(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  lastLogoutAt: timestamp("last_logout_at", { withTimezone: true }),
  fcmToken: varchar("fcm_token", { length: 255 }),
  blockStatus: blockLevelEnum("block_status").default('digilocker').notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: integer("created_by"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  updatedBy: integer("updated_by"),
});

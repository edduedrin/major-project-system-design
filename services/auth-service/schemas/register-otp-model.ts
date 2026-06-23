import { pgTable, serial, varchar, timestamp, boolean } from "drizzle-orm/pg-core";

export const RegisterOtpModel = pgTable("tbl_register_otps", {
    id: serial("id").primaryKey(),
    mobile: varchar("mobile", { length: 15 }).notNull(), // or email if your flow needs it
    otpCode: varchar("otp_code", { length: 6 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    isUsed: boolean("is_used").default(false).notNull(),
});

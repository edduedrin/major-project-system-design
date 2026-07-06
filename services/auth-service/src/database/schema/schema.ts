import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const usersAuth = pgTable('users_auth', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).unique(),
  mobile: varchar('mobile', { length: 15 }).unique(),
  passwordHash: text('password_hash'),
  pinHash: text('pin_hash'),
  status: varchar('status', { length: 30 }).default('PENDING').notNull(),
  mobileVerified: boolean('mobile_verified').default(false).notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  lastLoginAt: timestamp('last_login_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const otpVerification = pgTable('otp_verification', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => usersAuth.id, { onDelete: 'cascade' })
    .notNull(),
  mobile: varchar('mobile', { length: 15 }).notNull(),
  otp: varchar('otp', { length: 10 }).notNull(),
  purpose: varchar('purpose', { length: 30 }).notNull(),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  verified: boolean('verified').default(false).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const userSessions = pgTable('user_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => usersAuth.id, { onDelete: 'cascade' })
    .notNull(),
  refreshToken: text('refresh_token').notNull(),
  deviceId: varchar('device_id', { length: 255 }),
  deviceType: varchar('device_type', { length: 50 }),
  fcmToken: text('fcm_token'),
  ipAddress: varchar('ip_address', { length: 100 }),
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

// Relationships
export const usersAuthRelations = relations(usersAuth, ({ many }) => ({
  otps: many(otpVerification),
  sessions: many(userSessions),
}));

export const otpVerificationRelations = relations(otpVerification, ({ one }) => ({
  user: one(usersAuth, {
    fields: [otpVerification.userId],
    references: [usersAuth.id],
  }),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(usersAuth, {
    fields: [userSessions.userId],
    references: [usersAuth.id],
  }),
}));

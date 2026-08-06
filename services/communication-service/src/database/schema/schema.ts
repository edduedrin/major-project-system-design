import { pgTable, uuid, varchar, text, boolean, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';

export const queueLogs = pgTable('queue_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: varchar('event_id', { length: 255 }),
  queueName: varchar('queue_name', { length: 255 }),
  exchangeName: varchar('exchange_name', { length: 255 }),
  routingKey: varchar('routing_key', { length: 255 }),
  notificationType: varchar('notification_type', { length: 50 }),
  payload: jsonb('payload'),
  status: varchar('status', { length: 50 }).default('Queued').notNull(),
  retryCount: integer('retry_count').default(0).notNull(),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at', { mode: 'date' }),
  completedAt: timestamp('completed_at', { mode: 'date' }),
  processingTime: integer('processing_time'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const notificationLogs = pgTable('notification_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  recipientId: varchar('recipient_id', { length: 255 }),
  notificationType: varchar('notification_type', { length: 50 }).notNull(),
  provider: varchar('provider', { length: 50 }),
  title: varchar('title', { length: 255 }),
  subject: varchar('subject', { length: 255 }),
  message: text('message'),
  payload: jsonb('payload'),
  status: varchar('status', { length: 50 }).notNull(),
  providerMessageId: varchar('provider_message_id', { length: 255 }),
  errorMessage: text('error_message'),
  sentAt: timestamp('sent_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const emailTemplates = pgTable('email_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  templateName: varchar('template_name', { length: 100 }).unique().notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  htmlBody: text('html_body').notNull(),
  textBody: text('text_body'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const deviceTokens = pgTable('device_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  deviceToken: text('device_token').unique().notNull(),
  platform: varchar('platform', { length: 50 }).default('android').notNull(),
  appVersion: varchar('app_version', { length: 50 }),
  isActive: boolean('is_active').default(true).notNull(),
  lastUsedAt: timestamp('last_used_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

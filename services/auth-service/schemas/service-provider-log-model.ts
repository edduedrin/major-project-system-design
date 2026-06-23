import { integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

export const ServiceProviderLogModel = pgTable('tbl_service_provider_logs', {
  logId: serial('log_id').primaryKey(), // Primary key
  url: varchar('url'), // URL of the request
  request: varchar('request'), // Request details
  response: varchar('response'), // Response details
  createdAt: timestamp("created_at", { withTimezone: true }), // Creation timestamp (consider changing to date)
  createdBy: integer('created_by').default(0), // User who created the log
});

// change request and response to jsonb
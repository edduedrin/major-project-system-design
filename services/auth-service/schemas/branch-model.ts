import { pgTable, serial, varchar, boolean, timestamp, integer } from 'drizzle-orm/pg-core';

// Define the tbl_branches table schema
export const BranchModel = pgTable('tbl_branches', {
    branchId: serial('branch_id').primaryKey(),  // Auto-increment primary key
    branchCode: integer('branch_code').notNull(),  // Auto-increment primary key
    zoneId:integer('zone_id').notNull(),
    branchName: varchar('branch_name', { length: 255 }).notNull(),  // Branch name
    branchDescription: varchar('branch_description', { length: 500 }),  // Branch description
    createdAt: timestamp('created_at').defaultNow().notNull(),  // Created at timestamp with default current time
    isActive: boolean('is_active').notNull().default(true),  // Is active flag
});

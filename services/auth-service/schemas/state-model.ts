import { pgTable, serial, varchar, boolean } from 'drizzle-orm/pg-core';

// Define the tbl_states table schema
export const StateModel = pgTable('tbl_states', {
    stateId: serial('state_id').primaryKey(),  // Auto-increment primary key
    stateName: varchar('state_name', { length: 255 }).notNull(),  // State name as varchar
    stateCode:varchar('state_code').notNull(),
    isActive: boolean('is_active').notNull().default(true), // Is active flag
});
import { pgTable, serial, varchar } from 'drizzle-orm/pg-core';

export const workshop = pgTable('tbl_workshop', {
  workshopId: serial('workshop_id').primaryKey(),
  workshopName: varchar('workshop_name', { length: 255 })
});
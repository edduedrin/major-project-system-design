import { pgTable, serial, integer, boolean } from 'drizzle-orm/pg-core';
import { workshop } from './workshop-model';

export const RetailerMappingModel = pgTable('tbl_retailer_mapping', {
  mappingId: serial('mapping_id').primaryKey(),
  workshopId: integer('workshop_id'),
  purchasingRetailerId: integer('purchasing_retailer_id').notNull(),
  createdBy: integer('created_by').notNull(),
  isActive: boolean('is_active').default(true),
});
import { pgTable, serial, varchar, boolean, timestamp, integer } from 'drizzle-orm/pg-core';
import { CategoryModel } from './';  // Reference to tbl_categories

// Define the tbl_sub_categories table schema
export const SubCategoryModel = pgTable('tbl_sub_categories', {
    subCategoryId: serial('sub_category_id').primaryKey(),  // Auto-increment primary key
    categoryId: integer('category_id').notNull(),//references(() => CategoryModel.categoryId).notNull(),  // Foreign key to tbl_categories
    subCategoryName: varchar('sub_category_name', { length: 255 }).notNull(),  // Subcategory name
    subCategoryDescription: varchar('sub_category_description', { length: 255 }),  // Description of the subcategory
    isActive: boolean('is_active').notNull().default(true),  // Active status flag
    createdAt: timestamp('created_at').notNull().defaultNow(),  // Creation date
    fileUrl: varchar('file_url', { length: 255 })  // File URL for subcategory image or document
});
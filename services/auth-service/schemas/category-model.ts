import { pgTable, serial, varchar, boolean, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

// Define the tbl_categories table schema
export const CategoryModel = pgTable(
  'tbl_categories',
  {
    categoryId: serial('category_id').primaryKey(), // Auto-increment primary key
    categoryName: varchar('category_name', { length: 255 }).notNull(), // Category name
    categoryDescription: varchar('category_description', { length: 255 }), // Description of the category
    categoryShortCode: varchar('category_short_code', { length: 50 }).notNull(), // Unique short code
    isActive: boolean('is_active').notNull().default(true), // Active status flag
    createdAt: timestamp('created_at').notNull().defaultNow(), // Creation date
    fileUrl: varchar('file_url', { length: 255 }) // File URL for category image or document
  },
  (table) => {
    return {
      categoryShortCodeUnique: uniqueIndex('uq_category_short_code').on(table.categoryShortCode),
    };
  }
);

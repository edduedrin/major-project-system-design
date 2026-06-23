import { pgTable, serial, text, boolean, timestamp, pgEnum, varchar } from 'drizzle-orm/pg-core';

export const AssetModel = pgTable('tbl_assets', {
    assetId: serial('asset_id').primaryKey(),
    assetType: varchar('asset_type', { length: 50 }).notNull(),
    assetUrl: text('asset_url'),
    staticAssetUrl: text('static_asset_url'),
    assetTitle: text('asset_title'),
    assetDescription: text('asset_description'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});

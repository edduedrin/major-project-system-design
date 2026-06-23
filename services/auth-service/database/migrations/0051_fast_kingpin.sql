CREATE TABLE IF NOT EXISTS "tbl_shock_replacement_skus" (
	"id" numeric(10, 0) PRIMARY KEY NOT NULL,
	"sku_code" numeric(10, 0),
	"sku_name" varchar(100),
	"created_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true,
	"created_by" text
);

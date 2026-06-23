CREATE TABLE IF NOT EXISTS "tbl_selected_shock_replacement" (
	"id" numeric(10, 0) PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"sku_code" numeric(10, 0) NOT NULL,
	"sku_name" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" text
);

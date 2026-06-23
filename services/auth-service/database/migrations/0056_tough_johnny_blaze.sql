CREATE TABLE IF NOT EXISTS "tbl_selected_shock_replacement" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"sku_code" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"sku_name" text,
	"created_at" timestamp DEFAULT now(),
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_shock_replacement_skus" (
	"id" numeric(10, 0) PRIMARY KEY NOT NULL,
	"sku_code" text,
	"sku_name" varchar(100),
	"created_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true,
	"created_by" text
);

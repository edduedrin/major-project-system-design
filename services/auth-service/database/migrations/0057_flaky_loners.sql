CREATE TABLE IF NOT EXISTS "tbl_purchasing_retailers" (
	"retailer_id" serial PRIMARY KEY NOT NULL,
	"shop_name" varchar(150) NOT NULL,
	"address" varchar(255) NOT NULL,
	"mobile" varchar(10) NOT NULL,
	CONSTRAINT "tbl_purchasing_retailers_mobile_unique" UNIQUE("mobile")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_retailer_mapping" (
	"mapping_id" serial PRIMARY KEY NOT NULL,
	"workshop_id" integer NOT NULL,
	"purchasing_retailer_id" integer NOT NULL,
	"created_by" integer NOT NULL,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
ALTER TABLE "tbl_selected_shock_replacement" ALTER COLUMN "user_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "tbl_selected_shock_replacement" ALTER COLUMN "created_by" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "tbl_shock_replacement_skus" ALTER COLUMN "created_by" SET DATA TYPE integer;
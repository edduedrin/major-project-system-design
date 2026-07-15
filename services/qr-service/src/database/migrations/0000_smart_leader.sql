CREATE TABLE "product_unique_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"serial_number" varchar(100) NOT NULL,
	"product_id" varchar(255),
	"product_name" varchar(255),
	"status" varchar(50) DEFAULT 'GENERATED' NOT NULL,
	"scanned_count" integer DEFAULT 0 NOT NULL,
	"last_scanned_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_unique_codes_serial_number_unique" UNIQUE("serial_number")
);
--> statement-breakpoint
CREATE TABLE "qr_scan_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code_id" uuid NOT NULL,
	"scanned_at" timestamp DEFAULT now() NOT NULL,
	"scan_method" varchar(50) NOT NULL,
	"ip_address" varchar(100),
	"user_agent" varchar(255),
	"latitude" varchar(50),
	"longitude" varchar(50)
);
--> statement-breakpoint
ALTER TABLE "qr_scan_history" ADD CONSTRAINT "qr_scan_history_code_id_product_unique_codes_id_fk" FOREIGN KEY ("code_id") REFERENCES "public"."product_unique_codes"("id") ON DELETE cascade ON UPDATE no action;
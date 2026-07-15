CREATE TABLE "qr_generation_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" varchar(255),
	"product_name" varchar(255),
	"quantity" integer NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"error" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

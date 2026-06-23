CREATE TYPE "public"."account_type_enum" AS ENUM('Savings', 'Current');--> statement-breakpoint
CREATE TYPE "public"."activity_type_enum" AS ENUM('login', 'logout');--> statement-breakpoint
CREATE TYPE "public"."department" AS ENUM('IT', 'Sales', 'Operations', 'Marketing', 'Finance');--> statement-breakpoint
CREATE TYPE "public"."amazon_delivery_status_enum" AS ENUM('Order Placed', 'Shipping', 'Delivered', 'Pending');--> statement-breakpoint
CREATE TYPE "public"."amazon_ticket_status_enum" AS ENUM('Pending', 'Resolved', 'Cancelled');--> statement-breakpoint
CREATE TYPE "public"."campaign_recurrence" AS ENUM('HOURLY', 'DAILY', 'WEEKLY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('ACTIVE', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."earn_type_enum" AS ENUM('scan', 'register', 'referral');--> statement-breakpoint
CREATE TYPE "public"."block_level_enum" AS ENUM('none', 'digilocker', 'kyc', 'incomplete-registration', 'kyc-admin', 'login', 'scan', 'redeem', 'inactive', 'dormant', 'de-activated', 'tds-consent');--> statement-breakpoint
CREATE TYPE "public"."gender_enum" AS ENUM('Male', 'Female', 'Others');--> statement-breakpoint
CREATE TYPE "public"."redemption_mode_enum" AS ENUM('UPI', 'Bank Transfer', 'Market Products');--> statement-breakpoint
CREATE TYPE "public"."redemption_status_enum" AS ENUM('Pending', 'Approved', 'Rejected', 'Processing', 'Completed', 'Failed');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('REGULAR', 'SCHEDULED', 'CAMPAIGN');--> statement-breakpoint
CREATE TYPE "public"."survey_answer_type" AS ENUM('radio', 'checkbox');--> statement-breakpoint
CREATE TYPE "public"."kyc_doc_status_enum" AS ENUM('Pending', 'Approved', 'Rejected', 'Completed');--> statement-breakpoint
CREATE TYPE "public"."kyc_type_enum" AS ENUM('aadhaar-front', 'aadhaar-back', 'pan-number', 'pan-front', 'preferred-retailers', 'in-person-verification');--> statement-breakpoint
CREATE TYPE "public"."language_enum" AS ENUM('English', 'Kannada');--> statement-breakpoint
CREATE TYPE "public"."tiers_enum" AS ENUM('Gold', 'Silver', 'Platinum');--> statement-breakpoint
CREATE TYPE "public"."notification_log_status" AS ENUM('SENT', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('PENDING', 'PROCESSING', 'FANNED_OUT', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."otp_type_enum" AS ENUM('forgot-password');--> statement-breakpoint
CREATE TYPE "public"."transaction_action" AS ENUM('QR_SCAN', 'REGISTRATION', 'REFERRAL', 'BANK_TRANSFER', 'UPI', 'VOUCHER', 'MARKETPLACE', 'REFUND', 'TDS_DEDUCTED', 'OTHERS');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('Earn', 'Redeem', 'TDS', 'Refund');--> statement-breakpoint
CREATE TYPE "public"."points_config_type_enum" AS ENUM('Registration', 'Referrer', 'Referee', 'Point-Conversion', 'TDS-threshold');--> statement-breakpoint
CREATE TYPE "public"."ticket_status_enum" AS ENUM('Pending', 'Resolved', 'Escalated');--> statement-breakpoint
CREATE TYPE "public"."transaction_status_enum" AS ENUM('Success', 'Failure');--> statement-breakpoint
CREATE TYPE "public"."voucher_order_item_status_enum" AS ENUM('CREATED', 'COMPLETED', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."voucher_order_status_enum" AS ENUM('CREATED', 'COMPLETED', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_bank_details" (
	"bank_detail_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"account_number" varchar(255),
	"account_ifsc" varchar(255),
	"account_type" "account_type_enum",
	"bank_name" varchar(255),
	"bank_branch" varchar(255),
	"account_holder_name" varchar(255),
	"upi_id" varchar(255),
	"cheque_url" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true,
	"cn_flag" boolean DEFAULT false,
	"upi_flag" boolean DEFAULT false,
	"bank_flag" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_activity_logs" (
	"log_id" serial PRIMARY KEY NOT NULL,
	"activity_type" "activity_type_enum" NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_address" (
	"address_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"current_address" varchar(255),
	"workshopAddress" varchar,
	"current_city" varchar NOT NULL,
	"current_district" varchar NOT NULL,
	"current_pincode" integer NOT NULL,
	"current_state" varchar NOT NULL,
	"zone_name" varchar(50),
	"branch_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_admins" (
	"admin_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"department" "department" NOT NULL,
	CONSTRAINT "tbl_admins_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_amazon_carts" (
	"cart_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amazon_market_product_id" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_amazon_market_addresses" (
	"address_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"pincode" varchar(20) NOT NULL,
	"address_label" varchar(255),
	"address_line1" varchar(255) NOT NULL,
	"address_line2" varchar(255),
	"city" varchar(100),
	"state" varchar(100),
	"country" varchar(100) DEFAULT 'India' NOT NULL,
	"latitude" numeric,
	"longitude" numeric,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_amazon_market_order_items" (
	"order_item_id" serial PRIMARY KEY NOT NULL,
	"redemption_id" integer NOT NULL,
	"amazon_product_id" integer NOT NULL,
	"product_value" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"delivery_status" "amazon_delivery_status_enum" DEFAULT 'Order Placed' NOT NULL,
	"points" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"dispatched_at" timestamp with time zone,
	"delivered_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_amazon_market_products" (
	"product_id" serial PRIMARY KEY NOT NULL,
	"amazon_category" varchar,
	"amazon_category_url" varchar,
	"amazon_static_category_url" varchar,
	"amazon_sub_category" varchar,
	"amazon_sub_category_url" varchar,
	"amazon_static_sub_category_url" varchar,
	"amazon_asin_sku" varchar NOT NULL,
	"amazon_product_url" varchar,
	"amazon_static_product_url" varchar,
	"amazon_product_name" varchar,
	"amazon_model_no" varchar,
	"amazon_product_description" text,
	"amazon_mrp" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"amazon_inventory_count" integer DEFAULT 0 NOT NULL,
	"amazon_csp_price" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"amazon_discounted_price" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"amazon_points" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"amazon_diff" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"amazon_url" text,
	"amazon_comments_vendor" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" varchar NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_amazon_tickets" (
	"ticket_id" serial PRIMARY KEY NOT NULL,
	"ticket_type_id" integer,
	"order_id" integer,
	"user_id" integer,
	"product_id" integer,
	"reason" varchar,
	"request_type" varchar(20),
	"status" "amazon_ticket_status_enum" DEFAULT 'Pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_amazon_wishlist" (
	"wishlist_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amazon_market_product_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_assets" (
	"asset_id" serial PRIMARY KEY NOT NULL,
	"asset_type" varchar(50) NOT NULL,
	"asset_url" text,
	"static_asset_url" text,
	"asset_title" text,
	"asset_description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_branches" (
	"branch_id" serial PRIMARY KEY NOT NULL,
	"branch_code" integer NOT NULL,
	"zone_id" integer NOT NULL,
	"branch_name" varchar(255) NOT NULL,
	"branch_description" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_campaign" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"scheduled_time" varchar(10),
	"recurrence" "campaign_recurrence" NOT NULL,
	"status" "campaign_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_categories" (
	"category_id" serial PRIMARY KEY NOT NULL,
	"category_name" varchar(255) NOT NULL,
	"category_description" varchar(255),
	"category_short_code" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"file_url" varchar(255)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_cities" (
	"city_id" serial PRIMARY KEY NOT NULL,
	"city_name" varchar(255) NOT NULL,
	"district_id" integer NOT NULL,
	"state_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_dealers" (
	"dealer_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"language" varchar(20) DEFAULT 'English',
	"gender" "gender_enum",
	"dob" timestamp with time zone,
	"firm_name" varchar(100),
	"alternate_mobile" varchar(15),
	"whatsapp_mobile" varchar(15),
	"marital_status" integer,
	"annual_income" varchar(20),
	"aadhaar_number" varchar(12),
	"pan_number" varchar(255),
	"soft_delete" boolean DEFAULT false,
	"soft_delete_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now(),
	"updated_by" integer,
	"profile_url" varchar(255),
	"aadhaar_front_url" varchar(255),
	"aadhaar_back_url" varchar(255),
	"pan_url" varchar(255),
	"gst_url" varchar(255),
	"earned_points" numeric(18, 2) DEFAULT '0.00',
	"redeemed_points" numeric(18, 2) DEFAULT '0.00',
	"balance_points" numeric(18, 2) DEFAULT '0.00',
	"bonus_points" numeric(18, 2) DEFAULT '0.00',
	"tds_slabs" varchar DEFAULT '20%',
	"tds_consent" boolean DEFAULT false,
	"gst_number" varchar(15),
	"gss_user_code" varchar(20),
	"onboarded_at" timestamp with time zone,
	"segment" varchar(50),
	"bank_details" boolean DEFAULT false,
	"upi_details" boolean DEFAULT false,
	"service_category" varchar,
	"sales_person" varchar
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_digilocker_sessions" (
	"digilocker_session_id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(100) NOT NULL,
	"user_id" integer NOT NULL,
	"redirection_url" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_districts" (
	"district_id" serial PRIMARY KEY NOT NULL,
	"district_name" varchar(30) NOT NULL,
	"state_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_faqs" (
	"faq_id" serial PRIMARY KEY NOT NULL,
	"faq_question" text NOT NULL,
	"faq_answer" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_bank_transfer_redemptions" (
	"bank_transfer_redemption_id" serial PRIMARY KEY NOT NULL,
	"redemption_id" integer NOT NULL,
	"account_number" varchar(255),
	"ifsc" varchar(255),
	"bank_name" varchar,
	"bank_branch" varchar,
	"account_holder_name" varchar,
	"account_account" varchar,
	"vendor_request" varchar,
	"vendor_response" varchar
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_inventory_batch" (
	"batch_id" serial PRIMARY KEY NOT NULL,
	"sku_code" varchar(255) NOT NULL,
	"quantity" integer NOT NULL,
	"file_url" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_inventory" (
	"inventory_id" serial PRIMARY KEY NOT NULL,
	"serial_number" varchar(255) NOT NULL,
	"batch_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_qr_scanned" boolean DEFAULT false NOT NULL,
	CONSTRAINT "tbl_inventory_serial_number_unique" UNIQUE("serial_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_mechanics" (
	"mechanic_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"workshop_name" varchar(255),
	"gender" "gender_enum",
	"age" integer,
	"dob" varchar(15),
	"profile_url" text,
	"tier" "tiers_enum" DEFAULT 'Silver' NOT NULL,
	"language" "language_enum",
	"referral_code" varchar(30),
	"pan_number" text,
	"pan_front_url" text,
	"aadhaar_number" text,
	"masked_aadhaar_number" varchar(15),
	"aadhaar_profile_url" text,
	"aadhaar_front_url" text,
	"aadhaar_back_url" text,
	"earned_points" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"redeemed_points" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"balance_points" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"redeemable_points" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"previous_year_earned_points" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"current_year_earned_points" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"scanned_points" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"bonus_points" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"tds_kitty" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"tds_deducted" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"tds_consent" boolean DEFAULT false NOT NULL,
	"tds_slab" numeric(18, 2) DEFAULT '20.00' NOT NULL,
	"tds_aadhaar_linkage" boolean DEFAULT false NOT NULL,
	"tds_pan_verification" boolean DEFAULT false NOT NULL,
	"tds_itr_verification" boolean DEFAULT false NOT NULL,
	"kyc_approval" boolean DEFAULT false NOT NULL,
	"upi_flag" boolean DEFAULT false NOT NULL,
	"bank_details_flag" boolean DEFAULT false NOT NULL,
	"mapped_retailers" varchar,
	"kyc_comment" text,
	CONSTRAINT "tbl_mechanics_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_notification_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"notification_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"status" "notification_log_status" NOT NULL,
	"failure_reason" text,
	"scheduled_at" timestamp with time zone,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"image_url" varchar(500),
	"redirection_link" varchar(500),
	"role_filter" integer[],
	"state_filter" varchar(255)[],
	"district_filter" varchar(255)[],
	"city_filter" varchar(255)[],
	"pincode_filter" integer[],
	"block_status_filter" varchar(50)[],
	"status" "notification_status" DEFAULT 'PENDING' NOT NULL,
	"type" "notification_type" DEFAULT 'REGULAR' NOT NULL,
	"campaign_id" integer,
	"sent_count" integer DEFAULT 0,
	"failure_count" integer DEFAULT 0,
	"total_users" integer DEFAULT 0,
	"scheduled_at" timestamp with time zone,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_otps" (
	"otp_id" serial PRIMARY KEY NOT NULL,
	"otp" varchar(255) NOT NULL,
	"user_id" integer NOT NULL,
	"otp_attempt" integer DEFAULT 3 NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"expiry_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"otp_type" "otp_type_enum" DEFAULT 'forgot-password' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_passbook_audits" (
	"audit_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" "transaction_type" NOT NULL,
	"action" "transaction_action" NOT NULL,
	"reference_id" varchar(255),
	"amount" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"opening_balance" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"closing_balance" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"meta" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_pincodes" (
	"pincode_id" serial PRIMARY KEY NOT NULL,
	"pincode" integer NOT NULL,
	"city_name" varchar(50) NOT NULL,
	"district_name" varchar(50) NOT NULL,
	"state_name" varchar(50) NOT NULL,
	"zone_name" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_point_configurations" (
	"point_id" serial PRIMARY KEY NOT NULL,
	"config_type" "points_config_type_enum" NOT NULL,
	"points" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_random_keys" (
	"random_key_id" serial PRIMARY KEY NOT NULL,
	"random_key" varchar(255) NOT NULL,
	"status" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tbl_random_keys_random_key_unique" UNIQUE("random_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_redemptions" (
	"redemption_id" serial PRIMARY KEY NOT NULL,
	"redemption_ref" varchar NOT NULL,
	"user_id" integer NOT NULL,
	"total_unit" integer DEFAULT 1 NOT NULL,
	"points" numeric(18, 2) DEFAULT '0.00',
	"redemption_status" "redemption_status_enum" DEFAULT 'Pending',
	"redemption_message" varchar(255),
	"ip_address" varchar(20),
	"source" varchar(10),
	"redemption_mode" "redemption_mode_enum" NOT NULL,
	"order_address" jsonb,
	"longitude" varchar(255),
	"latitude" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"processed_at" timestamp,
	"created_by" integer NOT NULL,
	"processed_by" integer,
	"comments" varchar,
	"razorpay_meta_data" jsonb,
	"webhook_meta_data" jsonb,
	"last_webhook_processed_at" timestamp,
	CONSTRAINT "tbl_redemptions_redemption_ref_unique" UNIQUE("redemption_ref")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_retailers" (
	"retailer_id" serial PRIMARY KEY NOT NULL,
	"store_name" varchar(255) NOT NULL,
	"retailer_name" varchar(255) NOT NULL,
	"mobile_number" varchar(10) NOT NULL,
	"current_address" varchar(255),
	"current_pincode" integer NOT NULL,
	"state_name" varchar(255),
	"district_name" varchar(255),
	"city_name" varchar(255),
	"timings" varchar(255) DEFAULT '9 am to 9pm' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tbl_retailers_mobile_number_unique" UNIQUE("mobile_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_roles" (
	"role_id" serial PRIMARY KEY NOT NULL,
	"role_name" varchar(255),
	"role_description" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"is_active" boolean
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_service_provider_logs" (
	"log_id" serial PRIMARY KEY NOT NULL,
	"url" varchar,
	"request" varchar,
	"response" varchar,
	"created_at" timestamp with time zone,
	"created_by" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_sku_masters" (
	"sku_id" serial PRIMARY KEY NOT NULL,
	"sku_name" varchar(255) NOT NULL,
	"sku_code" varchar(50) NOT NULL,
	"sku_description" varchar(255) NOT NULL,
	"product_value" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"points" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"sub_category_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	"branch_id" integer[],
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_states" (
	"state_id" serial PRIMARY KEY NOT NULL,
	"state_name" varchar(255) NOT NULL,
	"state_code" varchar NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_sub_categories" (
	"sub_category_id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"sub_category_name" varchar(255) NOT NULL,
	"sub_category_description" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"file_url" varchar(255)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_sub_roles" (
	"sub_role_id" serial PRIMARY KEY NOT NULL,
	"sub_role_name" varchar(50),
	"sub_role_description" varchar(100),
	"role_id" integer NOT NULL,
	"created_at" timestamp with time zone,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_survey_options" (
	"option_id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"option_text" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_survey_questions" (
	"question_id" serial PRIMARY KEY NOT NULL,
	"question_text" text NOT NULL,
	"answer_type" "survey_answer_type" NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_survey_response_details" (
	"detail_id" serial PRIMARY KEY NOT NULL,
	"response_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"option_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_survey_responses" (
	"response_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_tds_tracks" (
	"track_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"earned_points" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"tds_deducted" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"total_points" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"tds_slab" numeric(18, 2) DEFAULT '20.00' NOT NULL,
	"earn_type" "earn_type_enum" NOT NULL,
	"meta_data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_temp_logs" (
	"log_id" serial PRIMARY KEY NOT NULL,
	"url" varchar,
	"request" varchar,
	"response" varchar,
	"api_meta_data" varchar,
	"created_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_ticket_categories" (
	"ticket_id" serial PRIMARY KEY NOT NULL,
	"ticket_category" varchar(100),
	"ticket_description" varchar(255),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_tickets" (
	"ticket_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"ticket_ref" varchar,
	"ticket_list_id" integer NOT NULL,
	"description" text NOT NULL,
	"ticket_status" "ticket_status_enum" DEFAULT 'Pending' NOT NULL,
	"img_url" varchar(100),
	"resolved_comments" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer NOT NULL,
	"role_assigned" integer DEFAULT 3 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_ticket_trails" (
	"trail_id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer NOT NULL,
	"assigned_role" integer NOT NULL,
	"ticket_status" "ticket_status_enum" DEFAULT 'Pending' NOT NULL,
	"remarks" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_transactions" (
	"transaction_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"serial_number" varchar(100),
	"total_points" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"product_value" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"transaction_status" "transaction_status_enum" DEFAULT 'Failure' NOT NULL,
	"transaction_message" text,
	"sku_code" varchar(50),
	"base_scheme_points" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"multiplier" numeric(5, 2),
	"scheme_id" integer,
	"ip_address" varchar(50),
	"source" varchar(50),
	"longitude" varchar(50),
	"latitude" varchar(50),
	"created_at" timestamp DEFAULT now(),
	"created_by" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_upi_redemptions" (
	"upi_redemption_id" serial PRIMARY KEY NOT NULL,
	"redemption_id" integer NOT NULL,
	"upi_id" varchar(255),
	"vendor_request" varchar,
	"vendor_response" varchar
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_user_kyc_details" (
	"detail_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"kyc_type" "kyc_type_enum" NOT NULL,
	"kyc_doc" varchar NOT NULL,
	"doc_status" "kyc_doc_status_enum" DEFAULT 'Pending' NOT NULL,
	"regional_head_doc_status" "kyc_doc_status_enum" DEFAULT 'Pending' NOT NULL,
	"marketing_head_doc_status" "kyc_doc_status_enum" DEFAULT 'Pending' NOT NULL,
	"regional_head_comment" varchar,
	"marketing_head_comment" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"updated_by" integer,
	"marketing_head_updated_at" timestamp,
	"marketing_head_updated_by" integer,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_users" (
	"user_id" serial PRIMARY KEY NOT NULL,
	"user_name" varchar(255) NOT NULL,
	"user_code" varchar(255),
	"user_email" varchar(255),
	"display_name" varchar(255) NOT NULL,
	"user_password" text,
	"pin_hash" varchar(255),
	"user_mobile" varchar(10) NOT NULL,
	"user_role" integer NOT NULL,
	"last_login_at" timestamp with time zone,
	"last_logout_at" timestamp with time zone,
	"fcm_token" varchar(255),
	"block_status" "block_level_enum" DEFAULT 'digilocker' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" integer,
	"updated_at" timestamp with time zone DEFAULT now(),
	"updated_by" integer,
	CONSTRAINT "tbl_users_user_mobile_unique" UNIQUE("user_mobile")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_user_passbook_files" (
	"file_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"file_url" varchar(500) NOT NULL,
	"generated_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_referrals" (
	"referral_id" serial PRIMARY KEY NOT NULL,
	"referral_code" varchar(15) NOT NULL,
	"referrer_user_id" integer NOT NULL,
	"referrer_points" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"referee_user_id" integer NOT NULL,
	"referee_points" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"is_claimed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_register_otps" (
	"id" serial PRIMARY KEY NOT NULL,
	"mobile" varchar(15) NOT NULL,
	"otp_code" varchar(6) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "voucher_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" integer NOT NULL,
	"external_txn_id" varchar(50) NOT NULL,
	"voucher_name" varchar(255) NOT NULL,
	"rate" numeric(12, 2) NOT NULL,
	"quantity" integer NOT NULL,
	"item_status" "voucher_order_item_status_enum" NOT NULL,
	"txn_time" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "voucher_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(100) NOT NULL,
	"external_order_id" varchar(50) NOT NULL,
	"total_cart_value" numeric(12, 2) NOT NULL,
	"total_success_value" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"order_status" "voucher_order_status_enum" DEFAULT 'CREATED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tbl_workshop" (
	"workshop_id" serial PRIMARY KEY NOT NULL,
	"workshop_name" varchar(255)
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tbl_notification_logs" ADD CONSTRAINT "tbl_notification_logs_notification_id_tbl_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."tbl_notifications"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tbl_notification_logs" ADD CONSTRAINT "tbl_notification_logs_user_id_tbl_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tbl_users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tbl_notifications" ADD CONSTRAINT "tbl_notifications_campaign_id_tbl_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."tbl_campaign"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tbl_survey_options" ADD CONSTRAINT "tbl_survey_options_question_id_tbl_survey_questions_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."tbl_survey_questions"("question_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tbl_survey_response_details" ADD CONSTRAINT "tbl_survey_response_details_response_id_tbl_survey_responses_response_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."tbl_survey_responses"("response_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tbl_survey_response_details" ADD CONSTRAINT "tbl_survey_response_details_question_id_tbl_survey_questions_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."tbl_survey_questions"("question_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tbl_survey_response_details" ADD CONSTRAINT "tbl_survey_response_details_option_id_tbl_survey_options_option_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."tbl_survey_options"("option_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tbl_survey_responses" ADD CONSTRAINT "tbl_survey_responses_user_id_tbl_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tbl_users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "voucher_order_items" ADD CONSTRAINT "voucher_order_items_order_id_voucher_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."voucher_orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_category_short_code" ON "tbl_categories" USING btree ("category_short_code");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_notification_log_notification_user" ON "tbl_notification_logs" USING btree ("notification_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_order_items_order_txn" ON "voucher_order_items" USING btree ("order_id","external_txn_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_order_items_order_id" ON "voucher_order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_order_items_status" ON "voucher_order_items" USING btree ("item_status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_orders_external_order_id" ON "voucher_orders" USING btree ("external_order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_user_id" ON "voucher_orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_orders_created_at" ON "voucher_orders" USING btree ("created_at");
ALTER TABLE "tbl_selected_shock_replacement"
	ALTER COLUMN "user_id" TYPE integer USING NULLIF("user_id", '')::integer;
--> statement-breakpoint
ALTER TABLE "tbl_selected_shock_replacement"
	ALTER COLUMN "created_by" TYPE integer USING NULLIF("created_by", '')::integer;
--> statement-breakpoint
ALTER TABLE "tbl_shock_replacement_skus"
	ALTER COLUMN "created_by" TYPE integer USING NULLIF("created_by", '')::integer;

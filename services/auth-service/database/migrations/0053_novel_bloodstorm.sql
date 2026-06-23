ALTER TABLE "tbl_selected_shock_replacement"
	ALTER COLUMN "sku_code" TYPE text USING "sku_code"::text;
--> statement-breakpoint
ALTER TABLE "tbl_selected_shock_replacement"
	ADD COLUMN IF NOT EXISTS "quantity" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE "tbl_selected_shock_replacement"
	ALTER COLUMN "id" TYPE integer USING "id"::integer;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_class
		WHERE relname = 'tbl_selected_shock_replacement_id_seq'
	) THEN
		CREATE SEQUENCE tbl_selected_shock_replacement_id_seq OWNED BY tbl_selected_shock_replacement.id;
	END IF;
END
$$;
--> statement-breakpoint
SELECT setval(
	'tbl_selected_shock_replacement_id_seq',
	COALESCE((SELECT MAX(id) FROM tbl_selected_shock_replacement), 1),
	COALESCE((SELECT MAX(id) FROM tbl_selected_shock_replacement), 0) > 0
);
--> statement-breakpoint
ALTER TABLE "tbl_selected_shock_replacement"
	ALTER COLUMN "id" SET DEFAULT nextval('tbl_selected_shock_replacement_id_seq');

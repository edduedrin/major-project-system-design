ALTER TABLE "tbl_shock_replacement_skus"
	ALTER COLUMN "sku_code" TYPE text USING "sku_code"::text;

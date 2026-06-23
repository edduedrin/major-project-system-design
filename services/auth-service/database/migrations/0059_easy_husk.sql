-- DO $$ BEGIN
--  ALTER TABLE "tbl_retailer_mapping" ADD CONSTRAINT "tbl_retailer_mapping_workshop_id_tbl_workshop_workshop_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."tbl_workshop"("workshop_id") ON DELETE no action ON UPDATE no action;
-- EXCEPTION
--  WHEN duplicate_object THEN null;
-- END $$;

-- ALTER TABLE "tbl_retailer_mapping"
-- DROP CONSTRAINT IF EXISTS "tbl_retailer_mapping_workshop_id_tbl_workshop_workshop_id_fk";
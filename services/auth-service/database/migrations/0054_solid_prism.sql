WITH dedup AS (
	SELECT
		MIN(id) AS keep_id,
		user_id,
		sku_code,
		SUM(quantity) AS total_quantity
	FROM tbl_selected_shock_replacement
	GROUP BY user_id, sku_code
	HAVING COUNT(*) > 1
)
UPDATE tbl_selected_shock_replacement t
SET quantity = d.total_quantity
FROM dedup d
WHERE t.id = d.keep_id;
--> statement-breakpoint
DELETE FROM tbl_selected_shock_replacement t
USING (
	SELECT
		id,
		ROW_NUMBER() OVER (PARTITION BY user_id, sku_code ORDER BY id) AS rn
	FROM tbl_selected_shock_replacement
) x
WHERE t.id = x.id
	AND x.rn > 1;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_selected_shock_replacement_user_sku"
	ON "tbl_selected_shock_replacement" ("user_id", "sku_code");

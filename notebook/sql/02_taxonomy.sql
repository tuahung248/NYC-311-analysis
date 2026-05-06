-- 02_taxonomy.sql
-- Purpose: Load complaint taxonomy mapping and categorize cleaned 311 records.
-- Inputs: clean_311 table, codebook/category_mapping.csv
-- Output: category_map table, clean_311_categorized view

CREATE OR REPLACE TABLE category_map AS
SELECT
  trim(complaint_type_raw) AS complaint_type,
  operational_category
FROM read_csv_auto('codebook/category_mapping.csv', header = true);

CREATE OR REPLACE VIEW clean_311_categorized AS
SELECT
  c.*,
  coalesce(m.operational_category, 'OTHER') AS operational_category
FROM clean_311 c
LEFT JOIN category_map m USING (complaint_type);

-- 01_clean.sql
-- Purpose: Load cleaned parquet output from the notebook and apply final SQL-side filters.
-- Input: data/processed/311_clean_2022_2025.parquet
-- Output: clean_311 table

CREATE OR REPLACE TABLE clean_311 AS
SELECT *
FROM read_parquet('data/processed/311_clean_2022_2025.parquet')
WHERE created_ts BETWEEN TIMESTAMP '2022-01-01' AND TIMESTAMP '2025-12-31 23:59:59'
  AND (closed_ts IS NULL OR closed_ts >= created_ts);

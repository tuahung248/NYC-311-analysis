-- Purpose: Load cleaned parquet output from the notebook and apply final SQL-side filters.

CREATE OR REPLACE TABLE clean_311 AS
SELECT
  p.* EXCLUDE (resolution_minutes),
  CASE
    WHEN p.closed_ts IS NULL THEN NULL
    ELSE datediff('minute', p.created_ts, p.closed_ts)
  END AS resolution_minutes
FROM read_parquet('data/processed/311_clean_2022_2025.parquet')
AS p
WHERE created_ts BETWEEN TIMESTAMP '2022-01-01' AND TIMESTAMP '2025-12-31 23:59:59'
  AND (closed_ts IS NULL OR closed_ts >= created_ts)
QUALIFY ROW_NUMBER() OVER (
  PARTITION BY unique_key
  ORDER BY created_ts
) = 1;

-- 03_analysis.sql
-- Purpose: Build analysis-ready views for volume, agency benchmarking, and equity checks.
-- Inputs: clean_311_categorized view, data/reference/acs_zip_income_quartiles.csv
-- Outputs: vw_volume_by_category_borough_month, vw_agency_resolution_benchmark, vw_equity_borough_income_quartile

CREATE OR REPLACE VIEW vw_volume_by_category_borough_month AS
-- NOTE: under-reporting bias likely in low-income areas; attach caveat to all geographic charts in dashboard.
SELECT
  operational_category,
  borough,
  date_trunc('month', created_ts) AS created_month,
  open_data_channel_type,
  count(*) AS request_count
FROM clean_311_categorized
GROUP BY 1, 2, 3, 4;

CREATE OR REPLACE VIEW vw_agency_resolution_benchmark AS
SELECT
  agency,
  operational_category,
  count(*) FILTER (WHERE closed_ts IS NOT NULL) AS closed_request_count,
  median(resolution_minutes) FILTER (WHERE closed_ts IS NOT NULL) AS median_resolution_minutes,
  PERCENT_RANK() OVER (
    PARTITION BY operational_category
    ORDER BY median(resolution_minutes) FILTER (WHERE closed_ts IS NOT NULL)
  ) AS workload_normalized_resolution_rank
FROM clean_311_categorized
GROUP BY 1, 2;

CREATE OR REPLACE VIEW vw_equity_borough_income_quartile AS
-- NOTE: under-reporting bias likely in low-income areas; attach caveat to all geographic charts in dashboard.
WITH acs AS (
  SELECT
    zip_code::VARCHAR AS zip_code,
    income_quartile
  FROM read_csv_auto('data/reference/acs_zip_income_quartiles.csv', header = true)
)
SELECT
  c.borough,
  a.income_quartile,
  count(*) FILTER (WHERE c.closed_ts IS NOT NULL) AS closed_request_count,
  median(c.resolution_minutes) FILTER (WHERE c.closed_ts IS NOT NULL) AS median_resolution_minutes
FROM clean_311_categorized c
LEFT JOIN acs a
  ON left(coalesce(c.incident_zip, ''), 5) = a.zip_code
GROUP BY 1, 2;

-- Purpose: Run compact QA audits for row counts, nulls, duration sanity, and taxonomy coverage.

CREATE OR REPLACE VIEW qa_row_counts AS
SELECT 'clean_311' AS stage_name, count(*) AS row_count FROM clean_311
UNION ALL
SELECT 'clean_311_categorized' AS stage_name, count(*) AS row_count FROM clean_311_categorized;

CREATE OR REPLACE VIEW qa_descriptor_override_map_row_count AS
SELECT count(*) AS descriptor_override_row_count
FROM descriptor_override_map;

CREATE OR REPLACE VIEW qa_negative_duration AS
SELECT
  count(*) FILTER (WHERE closed_ts IS NOT NULL AND closed_ts < created_ts) AS negative_duration_count,
  count(*) FILTER (WHERE closed_ts IS NOT NULL) AS closed_request_count,
  CASE
    WHEN count(*) FILTER (WHERE closed_ts IS NOT NULL) = 0 THEN 0.0
    ELSE (
      count(*) FILTER (WHERE closed_ts IS NOT NULL AND closed_ts < created_ts)::DOUBLE
      / count(*) FILTER (WHERE closed_ts IS NOT NULL)::DOUBLE
    ) * 100
  END AS negative_duration_pct
FROM clean_311;

CREATE OR REPLACE VIEW qa_null_audit AS
SELECT
  count(*) FILTER (WHERE agency IS NULL OR trim(agency) = '') AS null_or_blank_agency,
  count(*) FILTER (WHERE complaint_type IS NULL OR trim(complaint_type) = '') AS null_or_blank_complaint_type,
  count(*) FILTER (WHERE borough IS NULL OR trim(borough) = '') AS null_or_blank_borough,
  count(*) FILTER (
    WHERE operational_category IS NULL OR trim(operational_category) = ''
  ) AS null_or_blank_operational_category
FROM clean_311_categorized;

CREATE OR REPLACE VIEW qa_unmapped_complaints AS
SELECT
  count(*) FILTER (WHERE operational_category = 'OTHER') AS unmapped_count,
  count(*) AS total_count,
  CASE
    WHEN count(*) = 0 THEN 0.0
    ELSE (
      count(*) FILTER (WHERE operational_category = 'OTHER')::DOUBLE
      / count(*)::DOUBLE
    ) * 100
  END AS unmapped_pct
FROM clean_311_categorized;

CREATE OR REPLACE VIEW qa_top20_unmapped_values AS
SELECT
  complaint_type,
  count(*) AS request_count
FROM clean_311_categorized
WHERE operational_category = 'OTHER'
GROUP BY 1
ORDER BY 2 DESC
LIMIT 20;

CREATE OR REPLACE VIEW qa_created_ts_coverage AS
SELECT
  min(created_ts) AS min_created_ts,
  max(created_ts) AS max_created_ts,
  list_sort(list(distinct year(created_ts))) AS created_years
FROM clean_311;

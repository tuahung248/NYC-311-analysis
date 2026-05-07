-- Purpose: Build analysis-ready views for volume, agency benchmarking, and equity checks.

CREATE OR REPLACE VIEW vw_volume_by_category_borough_month AS
SELECT
  operational_category,
  borough,
  date_trunc('month', created_ts) AS created_month,
  open_data_channel_type,
  count(*) AS request_count
FROM clean_311_categorized
GROUP BY 1, 2, 3, 4;

CREATE OR REPLACE VIEW vw_pareto_categories AS
WITH category_counts AS (
  SELECT
    operational_category,
    count(*) AS request_count
  FROM clean_311_categorized
  GROUP BY 1
),
totals AS (
  SELECT sum(request_count) AS total_requests FROM category_counts
)
SELECT
  c.operational_category,
  c.request_count,
  ROW_NUMBER() OVER (ORDER BY c.request_count DESC, c.operational_category) AS category_rank,
  CASE
    WHEN t.total_requests = 0 THEN 0.0
    ELSE (c.request_count::DOUBLE / t.total_requests::DOUBLE) * 100
  END AS pct_of_total,
  CASE
    WHEN t.total_requests = 0 THEN 0.0
    ELSE (
      sum(c.request_count) OVER (
        ORDER BY c.request_count DESC, c.operational_category
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
      )::DOUBLE / t.total_requests::DOUBLE
    ) * 100
  END AS cumulative_pct
FROM category_counts c
CROSS JOIN totals t;

CREATE OR REPLACE VIEW vw_agency_resolution_benchmark AS
WITH benchmark_base AS (
  SELECT
    agency,
    operational_category,
    count(*) FILTER (WHERE closed_ts IS NOT NULL) AS closed_request_count,
    median(resolution_minutes) FILTER (WHERE closed_ts IS NOT NULL) AS median_resolution_minutes
  FROM clean_311_categorized
  GROUP BY 1, 2
),
eligible_benchmark AS (
  SELECT
    agency,
    operational_category,
    PERCENT_RANK() OVER (
      PARTITION BY operational_category
      ORDER BY median_resolution_minutes
    ) AS workload_normalized_resolution_rank
  FROM benchmark_base
  WHERE closed_request_count >= 100
)
SELECT
  b.agency,
  b.operational_category,
  b.closed_request_count,
  b.median_resolution_minutes,
  (b.closed_request_count >= 100) AS meets_min_sample_threshold,
  e.workload_normalized_resolution_rank
FROM benchmark_base b
LEFT JOIN eligible_benchmark e
  ON b.agency = e.agency
 AND b.operational_category = e.operational_category;

CREATE OR REPLACE VIEW vw_equity_borough_income_quartile AS
SELECT
  c.borough,
  c.operational_category,
  coalesce(a.income_quartile::VARCHAR, 'UNKNOWN') AS income_quartile,
  count(*) FILTER (WHERE c.closed_ts IS NOT NULL) AS closed_request_count,
  median(c.resolution_minutes) FILTER (WHERE c.closed_ts IS NOT NULL) AS median_resolution_minutes
FROM clean_311_categorized c
LEFT JOIN acs_zip_income_quartiles a
  ON left(coalesce(c.incident_zip, ''), 5) = a.zip_code
GROUP BY 1, 2, 3;

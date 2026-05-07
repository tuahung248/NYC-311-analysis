-- Purpose: Return visible validation output and ENFORCE a hard QA gate.

SELECT
  'tables_and_views_ready' AS check_name,
  15 AS expected_count,
  count(*) AS actual_count,
  (count(*) = 15) AS passed,
  CASE WHEN count(*) = 15 THEN 'PASS' ELSE 'FAIL' END AS status
FROM (
  SELECT table_name AS object_name
  FROM information_schema.tables
  WHERE table_schema = 'main'
    AND table_name IN ('clean_311', 'category_map', 'acs_zip_income_quartiles')
  UNION ALL
  SELECT table_name AS object_name
  FROM information_schema.views
  WHERE table_schema = 'main'
    AND table_name IN (
      'clean_311_categorized',
      'vw_volume_by_category_borough_month',
      'vw_pareto_categories',
      'vw_agency_resolution_benchmark',
      'vw_equity_borough_income_quartile',
      'qa_row_counts',
      'qa_descriptor_override_map_row_count',
      'qa_negative_duration',
      'qa_null_audit',
      'qa_unmapped_complaints',
      'qa_top20_unmapped_values',
      'qa_created_ts_coverage'
    )
) ready_objects
;

SELECT * FROM qa_row_counts;
SELECT * FROM qa_descriptor_override_map_row_count;
SELECT * FROM qa_negative_duration;
SELECT * FROM qa_null_audit;
SELECT * FROM qa_unmapped_complaints;
SELECT
  'qa_unmapped_pct_threshold' AS check_name,
  5.0 AS threshold_pct,
  unmapped_pct AS actual_pct,
  (unmapped_pct <= 5.0) AS passed,
  CASE WHEN unmapped_pct <= 5.0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM qa_unmapped_complaints;
SELECT
  'qa_negative_duration_threshold' AS check_name,
  0.0 AS threshold_pct,
  negative_duration_pct AS actual_pct,
  (negative_duration_pct = 0.0) AS passed,
  CASE WHEN negative_duration_pct = 0.0 THEN 'PASS' ELSE 'FAIL' END AS status
FROM qa_negative_duration;
SELECT * FROM qa_created_ts_coverage;

SELECT * FROM qa_top20_unmapped_values;

SELECT * FROM vw_volume_by_category_borough_month
ORDER BY request_count DESC
LIMIT 20;

SELECT * FROM vw_pareto_categories
ORDER BY category_rank
LIMIT 10;

SELECT * FROM vw_agency_resolution_benchmark
ORDER BY median_resolution_minutes DESC NULLS LAST
LIMIT 20;

SELECT * FROM vw_equity_borough_income_quartile
ORDER BY borough, income_quartile;

WITH expected_objects AS (
  SELECT 'clean_311' AS name, 'BASE TABLE' AS kind UNION ALL
  SELECT 'category_map', 'BASE TABLE' UNION ALL
  SELECT 'acs_zip_income_quartiles', 'BASE TABLE' UNION ALL
  SELECT 'clean_311_categorized', 'VIEW' UNION ALL
  SELECT 'vw_volume_by_category_borough_month', 'VIEW' UNION ALL
  SELECT 'vw_pareto_categories', 'VIEW' UNION ALL
  SELECT 'vw_agency_resolution_benchmark', 'VIEW' UNION ALL
  SELECT 'vw_equity_borough_income_quartile', 'VIEW' UNION ALL
  SELECT 'qa_row_counts', 'VIEW' UNION ALL
  SELECT 'qa_descriptor_override_map_row_count', 'VIEW' UNION ALL
  SELECT 'qa_negative_duration', 'VIEW' UNION ALL
  SELECT 'qa_null_audit', 'VIEW' UNION ALL
  SELECT 'qa_unmapped_complaints', 'VIEW' UNION ALL
  SELECT 'qa_top20_unmapped_values', 'VIEW' UNION ALL
  SELECT 'qa_created_ts_coverage', 'VIEW'
),
present_objects AS (
  SELECT table_name AS name, 'BASE TABLE' AS kind
  FROM information_schema.tables
  WHERE table_schema = 'main' AND table_type = 'BASE TABLE'
  UNION ALL
  SELECT table_name AS name, 'VIEW' AS kind
  FROM information_schema.views
  WHERE table_schema = 'main'
),
missing_objects AS (
  SELECT name, kind
  FROM expected_objects
  EXCEPT
  SELECT name, kind FROM present_objects
),
gate AS (
  SELECT
    'required_objects' AS check_name,
    ((SELECT count(*) FROM missing_objects) = 0) AS passed,
    'missing=' || coalesce(
      (SELECT string_agg(name || '(' || kind || ')', ', ') FROM missing_objects),
      '<none>'
    ) AS detail
  UNION ALL
  SELECT
    'unmapped_pct_le_5' AS check_name,
    (unmapped_pct <= 5.0) AS passed,
    'unmapped_pct=' || round(unmapped_pct, 4)::VARCHAR AS detail
  FROM qa_unmapped_complaints
  UNION ALL
  SELECT
    'negative_duration_pct_eq_0' AS check_name,
    (negative_duration_pct = 0.0) AS passed,
    'negative_duration_pct=' || round(negative_duration_pct, 6)::VARCHAR AS detail
  FROM qa_negative_duration
)
SELECT
  CASE
    WHEN bool_and(passed) THEN 'QA_GATE_PASS'
    ELSE error(
      'QA_GATE_FAIL: '
      || coalesce(
        string_agg(check_name || ' [' || detail || ']', '; ') FILTER (WHERE NOT passed),
        'unknown'
      )
    )
  END AS qa_gate_result
FROM gate;

-- Purpose: Return visible validation output 

SELECT 'tables_and_views_ready' AS check_name, count(*) AS object_count
FROM (
  SELECT table_name AS object_name
  FROM information_schema.tables
  WHERE table_schema = 'main'
    AND table_name IN ('clean_311', 'category_map')
  UNION ALL
  SELECT table_name AS object_name
  FROM information_schema.views
  WHERE table_schema = 'main'
    AND table_name IN (
      'clean_311_categorized',
      'vw_volume_by_category_borough_month',
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
HAVING count(*) < 13;

SELECT * FROM qa_row_counts;
SELECT * FROM qa_descriptor_override_map_row_count;
SELECT * FROM qa_negative_duration;
SELECT * FROM qa_null_audit;
SELECT * FROM qa_unmapped_complaints;
SELECT * FROM qa_created_ts_coverage;

SELECT * FROM qa_top20_unmapped_values;

SELECT * FROM vw_volume_by_category_borough_month
ORDER BY request_count DESC
LIMIT 20;

SELECT * FROM vw_agency_resolution_benchmark
ORDER BY median_resolution_minutes DESC NULLS LAST
LIMIT 20;

SELECT * FROM vw_equity_borough_income_quartile
ORDER BY borough, income_quartile;

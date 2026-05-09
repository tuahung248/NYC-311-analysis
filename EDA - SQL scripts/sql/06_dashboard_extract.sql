-- dash_kpi_header
CREATE OR REPLACE VIEW dash_kpi_header AS
WITH base AS (
  SELECT *
  FROM clean_311_categorized
  WHERE operational_category != 'OTHER'
),
window_backlog AS (
  SELECT
    COUNT(*) FILTER (
      WHERE closed_ts IS NULL
        AND created_ts >= DATE '2024-01-01'
        AND created_ts < DATE '2025-01-01'
    )::BIGINT AS current_open_complaints,
    COUNT(*) FILTER (
      WHERE closed_ts IS NULL
        AND created_ts >= DATE '2023-01-01'
        AND created_ts < DATE '2024-01-01'
    )::BIGINT AS prior_open_complaints
  FROM base
)
SELECT
  COUNT(*)::BIGINT AS total_complaints,
  COUNT(*) FILTER (WHERE closed_ts IS NOT NULL)::BIGINT AS closed_complaints,
  COUNT(*) FILTER (WHERE closed_ts IS NULL)::BIGINT AS open_complaints,
  CAST(COUNT(*) FILTER (WHERE closed_ts IS NOT NULL) AS DOUBLE)
    / NULLIF(COUNT(*), 0)::DOUBLE AS closure_rate,
  MEDIAN(resolution_minutes) FILTER (WHERE closed_ts IS NOT NULL) AS median_resolution_minutes,
  MEDIAN(resolution_minutes) FILTER (WHERE closed_ts IS NOT NULL) / 60.0 AS median_resolution_hours,
  COUNT(DISTINCT agency)::BIGINT AS agency_count,
  COUNT(DISTINCT operational_category)::BIGINT AS category_count,
  MAX(wb.current_open_complaints) AS current_open_complaints,
  MAX(wb.prior_open_complaints) AS prior_open_complaints,
  CASE
    WHEN MAX(wb.prior_open_complaints) = 0 THEN NULL
    ELSE (MAX(wb.current_open_complaints) - MAX(wb.prior_open_complaints)) * 1.0 / MAX(wb.prior_open_complaints)
  END AS backlog_growth_pct,
  MIN(created_ts) AS data_start,
  MAX(created_ts) AS data_end,
  CURRENT_TIMESTAMP AS generated_at
FROM base
CROSS JOIN window_backlog wb;

-- dash_pareto

CREATE OR REPLACE VIEW dash_pareto AS
WITH per_category AS (
  SELECT
    operational_category,
    COUNT(*) AS request_count,
    COUNT(*) FILTER (WHERE closed_ts IS NULL) AS open_count,
    COUNT(*) FILTER (WHERE closed_ts IS NOT NULL) AS closed_count,
    COUNT(*) FILTER (WHERE created_ts >= DATE '2024-01-01' AND created_ts < DATE '2025-01-01') AS latest_count,
    COUNT(*) FILTER (WHERE created_ts >= DATE '2023-01-01' AND created_ts < DATE '2024-01-01') AS prior_count,
    MEDIAN(resolution_minutes) FILTER (WHERE closed_ts IS NOT NULL) AS median_resolution_minutes
  FROM clean_311_categorized
  WHERE operational_category != 'OTHER'
  GROUP BY 1
),
city AS (
  SELECT MEDIAN(resolution_minutes) AS city_median_resolution
  FROM clean_311_categorized
  WHERE operational_category != 'OTHER' AND closed_ts IS NOT NULL
),
totals AS (SELECT SUM(request_count) AS total_requests FROM per_category)
SELECT
  c.operational_category,
  c.request_count,
  c.open_count,
  c.closed_count,
  c.latest_count,
  c.prior_count,
  c.median_resolution_minutes,
  ci.city_median_resolution,
  CASE
    WHEN c.prior_count IS NULL OR c.prior_count = 0 THEN NULL
    ELSE (c.latest_count - c.prior_count) * 1.0 / c.prior_count
  END AS yoy_growth_pct,
  c.open_count * 1.0 / NULLIF(c.request_count, 0) AS backlog_ratio,
  CASE
    WHEN ci.city_median_resolution IS NULL OR ci.city_median_resolution = 0 THEN NULL
    ELSE (c.median_resolution_minutes - ci.city_median_resolution) / ci.city_median_resolution
  END AS resolution_deviation_pct,
  ROW_NUMBER() OVER (ORDER BY c.request_count DESC, c.operational_category) AS category_rank,
  c.request_count * 100.0 / NULLIF(t.total_requests, 0) AS pct_of_total,
  SUM(c.request_count) OVER (
    ORDER BY c.request_count DESC, c.operational_category
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) * 100.0 / NULLIF(t.total_requests, 0) AS cumulative_pct
FROM per_category c
CROSS JOIN city ci
CROSS JOIN totals t;

-- dash_priority_signals
CREATE OR REPLACE VIEW dash_priority_signals AS
WITH category_window AS (
  SELECT
    operational_category,
    COUNT(*) AS latest_count,
    COUNT(*) FILTER (WHERE closed_ts IS NULL) AS latest_open,
    MEDIAN(resolution_minutes) FILTER (WHERE closed_ts IS NOT NULL) AS latest_median_resolution
  FROM clean_311_categorized
  WHERE operational_category != 'OTHER'
    AND created_ts >= DATE '2024-01-01' AND created_ts < DATE '2025-01-01'
  GROUP BY 1
),
prior_window AS (
  SELECT
    operational_category,
    COUNT(*) AS prior_count,
    MEDIAN(resolution_minutes) FILTER (WHERE closed_ts IS NOT NULL) AS prior_median_resolution
  FROM clean_311_categorized
  WHERE operational_category != 'OTHER'
    AND created_ts >= DATE '2023-01-01' AND created_ts < DATE '2024-01-01'
  GROUP BY 1
),
city_baseline AS (
  SELECT MEDIAN(resolution_minutes) AS city_median_resolution
  FROM clean_311_categorized
  WHERE operational_category != 'OTHER'
    AND closed_ts IS NOT NULL
    AND created_ts >= DATE '2024-01-01' AND created_ts < DATE '2025-01-01'
),
equity_per_quartile AS (
  SELECT
    c.operational_category,
    COALESCE(a.income_quartile::VARCHAR, 'UNKNOWN') AS income_quartile,
    MEDIAN(c.resolution_minutes) FILTER (WHERE c.closed_ts IS NOT NULL) AS q_median,
    COUNT(*) FILTER (WHERE c.closed_ts IS NOT NULL) AS q_closed_count
  FROM clean_311_categorized c
  LEFT JOIN acs_zip_income_quartiles a
    ON LEFT(COALESCE(c.incident_zip, ''), 5) = a.zip_code
  WHERE c.operational_category != 'OTHER'
    AND c.created_ts >= DATE '2024-01-01' AND c.created_ts < DATE '2025-01-01'
  GROUP BY 1, 2
),
equity_spread AS (
  SELECT
    operational_category,
    MAX(q_median) FILTER (WHERE income_quartile = '1' AND q_closed_count >= 100) AS q1_median,
    MAX(q_median) FILTER (WHERE income_quartile = '4' AND q_closed_count >= 100) AS q4_median
  FROM equity_per_quartile
  GROUP BY 1
),
joined AS (
  SELECT
    cw.operational_category,
    cw.latest_count,
    cw.latest_open,
    cw.latest_median_resolution,
    pw.prior_count,
    pw.prior_median_resolution,
    cb.city_median_resolution,
    es.q1_median,
    es.q4_median,
    CASE
      WHEN pw.prior_count IS NULL OR pw.prior_count = 0 THEN NULL
      ELSE (cw.latest_count - pw.prior_count) * 1.0 / pw.prior_count
    END AS growth_pct,
    cw.latest_open * 1.0 / NULLIF(cw.latest_count, 0) AS backlog_ratio,
    CASE
      WHEN cb.city_median_resolution IS NULL OR cb.city_median_resolution = 0 THEN NULL
      ELSE (cw.latest_median_resolution - cb.city_median_resolution) / cb.city_median_resolution
    END AS delay_pct,
    CASE
      WHEN es.q1_median IS NULL OR es.q4_median IS NULL OR es.q4_median = 0 THEN NULL
      ELSE (es.q1_median - es.q4_median) / es.q4_median
    END AS equity_gap_pct
  FROM category_window cw
  LEFT JOIN prior_window pw USING (operational_category)
  CROSS JOIN city_baseline cb
  LEFT JOIN equity_spread es USING (operational_category)
),
stats AS (
  SELECT
    AVG(growth_pct)         AS m_growth,  NULLIF(STDDEV_POP(growth_pct), 0)         AS s_growth,
    AVG(backlog_ratio)      AS m_backlog, NULLIF(STDDEV_POP(backlog_ratio), 0)      AS s_backlog,
    AVG(delay_pct)          AS m_delay,   NULLIF(STDDEV_POP(delay_pct), 0)          AS s_delay,
    AVG(equity_gap_pct)     AS m_equity,  NULLIF(STDDEV_POP(equity_gap_pct), 0)     AS s_equity
  FROM joined
  WHERE latest_count >= 100
),
zscored AS (
  SELECT
    j.*,
    GREATEST(LEAST((j.growth_pct      - s.m_growth)  / NULLIF(s.s_growth,  0), 3.0), -3.0) AS growth_z,
    GREATEST(LEAST((j.backlog_ratio   - s.m_backlog) / NULLIF(s.s_backlog, 0), 3.0), -3.0) AS backlog_z,
    GREATEST(LEAST((j.delay_pct       - s.m_delay)   / NULLIF(s.s_delay,   0), 3.0), -3.0) AS delay_z,
    GREATEST(LEAST((j.equity_gap_pct  - s.m_equity)  / NULLIF(s.s_equity,  0), 3.0), -3.0) AS equity_z
  FROM joined j
  CROSS JOIN stats s
),
scored AS (
  SELECT
    *,
    0.35 * COALESCE(growth_z,  0)
  + 0.30 * COALESCE(backlog_z, 0)
  + 0.20 * COALESCE(delay_z,   0)
  + 0.15 * COALESCE(equity_z,  0) AS priority_score
  FROM zscored
),
ranked AS (
  SELECT
    *,
    PERCENT_RANK() OVER (
      PARTITION BY (latest_count >= 100)
      ORDER BY priority_score
    ) AS priority_percentile
  FROM scored
),
contributions AS (
  SELECT
    *,
    0.35 * COALESCE(growth_z,  0) AS c_growth,
    0.30 * COALESCE(backlog_z, 0) AS c_backlog,
    0.20 * COALESCE(delay_z,   0) AS c_delay,
    0.15 * COALESCE(equity_z,  0) AS c_equity
  FROM ranked
)
SELECT
  operational_category,
  latest_count,
  latest_open,
  latest_median_resolution,
  prior_count,
  prior_median_resolution,
  city_median_resolution,
  growth_pct,
  backlog_ratio,
  delay_pct,
  equity_gap_pct,
  growth_z,
  backlog_z,
  delay_z,
  equity_z,
  priority_score,
  CASE WHEN latest_count >= 100 THEN priority_percentile END AS priority_percentile,
  CASE
    WHEN latest_count < 100 THEN 'Insufficient Data'
    WHEN priority_percentile >= 0.90 THEN 'Critical'
    WHEN priority_percentile >= 0.70 THEN 'Watch'
    ELSE 'Stable'
  END AS priority_state,
  CASE
    WHEN latest_count < 100 THEN 'min_sample_category < 100'
    ELSE NULL
  END AS suppression_reason,
  CASE
    WHEN latest_count < 100 THEN NULL
    WHEN c_growth  >= GREATEST(c_backlog, c_delay, c_equity) THEN 'Growth'
    WHEN c_backlog >= GREATEST(c_growth,  c_delay, c_equity) THEN 'Backlog'
    WHEN c_delay   >= GREATEST(c_growth,  c_backlog, c_equity) THEN 'Resolution Delay'
    ELSE 'Equity Gap'
  END AS primary_driver
FROM contributions;

-- dash_priority_callouts
CREATE OR REPLACE VIEW dash_priority_callouts AS
WITH fastest_growth AS (
  SELECT 'fastest_growth' AS flag_id,
         'Fastest-Growing Category' AS label,
         operational_category AS entity,
         growth_pct AS value
  FROM dash_priority_signals
  WHERE growth_pct IS NOT NULL AND latest_count >= 100
  ORDER BY growth_pct DESC
  LIMIT 1
),
borough_window AS (
  SELECT
    borough,
    MEDIAN(resolution_minutes) FILTER (
      WHERE closed_ts IS NOT NULL
        AND created_ts >= DATE '2024-01-01' AND created_ts < DATE '2025-01-01'
    ) AS latest_median,
    MEDIAN(resolution_minutes) FILTER (
      WHERE closed_ts IS NOT NULL
        AND created_ts >= DATE '2023-01-01' AND created_ts < DATE '2024-01-01'
    ) AS prior_median,
    COUNT(*) FILTER (
      WHERE created_ts >= DATE '2024-01-01' AND created_ts < DATE '2025-01-01'
    ) AS latest_count
  FROM clean_311_categorized
  WHERE operational_category != 'OTHER'
    AND borough IS NOT NULL
    AND borough NOT IN ('Unspecified', 'UNKNOWN')
    AND TRIM(borough) <> ''
  GROUP BY 1
),
worsening_borough AS (
  SELECT 'worsening_borough' AS flag_id,
         'Borough with Worsening Median Resolution' AS label,
         borough AS entity,
         (latest_median - prior_median) / NULLIF(prior_median, 0) AS value
  FROM borough_window
  WHERE prior_median IS NOT NULL AND latest_median IS NOT NULL
    AND latest_count >= 1000
  ORDER BY (latest_median - prior_median) / NULLIF(prior_median, 0) DESC
  LIMIT 1
),
highest_backlog AS (
  SELECT 'highest_backlog' AS flag_id,
         'Highest Backlog Pressure' AS label,
         operational_category AS entity,
         backlog_ratio AS value
  FROM dash_priority_signals
  WHERE backlog_ratio IS NOT NULL AND latest_count >= 100
  ORDER BY backlog_ratio DESC
  LIMIT 1
),
agency_window AS (
  SELECT
    agency,
    operational_category,
    COUNT(*) FILTER (WHERE closed_ts IS NOT NULL) AS closed_count,
    MEDIAN(resolution_minutes) FILTER (WHERE closed_ts IS NOT NULL) AS agency_median
  FROM clean_311_categorized
  WHERE operational_category != 'OTHER'
    AND created_ts >= DATE '2024-01-01' AND created_ts < DATE '2025-01-01'
  GROUP BY 1, 2
),
category_baseline AS (
  SELECT
    operational_category,
    MEDIAN(resolution_minutes) FILTER (WHERE closed_ts IS NOT NULL) AS category_median
  FROM clean_311_categorized
  WHERE operational_category != 'OTHER'
    AND created_ts >= DATE '2024-01-01' AND created_ts < DATE '2025-01-01'
  GROUP BY 1
),
overloaded_agency_raw AS (
  SELECT
    a.agency,
    a.operational_category,
    a.closed_count,
    (a.agency_median - cb.category_median) / NULLIF(cb.category_median, 0) AS deviation_pct
  FROM agency_window a
  JOIN category_baseline cb USING (operational_category)
  WHERE a.closed_count >= 10000
),
overloaded_agency AS (
  SELECT 'overloaded_agency' AS flag_id,
         'Most Overloaded Agency vs Category Peers' AS label,
         agency || ' (' || operational_category || ')' AS entity,
         deviation_pct AS value
  FROM overloaded_agency_raw
  WHERE deviation_pct IS NOT NULL
  ORDER BY deviation_pct DESC
  LIMIT 1
),
equity_hotspot AS (
  SELECT 'equity_hotspot' AS flag_id,
         'Largest Equity Gap (Q1 vs Q4)' AS label,
         operational_category AS entity,
         equity_gap_pct AS value
  FROM dash_priority_signals
  WHERE equity_gap_pct IS NOT NULL AND latest_count >= 100
  ORDER BY equity_gap_pct DESC
  LIMIT 1
)
SELECT * FROM fastest_growth
UNION ALL SELECT * FROM worsening_borough
UNION ALL SELECT * FROM highest_backlog
UNION ALL SELECT * FROM overloaded_agency
UNION ALL SELECT * FROM equity_hotspot;

-- dash_monthly_trend
CREATE OR REPLACE VIEW dash_monthly_trend AS
WITH base AS (
  SELECT
    operational_category,
    borough,
    DATE_TRUNC('month', created_ts) AS created_month,
    COUNT(*) AS request_count
  FROM clean_311_categorized
  WHERE operational_category != 'OTHER'
    AND DATE_TRUNC('month', created_ts) <= TIMESTAMP '2024-12-01'
  GROUP BY 1, 2, 3
),
windowed AS (
  SELECT
    operational_category,
    borough,
    created_month,
    request_count,
    AVG(request_count) OVER (
      PARTITION BY operational_category, borough
      ORDER BY created_month
      ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) AS rolling_3mo_avg,
    AVG(request_count) OVER (
      PARTITION BY operational_category, borough
      ORDER BY created_month
      ROWS BETWEEN 11 PRECEDING AND CURRENT ROW
    ) AS rolling_12mo_avg,
    AVG(request_count) OVER (PARTITION BY operational_category, borough) AS series_mean,
    STDDEV_POP(request_count) OVER (PARTITION BY operational_category, borough) AS series_std
  FROM base
)
SELECT
  operational_category,
  borough,
  created_month,
  request_count,
  rolling_3mo_avg,
  rolling_12mo_avg,
  CASE
    WHEN series_std IS NULL OR series_std = 0 THEN 0.0
    ELSE (request_count - series_mean) / series_std
  END AS monthly_zscore,
  CASE
    WHEN series_std IS NULL OR series_std = 0 THEN FALSE
    WHEN ABS((request_count - series_mean) / series_std) >= 2.0 THEN TRUE
    ELSE FALSE
  END AS anomaly_flag
FROM windowed;

-- dash_agency_benchmark
CREATE OR REPLACE VIEW dash_agency_benchmark AS
WITH category_baseline AS (
  SELECT
    operational_category,
    MEDIAN(resolution_minutes) FILTER (WHERE closed_ts IS NOT NULL) AS category_median_resolution
  FROM clean_311_categorized
  WHERE operational_category != 'OTHER'
  GROUP BY 1
),
city AS (
  SELECT MEDIAN(resolution_minutes) AS city_median_resolution
  FROM clean_311_categorized
  WHERE operational_category != 'OTHER' AND closed_ts IS NOT NULL
)
SELECT
  b.agency,
  b.operational_category,
  b.closed_request_count,
  b.median_resolution_minutes,
  cb.category_median_resolution,
  c.city_median_resolution,
  CASE
    WHEN cb.category_median_resolution IS NULL OR cb.category_median_resolution = 0 THEN NULL
    ELSE (b.median_resolution_minutes - cb.category_median_resolution) / cb.category_median_resolution
  END AS category_deviation_pct,
  CASE
    WHEN c.city_median_resolution IS NULL OR c.city_median_resolution = 0 THEN NULL
    ELSE (b.median_resolution_minutes - c.city_median_resolution) / c.city_median_resolution
  END AS city_deviation_pct,
  b.workload_normalized_resolution_rank,
  CASE
    WHEN b.workload_normalized_resolution_rank IS NULL THEN NULL
    WHEN b.workload_normalized_resolution_rank <= 0.25 THEN 'Top Quartile (Fast)'
    WHEN b.workload_normalized_resolution_rank <= 0.50 THEN 'Above Median'
    WHEN b.workload_normalized_resolution_rank <= 0.75 THEN 'Below Median'
    ELSE 'Bottom Quartile (Slow)'
  END AS percentile_band,
  (b.closed_request_count < 100) AS is_low_sample,
  CASE
    WHEN b.closed_request_count < 100 THEN 'Low confidence'
    WHEN b.closed_request_count < 1000 THEN 'Moderate confidence'
    ELSE 'High confidence'
  END AS confidence_label,
  b.meets_min_sample_threshold
FROM vw_agency_resolution_benchmark b
LEFT JOIN category_baseline cb USING (operational_category)
CROSS JOIN city c
WHERE b.operational_category != 'OTHER';

-- dash_equity_heatmap
CREATE OR REPLACE VIEW dash_equity_heatmap AS
WITH city_per_category AS (
  SELECT
    operational_category,
    MEDIAN(resolution_minutes) FILTER (WHERE closed_ts IS NOT NULL) AS category_city_median
  FROM clean_311_categorized
  WHERE operational_category != 'OTHER'
  GROUP BY 1
),
city AS (
  SELECT MEDIAN(resolution_minutes) AS city_median_resolution
  FROM clean_311_categorized
  WHERE operational_category != 'OTHER' AND closed_ts IS NOT NULL
),
q4_anchor AS (
  SELECT
    borough,
    operational_category,
    MAX(median_resolution_minutes) FILTER (
      WHERE income_quartile = '4' AND closed_request_count >= 100
    ) AS q4_median,
    MAX(closed_request_count) FILTER (
      WHERE income_quartile = '4' AND closed_request_count >= 100
    ) AS q4_anchor_count
  FROM vw_equity_borough_income_quartile
  WHERE operational_category != 'OTHER'
  GROUP BY 1, 2
),
borough_quartile_pivot AS (
  SELECT
    borough,
    operational_category,
    MAX(median_resolution_minutes) FILTER (
      WHERE income_quartile = '1' AND closed_request_count >= 100
    ) AS q1_med,
    MAX(median_resolution_minutes) FILTER (
      WHERE income_quartile = '2' AND closed_request_count >= 100
    ) AS q2_med,
    MAX(median_resolution_minutes) FILTER (
      WHERE income_quartile = '3' AND closed_request_count >= 100
    ) AS q3_med,
    MAX(median_resolution_minutes) FILTER (
      WHERE income_quartile = '4' AND closed_request_count >= 100
    ) AS q4_med
  FROM vw_equity_borough_income_quartile
  WHERE operational_category != 'OTHER'
  GROUP BY 1, 2
),
monotonic_flag AS (
  SELECT
    borough,
    operational_category,
    (
      (q1_med IS NOT NULL)::INT
      + (q2_med IS NOT NULL)::INT
      + (q3_med IS NOT NULL)::INT
      + (q4_med IS NOT NULL)::INT
    ) AS reliable_cells,
    CASE
      WHEN (
        (q1_med IS NOT NULL)::INT + (q2_med IS NOT NULL)::INT
        + (q3_med IS NOT NULL)::INT + (q4_med IS NOT NULL)::INT
      ) < 2 THEN NULL
      WHEN (q1_med IS NOT NULL AND q2_med IS NOT NULL AND q1_med < q2_med)
        OR (q2_med IS NOT NULL AND q3_med IS NOT NULL AND q2_med < q3_med)
        OR (q3_med IS NOT NULL AND q4_med IS NOT NULL AND q3_med < q4_med)
        THEN FALSE
      ELSE TRUE
    END AS gradient_monotonic
  FROM borough_quartile_pivot
)
SELECT
  e.borough,
  e.operational_category,
  e.income_quartile,
  e.closed_request_count,
  e.median_resolution_minutes,
  c.city_median_resolution,
  CASE
    WHEN c.city_median_resolution IS NULL OR c.city_median_resolution = 0 THEN NULL
    ELSE (e.median_resolution_minutes - c.city_median_resolution) / c.city_median_resolution
  END AS city_deviation_pct,
  q.q4_median,
  q.q4_anchor_count,
  CASE
    WHEN q.q4_median IS NULL OR q.q4_median = 0 THEN NULL
    ELSE (e.median_resolution_minutes - q.q4_median) / q.q4_median
  END AS gap_vs_q4_pct,
  CASE
    WHEN cpc.category_city_median IS NULL OR cpc.category_city_median = 0 THEN NULL
    ELSE (e.median_resolution_minutes - cpc.category_city_median) / cpc.category_city_median
  END AS gap_vs_city_pct,
  mf.gradient_monotonic,
  (e.closed_request_count < 100) AS is_low_sample,
  CASE
    WHEN e.closed_request_count < 100 THEN 'Low confidence'
    WHEN e.closed_request_count < 1000 THEN 'Moderate confidence'
    ELSE 'High confidence'
  END AS confidence_label,
  CASE
    WHEN e.closed_request_count < 100 THEN 'min_sample_equity_cell < 100'
    ELSE NULL
  END AS suppression_reason
FROM vw_equity_borough_income_quartile e
LEFT JOIN q4_anchor q USING (borough, operational_category)
LEFT JOIN city_per_category cpc USING (operational_category)
LEFT JOIN monotonic_flag mf USING (borough, operational_category)
CROSS JOIN city c
WHERE e.operational_category != 'OTHER';

-- dash_qa_summary
CREATE OR REPLACE VIEW dash_qa_summary AS
WITH unmapped AS (
  SELECT unmapped_pct FROM qa_unmapped_complaints
),
neg AS (
  SELECT negative_duration_pct FROM qa_negative_duration
),
counts AS (
  SELECT row_count FROM qa_row_counts WHERE stage_name = 'clean_311'
),
coverage AS (
  SELECT min_created_ts, max_created_ts FROM qa_created_ts_coverage
)
SELECT 'Cleaned rows' AS check_name,
       (SELECT row_count FROM counts)::DOUBLE AS value,
       NULL::DOUBLE AS threshold,
       'PASS' AS status,
       'Total rows in clean_311 base table.' AS notes
UNION ALL
SELECT 'Unmapped (OTHER) %',
       (SELECT unmapped_pct FROM unmapped),
       5.0,
       CASE WHEN (SELECT unmapped_pct FROM unmapped) <= 5.0 THEN 'PASS' ELSE 'FAIL' END,
       'Share of records mapped to OTHER fallback.'
UNION ALL
SELECT 'Negative duration %',
       (SELECT negative_duration_pct FROM neg),
       0.0,
       CASE WHEN (SELECT negative_duration_pct FROM neg) = 0.0 THEN 'PASS' ELSE 'FAIL' END,
       'Closed before created should be 0% after cleaning.'
UNION ALL
SELECT 'Date coverage start',
       NULL::DOUBLE,
       NULL::DOUBLE,
       'INFO',
       (SELECT min_created_ts FROM coverage)::VARCHAR
UNION ALL
SELECT 'Date coverage end',
       NULL::DOUBLE,
       NULL::DOUBLE,
       'INFO',
       (SELECT max_created_ts FROM coverage)::VARCHAR;

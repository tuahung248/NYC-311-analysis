# NYC311 Data Quality Log (2022-2025)

Source: `data/processed/311_data_quality_log_2022_2025.csv` (latest run in repository).

| check_name | severity | failed_rows | total_rows | failed_pct | action |
| --- | --- | ---: | ---: | ---: | --- |
| negative_resolution_duration | error | 13,441 | 9,862,266 | 0.1363% | drop |
| implausible_closed_ts | error | 9 | 9,862,266 | 0.0001% | drop |
| created_ts_parse_failed | error | 0 | 9,862,266 | 0.0000% | drop |
| duplicate_unique_key_in_slice | error | 0 | 9,862,266 | 0.0000% | deduplicate_keep_first |
| created_outside_2022_2025 | info | 0 | 9,862,266 | 0.0000% | drop |
| closed_ts_parse_failed_when_present | warn | 0 | 9,862,266 | 0.0000% | retain_open_flag_or_drop_if_invalid |
| exact_duplicate_rows_in_slice | warn | 0 | 9,862,266 | 0.0000% | deduplicate |
| missing_agency | warn | 0 | 9,862,266 | 0.0000% | fill_UNKNOWN_or_keep_with_flag |
| missing_complaint_type | warn | 0 | 9,862,266 | 0.0000% | fill_UNKNOWN_or_keep_with_flag |
| missing_borough | warn | 0 | 9,862,266 | 0.0000% | fill_UNKNOWN_or_keep_with_flag |
| missing_open_data_channel_type | warn | 0 | 9,862,266 | 0.0000% | fill_UNKNOWN_or_keep_with_flag |
| missing_status | warn | 0 | 9,862,266 | 0.0000% | fill_UNKNOWN_or_keep_with_flag |

## Caveats carried into taxonomy and KPI interpretation

- **DOHMH reliability caveat:** DOHMH-linked categories (especially `PUBLIC_HEALTH` and rodent/public-health intersections) may have less reliable completion metadata for strict SLA benchmarking; use medians and avoid over-interpreting small deltas.
- **Under-reporting bias caveat:** Geographic complaint intensity is not equivalent to objective need. Lower-income and lower-trust neighborhoods can file fewer complaints despite higher underlying service gaps.
- **2020-2021 exclusion rationale:** COVID-period operational disruptions create non-stationary volume and closure patterns; these years are intentionally excluded so 2022-2025 benchmarks are comparable for current operations.
- **Taxonomy fallback note:** `OTHER` is retained for rare internal/system-coded records and should be excluded from management priority ranking.
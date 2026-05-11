/**
 * Type contracts for the eight `dash_*` extracts produced by
 * `EDA - SQL scripts/sql/06_dashboard_layer.sql` (see dashboard/build/01_data_sources.md).
 *
 * Field names mirror the CSV column names exactly so they match
 * the JSON output of scripts/csv-to-json.ts.
 */

export type Borough =
  | "BRONX"
  | "BROOKLYN"
  | "MANHATTAN"
  | "QUEENS"
  | "STATEN ISLAND"
  | "Unspecified"
  | "UNKNOWN";

export type IncomeQuartile = "1" | "2" | "3" | "4" | "UNKNOWN";

export type PriorityState =
  | "Critical"
  | "Watch"
  | "Stable"
  | "Insufficient Data";

export type ConfidenceLabel =
  | "High confidence"
  | "Moderate confidence"
  | "Low confidence";

export type PerformanceBand =
  | "Top Quartile (Fast)"
  | "Above Median"
  | "Below Median"
  | "Bottom Quartile (Slow)"
  | "Insufficient Data";

export type QaStatus = "PASS" | "FAIL" | "WARN" | "INFO";

export type CalloutFlagId =
  | "fastest_growth"
  | "worsening_borough"
  | "highest_backlog"
  | "overloaded_agency"
  | "equity_hotspot";

// dash_kpi_header (1 row)
export interface KpiHeader {
  total_complaints: number;
  closed_complaints: number;
  open_complaints: number;
  closure_rate: number;
  median_resolution_minutes: number;
  median_resolution_hours: number;
  agency_count: number;
  category_count: number;
  current_open_complaints: number;
  prior_open_complaints: number;
  backlog_growth_pct: number | null;
  data_start: string;
  data_end: string;
  generated_at: string;
}

// dash_pareto
export interface ParetoRow {
  operational_category: string;
  request_count: number;
  open_count: number;
  closed_count: number;
  latest_count: number;
  prior_count: number;
  median_resolution_minutes: number;
  city_median_resolution: number;
  yoy_growth_pct: number | null;
  backlog_ratio: number;
  resolution_deviation_pct: number | null;
  category_rank: number;
  pct_of_total: number;
  cumulative_pct: number;
}

// dash_priority_signals
export interface PrioritySignalRow {
  operational_category: string;
  latest_count: number;
  latest_open: number;
  latest_median_resolution: number | null;
  prior_count: number;
  prior_median_resolution: number | null;
  city_median_resolution: number;
  growth_pct: number | null;
  backlog_ratio: number;
  delay_pct: number | null;
  equity_gap_pct: number | null;
  growth_z: number | null;
  backlog_z: number | null;
  delay_z: number | null;
  equity_z: number | null;
  priority_score: number | null;
  priority_percentile: number | null;
  priority_state: PriorityState;
  suppression_reason: string | null;
  primary_driver: string | null;
}

// dash_priority_callouts
export interface PriorityCallout {
  flag_id: CalloutFlagId;
  label: string;
  entity: string;
  value: number;
}

// dash_monthly_trend
export interface MonthlyTrendRow {
  operational_category: string;
  borough: Borough;
  created_month: string;
  request_count: number;
  rolling_3mo_avg: number;
  rolling_12mo_avg: number;
  monthly_zscore: number | null;
  anomaly_flag: boolean;
}

// dash_agency_benchmark
export interface AgencyBenchmarkRow {
  agency: string;
  operational_category: string;
  closed_request_count: number;
  median_resolution_minutes: number;
  category_median_resolution: number;
  city_median_resolution: number;
  category_deviation_pct: number | null;
  city_deviation_pct: number;
  workload_normalized_resolution_rank: number | null;
  percentile_band: PerformanceBand;
  is_low_sample: boolean;
  confidence_label: ConfidenceLabel;
  meets_min_sample_threshold: boolean;
}

// dash_equity_heatmap
export interface EquityHeatmapRow {
  borough: Borough;
  operational_category: string;
  income_quartile: IncomeQuartile;
  closed_request_count: number;
  median_resolution_minutes: number;
  city_median_resolution: number;
  city_deviation_pct: number;
  q4_median: number | null;
  q4_anchor_count: number | null;
  gap_vs_q4_pct: number | null;
  gap_vs_city_pct: number | null;
  gradient_monotonic: boolean | null;
  is_low_sample: boolean;
  confidence_label: ConfidenceLabel;
  suppression_reason: string | null;
}

// dash_qa_summary
export interface QaSummaryRow {
  check_name: string;
  value: number | null;
  threshold: number | null;
  status: QaStatus;
  notes: string;
}

// Cross-cutting filter state (mirrors Tableau parameters in 02_parameters.md)
export type AllOption = "(All)";
export type BaselineMode = "City Median" | "Category Median";

export interface FilterState {
  borough: AllOption | Borough;
  category: AllOption | string;
  baselineMode: BaselineMode;
  topN: number;
  minSample: number;
  dateStart: string;
  dateEnd: string;
}

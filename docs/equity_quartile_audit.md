# Equity Quartile Audit

Audit date: 2026-05-09  
Database: `data/processed/nyc311.duckdb`  
Focused slice for this audit: `operational_category = 'PARKING_ENFORCEMENT'`, calendar year 2024

## Purpose

This audit validates whether two non-intuitive equity patterns seen on dashboard Page 3 should be treated as data artifacts, real but narrow signals, or mapping errors:

- Bronx `Q2 > Q1` median resolution time in the all-years extract.
- Brooklyn `Q3 < Q4` median resolution time in the all-years extract.

The objective is decision support: keep or revise the ZIP-to-income-quartile approach used in the 2022-2025 NYC 311 equity lens.

## Scope and Data Sources

- **Primary analytical context:** NYC 311 project, 2022-2025 slice, median resolution-time framing.
- **Audit calibration window:** 2024 only (aligned with `dash_priority_signals` calibration).
- **Tables used:**
  - `clean_311_categorized`
  - `acs_zip_income_quartiles`
- **Join key:** `LEFT(incident_zip, 5) = zip_code`.
- **Metric:** `MEDIAN(resolution_minutes)` for closed records.

## Methodology

1. Restrict records to 2024 `PARKING_ENFORCEMENT`.
2. Join complaint records to ACS ZIP income quartiles.
3. Compute borough x quartile counts and medians.
4. Drill down to ZIP-level medians where quartile patterns looked non-monotonic.

Reference query:

```sql
WITH parking AS (
  SELECT
    c.borough,
    LEFT(COALESCE(c.incident_zip, ''), 5) AS zip5,
    a.income_quartile,
    a.median_household_income,
    c.closed_ts,
    c.resolution_minutes
  FROM clean_311_categorized c
  LEFT JOIN acs_zip_income_quartiles a
    ON LEFT(COALESCE(c.incident_zip, ''), 5) = a.zip_code
  WHERE c.operational_category = 'PARKING_ENFORCEMENT'
    AND c.created_ts >= DATE '2024-01-01'
    AND c.created_ts < DATE '2025-01-01'
    AND a.income_quartile IS NOT NULL
)
SELECT
  borough,
  income_quartile,
  COUNT(DISTINCT zip5) AS n_zips,
  COUNT(*) FILTER (WHERE closed_ts IS NOT NULL) AS closed_rows,
  MEDIAN(resolution_minutes) FILTER (WHERE closed_ts IS NOT NULL) AS median_min
FROM parking
GROUP BY 1, 2
ORDER BY 1, 2;
```

## Outputs and Interpretation

### Borough x quartile ZIP coverage (2024 Parking Enforcement)

| Borough | Q1 ZIPs | Q2 ZIPs | Q3 ZIPs | Q4 ZIPs |
| --- | ---: | ---: | ---: | ---: |
| BRONX | 23 | **1** | **2** | **0** |
| BROOKLYN | 21 | 11 | **4** | **3** |
| MANHATTAN | 14 | 6 | 6 | 21 |
| QUEENS | 19 | 32 | 10 | **3** |
| STATEN ISLAND | 3 | 6 | 3 | **0** |

### Key interpretations

- **Bronx Q2 is a single-ZIP artifact.** Q2 is only `10465` (Throgs Neck/Country Club/Pelham Bay), with 5,889 closed 2024 records and median 348 minutes. This does not represent a broad higher-income Bronx segment.
- **Bronx Q3 is also narrow.** Q3 only includes `10471` and `10464` (3,246 closed records combined; median 200.5 minutes), both geographically isolated.
- **Bronx Q4 is missing.** No Q4 ZIPs exist, so a strict Q4-anchored within-borough gap cannot be computed for Bronx rows.
- **Brooklyn Q3 vs Q4 is non-monotonic but real.** Q3 (4 ZIPs) median is 48 minutes; Q4 (3 ZIPs) median is 56 minutes. The 8-minute inversion is consistent with neighborhood mix (notably `11201` commercial/tourist pressure), not a mapping bug.
- **Queens and Staten Island upper quartiles are fragile.** Queens Q4 has only 3 ZIPs (987 closed records in 2024), and Staten Island has no Q4 ZIPs.

## Caveats

- The equity lens remains valid, but sparse upper-quartile coverage can make borough-level quartile cells behave like neighborhood-specific signals.
- Under-reporting bias in low-income and minority neighborhoods still applies and must be stated on geographic/equity outputs.
- Non-monotonic quartile steps are not automatically analytical errors; they can reflect real land-use and demand differences within a borough.

## Reproducibility

- Open `data/processed/nyc311.duckdb`.
- Run the SQL in the Methodology section.
- Validate counts at borough x quartile first, then inspect ZIP-level composition for any surprising quartile medians.
- Keep this audit aligned with dashboard logic used for `dash_priority_signals`.

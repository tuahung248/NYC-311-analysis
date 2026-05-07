# NYC 311 Operational Analytics (2022-2025)

Operational analytics project for NYC 311 service requests, focused on:

- complaint volume drivers (type, borough, channel),
- workload-normalized agency resolution benchmarking,
- service equity by borough x income quartile.

The repository is designed for reproducibility: every cleaning exclusion is logged, and SQL outputs are generated from versioned scripts.

## Project Goals

- Identify top complaint drivers using a practical operational taxonomy.
- Compare agency resolution performance fairly (within complaint category mix).
- Quantify equity patterns using ZIP-level income quartiles.
- Deliver manager-ready artifacts: codebook/mapping, cleaned dataset, SQL views, dashboard inputs, and executive-summary-ready tables.

## Data Source and Scope

- **Source dataset:** [NYC Open Data - 311 Service Requests from 2020 to Present](https://data.cityofnewyork.us/Social-Services/311-Service-Requests-from-2020-to-Present/erm2-nwe9/about_data)
- **Raw file used in this repo:** `data/raw_dataset/311_Service_Requests_from_2020_to_Present_20260502.csv.zip`
- **Analytical window:** 2022-01-01 to 2025-12-31

> [!NOTE]
> 2020-2021 are intentionally excluded from KPI benchmarking to avoid COVID-era service disruption effects.

## Repository Structure

```text
NYC311/
├── README.md
├── requirements.txt
├── codebook/
│   └── category_mapping.csv
├── data/
│   ├── raw_dataset/
│   │   └── 311_Service_Requests_from_2020_to_Present_20260502.csv.zip
│   ├── reference/
│   │   └── acs_zip_income_quartiles.csv
│   └── processed/
│       ├── 311_data_quality_log_2022_2025.csv
│       ├── 311_profile_report.html
│       └── pipeline_summary.json
├── EDA - SQL scripts/
│   ├── nyc311_cleaning.ipynb
│   └── sql/
│       ├── 00_reference.sql
│       ├── 01_clean.sql
│       ├── 02_taxonomy.sql
│       ├── 03_analysis.sql
│       ├── 04_qa.sql
│       └── 05_checks.sql
└── scripts/
    └── acs_income_quartiles.py
```

## Setup

```bash
cd "/Users/tuanhung/Documents/GitHub/NYC311"
python3 -m venv .venv
source .venv/bin/activate
pip install -U pip
pip install -r requirements.txt
```

## Reproducible Run Workflow

### 1) Build/refresh ACS income quartiles (optional but recommended)

```bash
cd "/Users/tuanhung/Documents/GitHub/NYC311"
source .venv/bin/activate
python "scripts/acs_income_quartiles.py"
```

### 2) Run cleaning notebook

Open and run all cells in:

- `EDA - SQL scripts/nyc311_cleaning.ipynb`

Expected outputs:

- `data/processed/311_clean_2022_2025.parquet`
- `data/processed/311_data_quality_log_2022_2025.csv`
- `data/processed/pipeline_summary.json`

### 3) Run SQL pipeline in DuckDB

```bash
cd "/Users/tuanhung/Documents/GitHub/NYC311"
duckdb data/processed/nyc311.duckdb < "EDA - SQL scripts/sql/00_reference.sql"
duckdb data/processed/nyc311.duckdb < "EDA - SQL scripts/sql/01_clean.sql"
duckdb data/processed/nyc311.duckdb < "EDA - SQL scripts/sql/02_taxonomy.sql"
duckdb data/processed/nyc311.duckdb < "EDA - SQL scripts/sql/03_analysis.sql"
duckdb data/processed/nyc311.duckdb < "EDA - SQL scripts/sql/04_qa.sql"
duckdb data/processed/nyc311.duckdb < "EDA - SQL scripts/sql/05_checks.sql"
```

`05_checks.sql` ends with a hard QA gate (`error()` on breach) so the
process exits non-zero if any of these invariants fail:

- all required tables/views are present in `main`
- `unmapped_pct <= 5` (taxonomy coverage)
- `negative_duration_pct = 0` (no closed-before-created records)

## Core SQL Outputs

Reference tables (staged once, joined many times):

- `acs_zip_income_quartiles`

Analytical views:

- `vw_volume_by_category_borough_month`
- `vw_pareto_categories`
- `vw_agency_resolution_benchmark`
- `vw_equity_borough_income_quartile`

Quality/audit views:

- `qa_row_counts`
- `qa_negative_duration`
- `qa_null_audit`
- `qa_unmapped_complaints`
- `qa_top20_unmapped_values`
- `qa_created_ts_coverage`

## Current Pipeline Snapshot

From `data/processed/pipeline_summary.json`:

- Clean rows: **9,848,824**
- Unique keys: **9,848,824**
- Created date range: **2022-01-01** to **2025-01-01 23:44:39**
- Negative durations in cleaned output: **0**

From `data/processed/311_data_quality_log_2022_2025.csv`:

- Dropped negative resolution rows: **13,441**
- Dropped implausible closure timestamp rows: **9**

## Deliverables Produced by This Repo

- Taxonomy mapping scaffold: `codebook/category_mapping.csv`
- Reproducible cleaning pipeline: `EDA - SQL scripts/nyc311_cleaning.ipynb`
- SQL analysis/QA pipeline: `EDA - SQL scripts/sql/*.sql`
- Processed QA and summary artifacts in `data/processed/`

> [!IMPORTANT]
> `codebook/category_mapping.csv` currently contains only headers. Until mapping values are populated, taxonomy fallback in `02_taxonomy.sql` routes all unmatched complaint types to `OTHER`.

## Data Quality and Caveats

- Resolution-time KPIs use **median**, not mean (right-skewed durations).
- Records with `closed_ts < created_ts` are excluded from KPI outputs.
- Implausible closure timestamps are excluded and logged.
- Agency comparisons are designed to be complaint-mix-aware (`operational_category` partitioned ranks).
- Geographic/equity findings should be interpreted with under-reporting bias caution in low-income areas.

> [!WARNING]
> Do not compare agencies on raw overall resolution time without controlling for complaint-type mix.

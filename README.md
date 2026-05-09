# NYC 311 Operational Analytics (2022-2025)

Operational analytics workflow for NYC 311 service requests, with a reproducible data pipeline and a frontend dashboard app. The repository covers cleaning, taxonomy mapping, QA checks, DuckDB views, dashboard extracts, and React-based visualization.

## Project Overview

- **Primary focus:** complaint volume drivers, workload-normalized agency benchmarking, and equity by borough x income quartile.
- **Source dataset:** [NYC Open Data: 311 Service Requests from 2020 to Present](https://data.cityofnewyork.us/Social-Services/311-Service-Requests-from-2020-to-Present/erm2-nwe9/about_data)
- **Local raw snapshot in repo:** `data/raw_dataset/311_Service_Requests_from_2020_to_Present_20260502.csv.zip`
- **Analysis window:** 2022-01-01 to 2025-01-01 (2020-2021 intentionally excluded for benchmark stability).

## Key Goals

- Identify top operational complaint drivers (category, borough, channel, trend).
- Compare agencies within complaint mix (not raw cross-agency medians).
- Quantify equity gaps using ZIP-linked ACS income quartiles.
- Produce reproducible dashboard-ready outputs in `dashboard/extracts/`.

## Quick Start

```bash
cd "/Users/tuanhung/Documents/GitHub/NYC311"
python3 -m venv .venv
source .venv/bin/activate
pip install -U pip
pip install -r requirements.txt
```

1. Run `EDA - SQL scripts/nyc311_cleaning.ipynb` (all cells) to generate cleaned parquet/log artifacts.
2. Run SQL stages into DuckDB (in order):
   - `EDA - SQL scripts/sql/00_reference.sql`
   - `EDA - SQL scripts/sql/01_clean.sql`
   - `EDA - SQL scripts/sql/02_taxonomy.sql`
   - `EDA - SQL scripts/sql/03_analysis.sql`
   - `EDA - SQL scripts/sql/04_qa.sql`
   - `EDA - SQL scripts/sql/05_checks.sql`
3. Build dashboard layer CSVs:
   - `python scripts/build_dashboard_extracts.py`
4. (Optional) run dashboard app:
   - `cd dashboard/app && npm install && npm run dev`

## Repository Structure

```text
NYC311/
├── README.md
├── requirements.txt
├── codebook/
│   ├── category_mapping.csv
│   ├── descriptor_overrides.csv
│   ├── data_quality_log.md
│   └── taxonomy_codebook.md
├── data/
│   ├── raw_dataset/
│   ├── reference/
│   │   └── acs_zip_income_quartiles.csv
│   └── processed/
│       ├── 311_clean_2022_2025.parquet
│       ├── 311_data_quality_log_2022_2025.csv
│       ├── nyc311.duckdb
│       └── pipeline_summary.json
├── EDA - SQL scripts/
│   ├── nyc311_cleaning.ipynb
│   └── sql/
│       ├── 00_reference.sql
│       ├── 01_clean.sql
│       ├── 02_taxonomy.sql
│       ├── 03_analysis.sql
│       ├── 04_qa.sql
│       ├── 05_checks.sql
│       └── 06_dashboard_layer.sql
├── scripts/
│   ├── acs_income_quartiles.py
│   └── build_dashboard_extracts.py
├── dashboard/
│   ├── README.md
│   ├── extracts/
│   └── app/
│       ├── package.json
│       ├── scripts/csv-to-json.ts
│       └── src/
└── docs/
    └── equity_quartile_audit.md
```

## Data Flow / Pipeline Stages

1. **Reference stage (`00_reference.sql`)**
   - Loads `data/reference/acs_zip_income_quartiles.csv` into `acs_zip_income_quartiles`.
2. **Clean stage (`01_clean.sql`)**
   - Reads `data/processed/311_clean_2022_2025.parquet`, enforces date bounds, recomputes `resolution_minutes`, deduplicates by `unique_key`.
3. **Taxonomy stage (`02_taxonomy.sql`)**
   - Loads `codebook/category_mapping.csv` and `codebook/descriptor_overrides.csv`, builds `clean_311_categorized`, falls back to `OTHER` when unmatched.
4. **Analysis stage (`03_analysis.sql`)**
   - Builds `vw_*` views for volume, Pareto, agency benchmark, and equity.
5. **QA stage (`04_qa.sql` + `05_checks.sql`)**
   - Creates `qa_*` views and enforces hard QA gate (required objects, `unmapped_pct <= 5`, `negative_duration_pct = 0`).
6. **Dashboard layer (`06_dashboard_layer.sql`)**
   - Builds `dash_*` views used for extract export and app/tableau consumption.
7. **Extract export (`scripts/build_dashboard_extracts.py`)**
   - Executes `06_dashboard_layer.sql`, exports `dash_*.csv` to `dashboard/extracts/`, writes `dashboard/extracts/_manifest.json`.
8. **App data build (`dashboard/app/scripts/csv-to-json.ts`)**
   - Converts `dashboard/extracts/*.csv` to JSON modules under `dashboard/app/src/data/`.

## Prerequisites

- Python 3 (with virtualenv support)
- `pip`
- DuckDB CLI (`duckdb`) for running SQL files directly
- Node.js + npm (for `dashboard/app`)

## Setup and Install

### Python environment

```bash
cd "/Users/tuanhung/Documents/GitHub/NYC311"
python3 -m venv .venv
source .venv/bin/activate
pip install -U pip
pip install -r requirements.txt
```

### Dashboard app dependencies

```bash
cd "/Users/tuanhung/Documents/GitHub/NYC311/dashboard/app"
npm install
```

## Run Instructions

### 1) Optional: refresh ACS income quartiles

```bash
cd "/Users/tuanhung/Documents/GitHub/NYC311"
source .venv/bin/activate
python scripts/acs_income_quartiles.py
```

Notes:
- Uses Census API (`2022 ACS5 subject table S1901`).
- Reads optional `CENSUS_API_KEY` from environment if provided.
- Writes `data/reference/acs_zip_income_quartiles.csv`.

### 2) Run notebook cleaning stage

- Open `EDA - SQL scripts/nyc311_cleaning.ipynb` and run all cells.
- Expected key outputs in `data/processed/` include:
  - `311_clean_2022_2025.parquet`
  - `311_data_quality_log_2022_2025.csv`
  - `pipeline_summary.json`

### 3) Run SQL pipeline

```bash
cd "/Users/tuanhung/Documents/GitHub/NYC311"
duckdb data/processed/nyc311.duckdb < "EDA - SQL scripts/sql/00_reference.sql"
duckdb data/processed/nyc311.duckdb < "EDA - SQL scripts/sql/01_clean.sql"
duckdb data/processed/nyc311.duckdb < "EDA - SQL scripts/sql/02_taxonomy.sql"
duckdb data/processed/nyc311.duckdb < "EDA - SQL scripts/sql/03_analysis.sql"
duckdb data/processed/nyc311.duckdb < "EDA - SQL scripts/sql/04_qa.sql"
duckdb data/processed/nyc311.duckdb < "EDA - SQL scripts/sql/05_checks.sql"
duckdb data/processed/nyc311.duckdb < "EDA - SQL scripts/sql/06_dashboard_layer.sql"
```

### 4) Build dashboard extracts

```bash
cd "/Users/tuanhung/Documents/GitHub/NYC311"
python scripts/build_dashboard_extracts.py
```

Outputs:
- `dashboard/extracts/dash_kpi_header.csv`
- `dashboard/extracts/dash_pareto.csv`
- `dashboard/extracts/dash_priority_signals.csv`
- `dashboard/extracts/dash_priority_callouts.csv`
- `dashboard/extracts/dash_monthly_trend.csv`
- `dashboard/extracts/dash_agency_benchmark.csv`
- `dashboard/extracts/dash_equity_heatmap.csv`
- `dashboard/extracts/dash_qa_summary.csv`
- `dashboard/extracts/_manifest.json`

### 5) Run dashboard app

From `dashboard/app`, available scripts:

- `npm run dev` (runs `predev`, so CSV->JSON conversion happens first)
- `npm run data` (manual CSV->JSON refresh)
- `npm run build` (runs `prebuild` data conversion, then Vite build)
- `npm run preview`
- `npm run lint`

## Data Extracts Usage

- `dashboard/extracts/*.csv` are the dashboard interface contract generated from DuckDB `dash_*` views.
- `dashboard/app/scripts/csv-to-json.ts` coercively parses these CSVs into typed JSON files in `dashboard/app/src/data/`.
- If extracts are regenerated, rerun `npm run data` (or `npm run dev`/`npm run build`) in `dashboard/app`.

## Reproducibility Notes

- SQL pipeline is stage-ordered and explicit (`00` through `06`).
- `05_checks.sql` enforces a hard QA gate using DuckDB `error()` when critical conditions fail.
- Python extract build script writes a timestamped `_manifest.json` with row counts.
- Core reproducibility artifacts are committed (SQL scripts, dashboard source, extract schema outputs).

## Required Local Data and Intentionally Uncommitted Files

- Required project data currently present in repo:
  - `data/raw_dataset/311_Service_Requests_from_2020_to_Present_20260502.csv.zip`
  - `data/processed/311_clean_2022_2025.parquet`
  - `data/processed/nyc311.duckdb`
  - `data/reference/acs_zip_income_quartiles.csv`
- Intentionally not committed (from `.gitignore`):
  - `data/raw/` local raw drops
  - Python virtual envs (`.venv/`, `venv/`)
  - Dashboard build artifacts (`dashboard/app/node_modules/`, `dashboard/app/dist/`, `.vite/`, `*.tsbuildinfo`)
  - Editor/system cache files (`.cursor/`, `.vscode/`, `.DS_Store`, etc.)

## Caveats and Assumptions

- Median resolution time is the KPI default (right-skewed distributions).
- Records with invalid temporal order (`closed_ts < created_ts`) are excluded.
- Agency comparisons must be interpreted within complaint category context.
- Taxonomy defaults unmatched complaint types/descriptors to `OTHER`.
- Geographic/equity interpretation carries under-reporting bias risk in lower-income areas.
- DOHMH-linked closure metadata may be less reliable for fine-grained SLA interpretation.

## Troubleshooting

- **`duckdb: command not found`**
  - Install DuckDB CLI and rerun SQL stages.
- **`Missing CSV extract` when running dashboard app**
  - Run `python scripts/build_dashboard_extracts.py` from repo root, then `npm run data` in `dashboard/app`.
- **QA gate fails in `05_checks.sql`**
  - Inspect outputs from `qa_unmapped_complaints` and `qa_negative_duration`; fix upstream mapping/cleaning before proceeding.
- **`category_mapping.csv` is sparse or header-only**
  - Expect high `OTHER` share and likely `unmapped_pct` gate failures until mappings are populated.
- **Dashboard does not reflect updated data**
  - Rebuild extract CSVs, rerun `npm run data`, restart `npm run dev`.

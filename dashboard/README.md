# NYC311 Dashboard Module

This module contains the dashboard-facing data extracts and a React app that renders the NYC311 operational views locally.

The app is static (no backend server). It consumes generated files from `dashboard/extracts/`, converts them into JSON in `dashboard/app/src/data/`, and serves interactive pages for triage, agency benchmarking, and equity analysis.

## Purpose

- Provide a reproducible dashboard layer on top of the NYC311 analysis pipeline.
- Keep dashboard data preparation explicit and scriptable.
- Let contributors run and validate dashboard behavior locally without Tableau or a runtime API.

## Folder Structure

```text
dashboard/
├── README.md
├── extracts/
│   ├── _manifest.json
│   ├── dash_kpi_header.csv
│   ├── dash_pareto.csv
│   ├── dash_priority_signals.csv
│   ├── dash_priority_callouts.csv
│   ├── dash_monthly_trend.csv
│   ├── dash_agency_benchmark.csv
│   ├── dash_equity_heatmap.csv
│   └── dash_qa_summary.csv
└── app/
    ├── package.json
    ├── scripts/csv-to-json.ts
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── components/
        ├── context/
        ├── data/
        ├── styles/
        └── types/
```

## Prerequisites

- From repository root:
  - Python 3 with `duckdb` available (used by `scripts/build_dashboard_extracts.py`)
  - Existing DuckDB database at `data/processed/nyc311.duckdb`
- For the frontend app:
  - Node.js 18+ and npm

## Setup

1. Generate or refresh dashboard CSV extracts from repo root:

```bash
python scripts/build_dashboard_extracts.py
```

2. Install frontend dependencies:

```bash
cd dashboard/app
npm install
```

## Run Locally

From `dashboard/app`:

```bash
npm run dev
```

Notes:
- `npm run dev` triggers `predev`, which runs `npm run data`.
- `npm run data` executes `scripts/csv-to-json.ts`, converting CSV files in `../extracts` into JSON modules in `src/data/`.

Optional production check:

```bash
npm run build
npm run preview
```

## How Data Extracts Are Produced and Consumed

1. `scripts/build_dashboard_extracts.py` (repo root) connects to `data/processed/nyc311.duckdb`.
2. It executes SQL from `EDA - SQL scripts/sql/06_dashboard_layer.sql`.
3. It exports eight views to `dashboard/extracts/*.csv` and writes `dashboard/extracts/_manifest.json`.
4. `dashboard/app/scripts/csv-to-json.ts` reads those CSVs, applies type coercion, and writes:
   - `dashboard/app/src/data/*.json`
   - `dashboard/app/src/data/manifest.json`
5. The app imports the generated JSON through `src/data/index.ts`.

Expected extract files:
- `dash_kpi_header.csv`
- `dash_pareto.csv`
- `dash_priority_signals.csv`
- `dash_priority_callouts.csv`
- `dash_monthly_trend.csv`
- `dash_agency_benchmark.csv`
- `dash_equity_heatmap.csv`
- `dash_qa_summary.csv`

## Troubleshooting

- `Missing CSV extract` when running `npm run data`:
  - Re-run `python scripts/build_dashboard_extracts.py` from repo root.
- `Extracts directory not found`:
  - Confirm `dashboard/extracts/` exists and contains the CSV files above.
- `DuckDB` or SQL path errors while building extracts:
  - Verify `data/processed/nyc311.duckdb` and `EDA - SQL scripts/sql/06_dashboard_layer.sql` exist.
- Frontend starts but data looks stale:
  - Re-run `npm run data` (or `npm run dev`, which runs it automatically).

For broader project pipeline context, see the root `README.md`.

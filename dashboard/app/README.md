# NYC311 Dashboard App

React + TypeScript frontend for the NYC311 Operations Intelligence dashboard.  
It reads precomputed CSV extracts from `../extracts`, converts them into local JSON modules via `scripts/csv-to-json.ts`, and serves a static 3-page experience for:

1. Executive triage (volume, backlog, and priority signals)
2. Agency benchmark (workload-normalized resolution comparisons)
3. Equity lens (borough x income-quartile resolution gaps with caveats)

This app has no runtime backend; analytics are prepared upstream.

## Tech stack

- React 18 + TypeScript
- Vite 5 (`HashRouter`, `base: "./"` for static hosting)
- Tailwind CSS 3 + PostCSS/Autoprefixer
- Recharts for chart components
- `tsx` for build-time Node TypeScript script execution

## Prerequisites

- Node.js 18+ and npm
- Dashboard extracts generated in `dashboard/extracts/`:
  - `dash_kpi_header.csv`
  - `dash_pareto.csv`
  - `dash_priority_signals.csv`
  - `dash_priority_callouts.csv`
  - `dash_monthly_trend.csv`
  - `dash_agency_benchmark.csv`
  - `dash_equity_heatmap.csv`
  - `dash_qa_summary.csv`

If extracts are missing or stale, regenerate them from repo root:

```bash
python scripts/build_dashboard_extracts.py
```

## Install and run

From `dashboard/app`:

```bash
npm install
npm run dev
```

`npm run dev` runs `predev`, which executes `npm run data` before starting Vite.

## Build and preview

From `dashboard/app`:

```bash
npm run build
npm run preview
```

`npm run build` runs `prebuild` (`npm run data`) first, then `tsc -b && vite build`.

## Data flow

1. Upstream pipeline writes dashboard CSV extracts into `dashboard/extracts/`.
2. `scripts/csv-to-json.ts` reads those CSV files, coerces typed fields (numeric/boolean), and writes JSON modules into `src/data/`.
3. The script also writes `src/data/manifest.json`, including generation metadata and upstream `_manifest.json` when present.
4. App code imports `src/data/*.json` through `src/data/index.ts` and uses typed contracts from `src/types/dashboard.ts`.

Manual refresh (from `dashboard/app`):

```bash
npm run data
```

## Key structure

```text
dashboard/app/
  package.json
  scripts/
    csv-to-json.ts
  src/
    App.tsx                      # routes: /triage, /agency, /equity
    main.tsx                     # HashRouter + FilterProvider
    components/
      layout/                    # app shell, KPI card
      page1/                     # executive triage views
      page2/                     # agency benchmark views
      page3/                     # equity lens views
      shared/                    # reusable UI blocks
    context/
      FilterContext.tsx          # cross-page filters
    data/                        # generated JSON + manifest
    types/
      dashboard.ts               # typed extract contracts
    styles/
      tokens.css                 # Tailwind entry + tokens
```

## NYC311-specific context

- Resolution metrics are presented as medians (not means) due to skewed duration distributions.
- Agency comparisons are intended to be workload-normalized by complaint category.
- Equity view explicitly carries under-reporting bias caveats for low-income/minority neighborhoods.
- Default filter behavior is centralized in `src/context/FilterContext.tsx`.

## Troubleshooting

- `Missing CSV extract` during `npm run data`:
  - Ensure `dashboard/extracts/*.csv` exists and run `python scripts/build_dashboard_extracts.py` from repo root.
- Data changes not reflected in UI:
  - Re-run `npm run data`; `src/data/*.json` are generated artifacts.
- Route refresh/deploy issues on static hosting:
  - App uses `HashRouter`, so navigation should work without server rewrite rules.
- Build fails on TypeScript:
  - Run `npm run build` locally and address any `tsc -b` errors before deploy.

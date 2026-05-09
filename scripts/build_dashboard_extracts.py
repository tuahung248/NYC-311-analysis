from __future__ import annotations

import json
import pathlib
from datetime import datetime, timezone

import duckdb

PROJECT_ROOT = pathlib.Path(__file__).resolve().parents[1]
DUCKDB_PATH = PROJECT_ROOT / "data" / "processed" / "nyc311.duckdb"
SQL_PATH = PROJECT_ROOT / "EDA - SQL scripts" / "sql" / "06_dashboard_layer.sql"
EXTRACTS_DIR = PROJECT_ROOT / "dashboard" / "extracts"

EXTRACT_VIEWS = [
    "dash_kpi_header",
    "dash_pareto",
    "dash_priority_signals",
    "dash_priority_callouts",
    "dash_monthly_trend",
    "dash_agency_benchmark",
    "dash_equity_heatmap",
    "dash_qa_summary",
]


def main() -> None:
    EXTRACTS_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Opening DuckDB: {DUCKDB_PATH}")
    con = duckdb.connect(str(DUCKDB_PATH))

    print(f"Refreshing dashboard layer from {SQL_PATH.name} ...")
    con.execute(SQL_PATH.read_text())

    manifest: dict[str, object] = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "duckdb_path": str(DUCKDB_PATH.relative_to(PROJECT_ROOT)),
        "sql_path": str(SQL_PATH.relative_to(PROJECT_ROOT)),
        "extracts": [],
    }

    for view in EXTRACT_VIEWS:
        out_path = EXTRACTS_DIR / f"{view}.csv"
        rel_path = out_path.relative_to(PROJECT_ROOT)
        print(f"  -> {rel_path}")
        con.execute(
            f"COPY (SELECT * FROM {view}) TO '{out_path}' (HEADER, DELIMITER ',')"
        )
        row_count = con.execute(f"SELECT COUNT(*) FROM {view}").fetchone()[0]
        manifest["extracts"].append(
            {
                "view": view,
                "path": str(rel_path),
                "row_count": int(row_count),
            }
        )

    manifest_path = EXTRACTS_DIR / "_manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2))
    print(f"Wrote manifest: {manifest_path.relative_to(PROJECT_ROOT)}")

    con.close()
    print("Done.")


if __name__ == "__main__":
    main()

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_ROOT = path.resolve(__dirname, "..");
const EXTRACTS_DIR = path.resolve(APP_ROOT, "..", "extracts");
const OUT_DIR = path.resolve(APP_ROOT, "src", "data");

type Row = Record<string, string | number | boolean | null>;

type Extract = {
  view: string;
  csv: string;
  out: string;
  numericFields?: string[];
  booleanFields?: string[];
  dateFields?: string[];
};

const EXTRACTS: Extract[] = [
  {
    view: "dash_kpi_header",
    csv: "dash_kpi_header.csv",
    out: "kpiHeader.json",
    numericFields: [
      "total_complaints",
      "closed_complaints",
      "open_complaints",
      "closure_rate",
      "median_resolution_minutes",
      "median_resolution_hours",
      "agency_count",
      "category_count",
      "current_open_complaints",
      "prior_open_complaints",
      "backlog_growth_pct",
    ],
    dateFields: ["data_start", "data_end", "generated_at"],
  },
  {
    view: "dash_pareto",
    csv: "dash_pareto.csv",
    out: "pareto.json",
    numericFields: [
      "request_count",
      "open_count",
      "closed_count",
      "latest_count",
      "prior_count",
      "median_resolution_minutes",
      "city_median_resolution",
      "yoy_growth_pct",
      "backlog_ratio",
      "resolution_deviation_pct",
      "category_rank",
      "pct_of_total",
      "cumulative_pct",
    ],
  },
  {
    view: "dash_priority_signals",
    csv: "dash_priority_signals.csv",
    out: "prioritySignals.json",
    numericFields: [
      "latest_count",
      "latest_open",
      "latest_median_resolution",
      "prior_count",
      "prior_median_resolution",
      "city_median_resolution",
      "growth_pct",
      "backlog_ratio",
      "delay_pct",
      "equity_gap_pct",
      "growth_z",
      "backlog_z",
      "delay_z",
      "equity_z",
      "priority_score",
      "priority_percentile",
    ],
  },
  {
    view: "dash_priority_callouts",
    csv: "dash_priority_callouts.csv",
    out: "priorityCallouts.json",
    numericFields: ["value"],
  },
  {
    view: "dash_monthly_trend",
    csv: "dash_monthly_trend.csv",
    out: "monthlyTrend.json",
    numericFields: [
      "request_count",
      "rolling_3mo_avg",
      "rolling_12mo_avg",
      "monthly_zscore",
    ],
    booleanFields: ["anomaly_flag"],
    dateFields: ["created_month"],
  },
  {
    view: "dash_agency_benchmark",
    csv: "dash_agency_benchmark.csv",
    out: "agencyBenchmark.json",
    numericFields: [
      "closed_request_count",
      "median_resolution_minutes",
      "category_median_resolution",
      "city_median_resolution",
      "category_deviation_pct",
      "city_deviation_pct",
      "workload_normalized_resolution_rank",
    ],
    booleanFields: ["is_low_sample", "meets_min_sample_threshold"],
  },
  {
    view: "dash_equity_heatmap",
    csv: "dash_equity_heatmap.csv",
    out: "equityHeatmap.json",
    numericFields: [
      "closed_request_count",
      "median_resolution_minutes",
      "city_median_resolution",
      "city_deviation_pct",
      "q4_median",
      "q4_anchor_count",
      "gap_vs_q4_pct",
      "gap_vs_city_pct",
    ],
    booleanFields: ["is_low_sample", "gradient_monotonic"],
  },
  {
    view: "dash_qa_summary",
    csv: "dash_qa_summary.csv",
    out: "qaSummary.json",
    numericFields: ["value", "threshold"],
  },
];

function parseCSV(raw: string): Row[] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];

    if (inQuotes) {
      if (ch === '"') {
        if (raw[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      cur.push(field);
      field = "";
      continue;
    }
    if (ch === "\n") {
      cur.push(field);
      rows.push(cur);
      cur = [];
      field = "";
      continue;
    }
    if (ch === "\r") {
      continue;
    }
    field += ch;
  }
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }

  if (rows.length === 0) return [];
  const header = rows[0];
  return rows
    .slice(1)
    .filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ""))
    .map((r) => {
      const obj: Row = {};
      header.forEach((key, idx) => {
        obj[key] = r[idx] ?? "";
      });
      return obj;
    });
}

function coerce(rows: Row[], spec: Extract): Row[] {
  const numeric = new Set(spec.numericFields ?? []);
  const bool = new Set(spec.booleanFields ?? []);

  return rows.map((row) => {
    const out: Row = {};
    for (const [key, val] of Object.entries(row)) {
      const s = typeof val === "string" ? val.trim() : val;
      if (s === "" || s === null || s === undefined) {
        out[key] = null;
        continue;
      }
      if (numeric.has(key)) {
        const n = Number(s);
        out[key] = Number.isFinite(n) ? n : null;
        continue;
      }
      if (bool.has(key)) {
        out[key] = s === "true" || s === "True" || s === "1";
        continue;
      }
      out[key] = s as string;
    }
    return out;
  });
}

function main(): void {
  if (!existsSync(EXTRACTS_DIR)) {
    throw new Error(`Extracts directory not found: ${EXTRACTS_DIR}`);
  }
  if (!existsSync(OUT_DIR)) {
    mkdirSync(OUT_DIR, { recursive: true });
  }

  const summary: Array<{ out: string; rows: number }> = [];

  for (const spec of EXTRACTS) {
    const csvPath = path.join(EXTRACTS_DIR, spec.csv);
    if (!existsSync(csvPath)) {
      throw new Error(`Missing CSV extract: ${csvPath}`);
    }
    const raw = readFileSync(csvPath, "utf-8");
    const rows = coerce(parseCSV(raw), spec);
    const outPath = path.join(OUT_DIR, spec.out);
    writeFileSync(outPath, JSON.stringify(rows, null, 0), "utf-8");
    summary.push({ out: spec.out, rows: rows.length });
    console.log(`  ${spec.csv.padEnd(34)} -> ${spec.out.padEnd(24)} (${rows.length} rows)`);
  }

  const manifestPath = path.join(EXTRACTS_DIR, "_manifest.json");
  let upstream: unknown = null;
  if (existsSync(manifestPath)) {
    try {
      upstream = JSON.parse(readFileSync(manifestPath, "utf-8"));
    } catch {
      upstream = null;
    }
  }

  writeFileSync(
    path.join(OUT_DIR, "manifest.json"),
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        upstream_manifest: upstream,
        summary,
      },
      null,
      2,
    ),
    "utf-8",
  );

  console.log(`\nWrote ${summary.length} JSON modules to ${OUT_DIR}`);
}

main();

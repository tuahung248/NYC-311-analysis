import kpiHeaderRaw from "./kpiHeader.json";
import paretoRaw from "./pareto.json";
import prioritySignalsRaw from "./prioritySignals.json";
import priorityCalloutsRaw from "./priorityCallouts.json";
import monthlyTrendRaw from "./monthlyTrend.json";
import agencyBenchmarkRaw from "./agencyBenchmark.json";
import equityHeatmapRaw from "./equityHeatmap.json";
import qaSummaryRaw from "./qaSummary.json";

import type {
  KpiHeader,
  ParetoRow,
  PrioritySignalRow,
  PriorityCallout,
  MonthlyTrendRow,
  AgencyBenchmarkRow,
  EquityHeatmapRow,
  QaSummaryRow,
} from "@/types/dashboard";

export const kpiHeader = (kpiHeaderRaw as unknown as KpiHeader[])[0];
export const pareto = paretoRaw as unknown as ParetoRow[];
export const prioritySignals = prioritySignalsRaw as unknown as PrioritySignalRow[];
export const priorityCallouts = priorityCalloutsRaw as unknown as PriorityCallout[];
export const monthlyTrend = monthlyTrendRaw as unknown as MonthlyTrendRow[];
export const agencyBenchmark = agencyBenchmarkRaw as unknown as AgencyBenchmarkRow[];
export const equityHeatmap = equityHeatmapRaw as unknown as EquityHeatmapRow[];
export const qaSummary = qaSummaryRaw as unknown as QaSummaryRow[];

export const allCategories: string[] = Array.from(
  new Set(pareto.map((r) => r.operational_category)),
).sort();

export const allBoroughs: string[] = Array.from(
  new Set(monthlyTrend.map((r) => r.borough)),
)
  .filter((b) => b && b !== "UNKNOWN" && b !== "Unspecified")
  .sort();

export const allAgencies: string[] = Array.from(
  new Set(agencyBenchmark.map((r) => r.agency)),
).sort();

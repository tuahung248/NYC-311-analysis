import KpiCard from "@/components/layout/KpiCard";
import Card from "@/components/shared/Card";
import FilterBar from "@/components/shared/FilterBar";
import PageHeader from "@/components/shared/PageHeader";
import { kpiHeader } from "@/data";
import { fmtCompact, fmtPct, fmtSignedPct, fmtHours } from "@/lib/format";
import ParetoChart from "./ParetoChart";
import MonthlyTrend from "./MonthlyTrend";
import PriorityPanel from "./PriorityPanel";
import CalloutsRow from "./CalloutsRow";

export default function ExecutiveTriage() {
  const kpi = kpiHeader;
  const backlogTrend =
    kpi.backlog_growth_pct === null
      ? "flat"
      : kpi.backlog_growth_pct > 0
        ? "up"
        : kpi.backlog_growth_pct < 0
          ? "down"
          : "flat";

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Page 1 — Executive Triage"
        title="Where to focus next quarter"
        description="A four-card health snapshot, a top-of-stack priority queue, and the volume Pareto + trend underneath. Click a Pareto bar or a priority row to filter the rest of the dashboard."
      />

      <FilterBar show={{ category: true, borough: true, topN: true }} />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Total complaints"
          value={fmtCompact(kpi.total_complaints)}
          sublabel={`across ${kpi.category_count} categories`}
        />
        <KpiCard
          label="Median resolution"
          value={fmtHours(kpi.median_resolution_hours)}
          sublabel="city-wide median (skewed-safe)"
        />
        <KpiCard
          label="Closure rate"
          value={fmtPct(kpi.closure_rate)}
          sublabel="closed ÷ total"
          emphasize="good"
        />
        <KpiCard
          label="Open backlog"
          value={fmtCompact(kpi.current_open_complaints)}
          trend={backlogTrend as "up" | "down" | "flat"}
          trendLabel={fmtSignedPct(kpi.backlog_growth_pct)}
          sublabel="vs prior period"
          emphasize={kpi.backlog_growth_pct && kpi.backlog_growth_pct > 0 ? "bad" : "neutral"}
        />
      </section>

      <CalloutsRow />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card
          title="Volume Pareto"
          subtitle="Categories ranked by request count, with cumulative share"
          className="lg:col-span-3"
        >
          <ParetoChart />
        </Card>
        <Card
          title="Priority signals"
          subtitle="Critical / Watch / Stable, weighted from growth, backlog, delay, equity"
          className="lg:col-span-2"
          bodyClassName="p-0"
        >
          <PriorityPanel />
        </Card>
      </div>

      <Card
        title="Monthly trend"
        subtitle="Multi-line by category, anomalies marked"
      >
        <MonthlyTrend />
      </Card>
    </div>
  );
}

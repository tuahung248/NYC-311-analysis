import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { monthlyTrend, pareto } from "@/data";
import { useFilters } from "@/context/FilterContext";
import { fmtCount, fmtMonth, prettyCategory } from "@/lib/format";

const COLORS = [
  "#0072B2",
  "#D55E00",
  "#009E73",
  "#CC79A7",
  "#F0E442",
  "#56B4E9",
  "#E69F00",
  "#000000",
  "#9b5de5",
  "#3a86ff",
];

interface SeriesPoint {
  month: string;
  request_count: number;
  rolling_3mo_avg: number;
  anomaly: number | null;
}

export default function MonthlyTrend() {
  const { topN, category, borough } = useFilters();

  const { series, fastestGrowth } = useMemo(() => {
    const filtered = monthlyTrend.filter((row) => {
      if (borough !== "(All)" && row.borough !== borough) return false;
      return true;
    });

    const byCategory = new Map<string, SeriesPoint[]>();
    for (const row of filtered) {
      const key = row.operational_category;
      if (!byCategory.has(key)) byCategory.set(key, []);
      const arr = byCategory.get(key)!;
      const found = arr.find((p) => p.month === row.created_month);
      if (found) {
        found.request_count += row.request_count;
        if (row.anomaly_flag && found.anomaly === null) {
          found.anomaly = found.request_count;
        }
      } else {
        arr.push({
          month: row.created_month,
          request_count: row.request_count,
          rolling_3mo_avg: row.rolling_3mo_avg,
          anomaly: row.anomaly_flag ? row.request_count : null,
        });
      }
    }

    for (const arr of byCategory.values()) {
      arr.sort((a, b) => (a.month < b.month ? -1 : 1));
    }

    let cats: string[];
    if (category !== "(All)") {
      cats = [category];
    } else {
      const ranked = [...pareto]
        .sort((a, b) => b.request_count - a.request_count)
        .map((r) => r.operational_category);
      cats = ranked.slice(0, topN);
    }

    const months = Array.from(
      new Set(filtered.map((r) => r.created_month)),
    ).sort();

    const merged = months.map((m) => {
      const point: Record<string, string | number | null> = { month: m };
      for (const c of cats) {
        const arr = byCategory.get(c) ?? [];
        const found = arr.find((p) => p.month === m);
        point[c] = found ? found.request_count : null;
        point[`${c}__anom`] = found?.anomaly ?? null;
      }
      return point;
    });

    const fast = [...pareto]
      .filter((r) => r.yoy_growth_pct !== null)
      .sort((a, b) => (b.yoy_growth_pct ?? 0) - (a.yoy_growth_pct ?? 0))[0];

    return {
      series: merged,
      categories: cats,
      fastestGrowth: fast,
    };
  }, [borough, category, topN]);

  const cats =
    category !== "(All)"
      ? [category]
      : [...pareto]
          .sort((a, b) => b.request_count - a.request_count)
          .slice(0, topN)
          .map((r) => r.operational_category);

  return (
    <div className="space-y-2">
      <div className="rounded-md bg-ink-soft px-3 py-2 text-sm text-ink">
        <strong>
          Fastest-growing: {prettyCategory(fastestGrowth?.operational_category ?? "")}
        </strong>{" "}
        (+
        {(((fastestGrowth?.yoy_growth_pct ?? 0) as number) * 100).toFixed(1)}%
        YoY).
      </div>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={series}
            margin={{ top: 16, right: 24, bottom: 16, left: 8 }}
          >
            <CartesianGrid
              stroke="var(--neutral-grid)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "var(--neutral-text)" }}
              tickFormatter={(v: string) => fmtMonth(v)}
              minTickGap={32}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--neutral-text)" }}
              tickFormatter={(v: number) =>
                v >= 1_000_000
                  ? `${(v / 1_000_000).toFixed(1)}M`
                  : v >= 1_000
                    ? `${(v / 1_000).toFixed(0)}k`
                    : `${v}`
              }
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null;
                return (
                  <div className="rounded-md border border-ink-grid bg-white px-3 py-2 text-xs shadow-md">
                    <div className="font-semibold text-ink">
                      {fmtMonth(String(label))}
                    </div>
                    {payload
                      .filter((p) => !String(p.dataKey).endsWith("__anom"))
                      .map((p) => (
                        <div
                          key={p.dataKey}
                          className="flex items-center gap-2 text-ink-muted"
                        >
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ background: p.color }}
                          />
                          {prettyCategory(String(p.dataKey))}:{" "}
                          {fmtCount(p.value as number)}
                        </div>
                      ))}
                  </div>
                );
              }}
            />
            <Legend
              verticalAlign="top"
              height={28}
              iconSize={10}
              wrapperStyle={{ fontSize: 11 }}
              formatter={(v) => prettyCategory(String(v))}
            />
            {cats.map((c, i) => (
              <Line
                key={c}
                type="monotone"
                dataKey={c}
                name={c}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                connectNulls
              />
            ))}
            {cats.map((c, i) => (
              <Scatter
                key={`${c}-anom`}
                name={`${c} anomaly`}
                dataKey={`${c}__anom`}
                fill={COLORS[i % COLORS.length]}
                shape="diamond"
                isAnimationActive={false}
                legendType="none"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="text-[11px] italic text-ink-muted">
        Diamonds mark months with |z| ≥ 2 vs the category trend (anomaly flag
        from <code>dash_monthly_trend</code>).
      </div>
    </div>
  );
}

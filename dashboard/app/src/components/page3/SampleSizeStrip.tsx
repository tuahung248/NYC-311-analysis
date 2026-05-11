import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EquityHeatmapRow } from "@/types/dashboard";
import { fmtCount } from "@/lib/format";

interface Props {
  rows: EquityHeatmapRow[];
  minSample: number;
}

const QUARTILES = ["1", "2", "3", "4"] as const;
const BOROUGHS = ["BRONX", "BROOKLYN", "MANHATTAN", "QUEENS", "STATEN ISLAND"];

export default function SampleSizeStrip({ rows, minSample }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
      {BOROUGHS.map((b) => {
        const data = QUARTILES.map((q) => {
          const match = rows.find(
            (r) => r.borough === b && r.income_quartile === q,
          );
          return {
            quartile: `Q${q}`,
            count: match?.closed_request_count ?? 0,
            isLow: match?.is_low_sample ?? true,
          };
        });
        return (
          <div key={b} className="rounded-md border border-ink-grid bg-white p-3">
            <div className="mb-1 text-xs font-semibold text-ink">{b}</div>
            <div className="h-24 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{ top: 4, right: 0, bottom: 4, left: 0 }}
                >
                  <CartesianGrid
                    stroke="var(--neutral-grid)"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="quartile"
                    tick={{ fontSize: 10, fill: "var(--neutral-muted)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.04)" }}
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0)
                        return null;
                      const r = payload[0].payload as (typeof data)[number];
                      return (
                        <div className="rounded-md border border-ink-grid bg-white px-2 py-1 text-xs shadow-md">
                          {b} · {r.quartile}: {fmtCount(r.count)} closed
                          {r.isLow && (
                            <div className="text-[10px] text-state-watch">
                              Below n = {minSample}
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="count" isAnimationActive={false}>
                    {data.map((d) => (
                      <Cell
                        key={d.quartile}
                        fill={d.isLow ? "#cccccc" : "var(--accent-blue)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
}

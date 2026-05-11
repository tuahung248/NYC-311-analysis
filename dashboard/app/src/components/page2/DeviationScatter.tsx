import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { AgencyBenchmarkRow } from "@/types/dashboard";
import { fmtCount, fmtMinutes } from "@/lib/format";

interface Props {
  rows: AgencyBenchmarkRow[];
  baselineLabel: string;
  baselineValue: number;
}

const BAND_COLOR: Record<string, string> = {
  "Top Quartile (Fast)": "#0072B2",
  "Above Median": "#56B4E9",
  "Below Median": "#E69F00",
  "Bottom Quartile (Slow)": "#D55E00",
  "Insufficient Data": "#999999",
};

function isDohmh(agency: string): boolean {
  return agency.toUpperCase().startsWith("DOHMH");
}

export default function DeviationScatter({
  rows,
  baselineLabel,
  baselineValue,
}: Props) {
  const data = rows.map((r) => ({
    ...r,
    is_dohmh: isDohmh(r.agency),
    bubble: Math.max(20, Math.log10(r.closed_request_count + 1) * 100),
  }));

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 16, right: 24, bottom: 36, left: 8 }}>
          <CartesianGrid stroke="var(--neutral-grid)" strokeDasharray="3 3" />
          <XAxis
            dataKey="closed_request_count"
            type="number"
            scale="log"
            domain={["auto", "auto"]}
            tick={{ fontSize: 11, fill: "var(--neutral-text)" }}
            tickFormatter={(v: number) => fmtCount(v)}
            label={{
              value: "Closed records (log)",
              position: "bottom",
              offset: 8,
              fontSize: 11,
              fill: "var(--neutral-muted)",
            }}
          />
          <YAxis
            dataKey="median_resolution_minutes"
            type="number"
            tick={{ fontSize: 11, fill: "var(--neutral-text)" }}
            tickFormatter={(v: number) => fmtMinutes(v)}
            label={{
              value: "Median resolution",
              angle: -90,
              position: "insideLeft",
              fontSize: 11,
              fill: "var(--neutral-muted)",
            }}
          />
          <ZAxis dataKey="bubble" range={[40, 240]} />
          <ReferenceLine
            y={baselineValue}
            stroke="var(--neutral-text)"
            strokeDasharray="4 4"
            label={{
              value: baselineLabel,
              fontSize: 11,
              fill: "var(--neutral-text)",
              position: "insideTopRight",
            }}
          />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              const r = payload[0].payload as (typeof data)[number];
              return (
                <div className="rounded-md border border-ink-grid bg-white px-3 py-2 text-xs shadow-md">
                  <div className="font-semibold text-ink">
                    {r.agency}
                    {r.is_dohmh && (
                      <span
                        aria-hidden
                        className="ml-1 text-[#7a5400]"
                        title="DOHMH data-quality caveat"
                      >
                        &#9888;
                      </span>
                    )}{" "}
                    · {r.operational_category}
                  </div>
                  <div className="text-ink-muted">
                    Median: {fmtMinutes(r.median_resolution_minutes)}
                  </div>
                  <div className="text-ink-muted">
                    Closed: {fmtCount(r.closed_request_count)}
                  </div>
                  <div className="text-ink-muted">
                    Confidence: {r.confidence_label}
                  </div>
                  {r.is_dohmh && (
                    <div className="mt-1 rounded-sm bg-[#FCEBC9] px-1.5 py-0.5 text-[10px] font-semibold text-[#7a5400]">
                      &#9888; DOHMH data-quality caveat
                    </div>
                  )}
                </div>
              );
            }}
          />
          <Scatter
            name="Agencies"
            data={data}
            isAnimationActive={false}
            shape={(props: unknown) => {
              const p = props as {
                cx: number;
                cy: number;
                payload: (typeof data)[number];
              };
              const fill =
                BAND_COLOR[p.payload.percentile_band] ?? "#999999";
              const r = Math.sqrt(p.payload.bubble);
              return (
                <circle
                  cx={p.cx}
                  cy={p.cy}
                  r={Math.max(4, r)}
                  fill={fill}
                  fillOpacity={p.payload.is_low_sample ? 0.35 : 0.7}
                  stroke={fill}
                  strokeWidth={1.5}
                />
              );
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

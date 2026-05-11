import type { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: ReactNode;
  sublabel?: ReactNode;
  trend?: "up" | "down" | "flat" | null;
  trendLabel?: string;
  emphasize?: "good" | "bad" | "neutral";
}

export default function KpiCard({
  label,
  value,
  sublabel,
  trend = null,
  trendLabel,
  emphasize = "neutral",
}: KpiCardProps) {
  const trendColor =
    trend === "up"
      ? "text-state-watch"
      : trend === "down"
        ? "text-state-stable"
        : "text-ink-muted";
  const trendGlyph =
    trend === "up" ? "▲" : trend === "down" ? "▼" : trend === "flat" ? "■" : "";

  const valueColor =
    emphasize === "bad"
      ? "text-state-critical"
      : emphasize === "good"
        ? "text-accent-blue"
        : "text-ink";

  return (
    <div className="card flex flex-col justify-between p-4">
      <div className="text-[12px] font-medium uppercase tracking-wide text-ink-muted">
        {label}
      </div>
      <div className={`mt-2 text-[28px] font-bold leading-tight ${valueColor}`}>
        {value}
      </div>
      <div className="mt-1.5 flex items-center gap-2 text-[12px] leading-tight">
        {trend && (
          <span className={`font-semibold ${trendColor}`}>
            {trendGlyph} {trendLabel}
          </span>
        )}
        {sublabel && <span className="text-ink-muted">{sublabel}</span>}
      </div>
    </div>
  );
}

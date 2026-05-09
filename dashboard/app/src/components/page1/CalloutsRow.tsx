import { priorityCallouts } from "@/data";
import { fmtPct, prettyCategory } from "@/lib/format";
import type { CalloutFlagId } from "@/types/dashboard";

const ICON: Record<CalloutFlagId, string> = {
  fastest_growth: "▲",
  worsening_borough: "↗",
  highest_backlog: "■",
  overloaded_agency: "◆",
  equity_hotspot: "◉",
};

export default function CalloutsRow() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      {priorityCallouts.map((c) => {
        const display =
          c.flag_id === "overloaded_agency"
            ? `×${(c.value / 100).toFixed(1)}`
            : fmtPct(c.value, 1, false);
        const entityClean =
          c.flag_id === "overloaded_agency"
            ? c.entity.replace(/\((.+?)\)/, (_, cat: string) => `(${prettyCategory(cat)})`)
            : prettyCategory(c.entity);
        return (
          <div
            key={c.flag_id}
            className="card flex flex-col gap-1 p-3"
            aria-label={c.label}
          >
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
              <span aria-hidden className="text-state-critical">
                {ICON[c.flag_id]}
              </span>
              {c.label}
            </div>
            <div className="text-base font-semibold text-ink">
              {entityClean}
            </div>
            <div className="text-lg font-bold text-state-critical">
              {display}
            </div>
          </div>
        );
      })}
    </div>
  );
}

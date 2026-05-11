import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";
import { kpiHeader } from "@/data";
import { fmtDate } from "@/lib/format";

const NAV = [
  { to: "/triage", label: "1 Executive Triage", code: "01" },
  { to: "/agency", label: "2 Agency Benchmark", code: "02" },
  { to: "/equity", label: "3 Equity Lens", code: "03" },
] as const;

export default function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[#fafafa]">
      <header className="sticky top-0 z-30 border-b border-ink-grid bg-white">
        <div className="mx-auto flex h-16 w-full max-w-canvas items-center justify-between gap-6 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent-blue text-sm font-bold text-white">
              311
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-ink">
                NYC 311 Operations Intelligence
              </div>
              <div className="text-xs text-ink-muted">
                Decision-oriented prioritization &middot;{" "}
                {fmtDate(kpiHeader.data_start)} &rarr;{" "}
                {fmtDate(kpiHeader.data_end)}
              </div>
            </div>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  [
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-ink text-white"
                      : "text-ink hover:bg-ink-soft",
                  ].join(" ")
                }
              >
                <span className="mr-1.5 text-xs text-ink-muted">{n.code}</span>
                {n.label.replace(/^\d+\s/, "")}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="block border-t border-ink-grid md:hidden">
          <nav className="mx-auto flex w-full max-w-canvas gap-1 overflow-x-auto px-4 py-2">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  [
                    "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium",
                    isActive ? "bg-ink text-white" : "bg-ink-soft text-ink",
                  ].join(" ")
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-canvas px-6 py-6">
        {children}
      </main>

      <footer className="mx-auto w-full max-w-canvas px-6 pb-10 pt-4 text-xs text-ink-muted">
        Sources: NYC Open Data 311 Service Requests + ACS ZIP income quartiles.
        Workload-normalised agency comparisons &middot; median (not mean)
        resolution times &middot; calibration window 2024 vs 2023.
      </footer>
    </div>
  );
}

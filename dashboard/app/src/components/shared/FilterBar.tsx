import { useFilters } from "@/context/FilterContext";
import { allBoroughs, allCategories } from "@/data";
import { prettyCategory } from "@/lib/format";

interface Props {
  show?: {
    category?: boolean;
    borough?: boolean;
    baselineMode?: boolean;
    minSample?: boolean;
    topN?: boolean;
  };
  className?: string;
}

const SELECT_BASE =
  "h-9 rounded-md border border-ink-grid bg-white px-2 text-sm text-ink focus:border-accent-blue focus:outline-none focus:ring-2 focus:ring-accent-blue/30";

export default function FilterBar({ show, className }: Props) {
  const f = useFilters();
  const visible = {
    category: show?.category ?? true,
    borough: show?.borough ?? true,
    baselineMode: show?.baselineMode ?? false,
    minSample: show?.minSample ?? false,
    topN: show?.topN ?? false,
  };

  return (
    <div
      className={`flex flex-wrap items-end gap-3 rounded-lg border border-ink-grid bg-white p-3 ${className ?? ""}`}
    >
      {visible.category && (
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            Category
          </span>
          <select
            className={SELECT_BASE}
            value={f.category}
            onChange={(e) => f.setCategory(e.target.value)}
          >
            <option value="(All)">(All)</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {prettyCategory(c)}
              </option>
            ))}
          </select>
        </label>
      )}

      {visible.borough && (
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            Borough
          </span>
          <select
            className={SELECT_BASE}
            value={f.borough}
            onChange={(e) =>
              f.setBorough(e.target.value as typeof f.borough)
            }
          >
            <option value="(All)">(All)</option>
            {allBoroughs.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
      )}

      {visible.baselineMode && (
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            Baseline
          </span>
          <select
            className={SELECT_BASE}
            value={f.baselineMode}
            onChange={(e) =>
              f.setBaselineMode(e.target.value as typeof f.baselineMode)
            }
          >
            <option value="Category Median">Category Median</option>
            <option value="City Median">City Median</option>
          </select>
        </label>
      )}

      {visible.topN && (
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            Top N categories: <strong>{f.topN}</strong>
          </span>
          <input
            type="range"
            min={3}
            max={10}
            step={1}
            value={f.topN}
            onChange={(e) => f.setTopN(Number(e.target.value))}
            className="w-40 accent-accent-blue"
          />
        </label>
      )}

      {visible.minSample && (
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            Min sample: <strong>{f.minSample}</strong>
          </span>
          <input
            type="range"
            min={50}
            max={1000}
            step={50}
            value={f.minSample}
            onChange={(e) => f.setMinSample(Number(e.target.value))}
            className="w-40 accent-accent-blue"
          />
        </label>
      )}

      <button
        type="button"
        onClick={f.reset}
        className="ml-auto h-9 rounded-md border border-ink-grid px-3 text-sm font-medium text-ink hover:bg-ink-soft"
      >
        Reset filters
      </button>
    </div>
  );
}

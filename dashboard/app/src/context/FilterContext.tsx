/**
 * Cross-page filter state. Mirrors the Tableau parameters defined in
 * dashboard/build/02_parameters.md so behaviour matches the spec.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { FilterState } from "@/types/dashboard";

const DEFAULT_STATE: FilterState = {
  borough: "(All)",
  category: "(All)",
  baselineMode: "Category Median",
  topN: 5,
  minSample: 100,
  dateStart: "2022-01-01",
  dateEnd: "2024-12-01",
};

interface FilterContextValue extends FilterState {
  setBorough: (b: FilterState["borough"]) => void;
  setCategory: (c: FilterState["category"]) => void;
  setBaselineMode: (m: FilterState["baselineMode"]) => void;
  setTopN: (n: number) => void;
  setMinSample: (n: number) => void;
  setDateStart: (d: string) => void;
  setDateEnd: (d: string) => void;
  reset: () => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FilterState>(DEFAULT_STATE);

  const setBorough = useCallback(
    (borough: FilterState["borough"]) => setState((s) => ({ ...s, borough })),
    [],
  );
  const setCategory = useCallback(
    (category: FilterState["category"]) =>
      setState((s) => ({ ...s, category })),
    [],
  );
  const setBaselineMode = useCallback(
    (baselineMode: FilterState["baselineMode"]) =>
      setState((s) => ({ ...s, baselineMode })),
    [],
  );
  const setTopN = useCallback(
    (topN: number) => setState((s) => ({ ...s, topN })),
    [],
  );
  const setMinSample = useCallback(
    (minSample: number) => setState((s) => ({ ...s, minSample })),
    [],
  );
  const setDateStart = useCallback(
    (dateStart: string) => setState((s) => ({ ...s, dateStart })),
    [],
  );
  const setDateEnd = useCallback(
    (dateEnd: string) => setState((s) => ({ ...s, dateEnd })),
    [],
  );
  const reset = useCallback(() => setState(DEFAULT_STATE), []);

  const value = useMemo<FilterContextValue>(
    () => ({
      ...state,
      setBorough,
      setCategory,
      setBaselineMode,
      setTopN,
      setMinSample,
      setDateStart,
      setDateEnd,
      reset,
    }),
    [
      state,
      setBorough,
      setCategory,
      setBaselineMode,
      setTopN,
      setMinSample,
      setDateStart,
      setDateEnd,
      reset,
    ],
  );

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
}

export function useFilters(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters must be used inside <FilterProvider>");
  return ctx;
}

/**
 * Number / date formatting helpers used across the dashboard.
 */

const numberFmt = new Intl.NumberFormat("en-US");
const decimalFmt = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function fmtCount(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return numberFmt.format(Math.round(n));
}

export function fmtCompact(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return numberFmt.format(Math.round(n));
}

export function fmtPct(
  n: number | null | undefined,
  digits = 1,
  alreadyPct = false,
): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const v = alreadyPct ? n : n * 100;
  return `${v.toFixed(digits)}%`;
}

export function fmtSignedPct(
  n: number | null | undefined,
  digits = 1,
  alreadyPct = false,
): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const v = alreadyPct ? n : n * 100;
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(digits)}%`;
}

export function fmtMinutes(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  if (n >= 60 * 24) {
    const days = n / (60 * 24);
    return `${decimalFmt.format(days)} d`;
  }
  if (n >= 60) {
    const hours = n / 60;
    return `${decimalFmt.format(hours)} h`;
  }
  return `${Math.round(n)} min`;
}

export function fmtHours(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `${decimalFmt.format(n)} h`;
}

export function fmtDate(s: string | null | undefined): string {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function fmtMonth(s: string | null | undefined): string {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short" });
}

export function prettyCategory(s: string): string {
  return s
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

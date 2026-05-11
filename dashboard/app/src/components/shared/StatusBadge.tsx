import type { PriorityState, ConfidenceLabel } from "@/types/dashboard";

const STATE_STYLES: Record<
  PriorityState,
  { bg: string; fg: string; border: string; glyph: string; label: string }
> = {
  Critical: {
    bg: "bg-[#FBE4D6]",
    fg: "text-[#7a3300]",
    border: "border-state-critical",
    glyph: "▲",
    label: "Critical",
  },
  Watch: {
    bg: "bg-[#FCEBC9]",
    fg: "text-[#7a5400]",
    border: "border-state-watch",
    glyph: "◆",
    label: "Watch",
  },
  Stable: {
    bg: "bg-[#DCEFFA]",
    fg: "text-[#013a5b]",
    border: "border-state-stable",
    glyph: "■",
    label: "Stable",
  },
  "Insufficient Data": {
    bg: "bg-[#EDEDED]",
    fg: "text-ink-muted",
    border: "border-state-insufficient",
    glyph: "○",
    label: "Insufficient",
  },
};

export function StatusBadge({ state }: { state: PriorityState }) {
  const cfg = STATE_STYLES[state];
  return (
    <span
      className={`pill ${cfg.bg} ${cfg.fg} ${cfg.border}`}
      role="status"
      aria-label={`Priority state: ${cfg.label}`}
    >
      <span aria-hidden>{cfg.glyph}</span>
      {cfg.label}
    </span>
  );
}

const CONFIDENCE_STYLES: Record<
  ConfidenceLabel,
  { bg: string; fg: string; glyph: string }
> = {
  "High confidence": {
    bg: "bg-[#E2F1F9]",
    fg: "text-[#013a5b]",
    glyph: "●",
  },
  "Moderate confidence": {
    bg: "bg-[#FCEBC9]",
    fg: "text-[#7a5400]",
    glyph: "◐",
  },
  "Low confidence": {
    bg: "bg-[#EDEDED]",
    fg: "text-ink-muted",
    glyph: "○",
  },
};

export function ConfidencePill({ label }: { label: ConfidenceLabel }) {
  const cfg = CONFIDENCE_STYLES[label] ?? CONFIDENCE_STYLES["Low confidence"];
  return (
    <span className={`pill border-transparent ${cfg.bg} ${cfg.fg}`}>
      <span aria-hidden>{cfg.glyph}</span>
      {label}
    </span>
  );
}

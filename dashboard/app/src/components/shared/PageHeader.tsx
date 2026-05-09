import type { ReactNode } from "react";

interface Props {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  ribbon?: ReactNode;
}

export default function PageHeader({
  eyebrow,
  title,
  description,
  ribbon,
}: Props) {
  return (
    <header className="mb-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
            {eyebrow}
          </div>
          <h1 className="text-2xl font-bold leading-tight text-ink">{title}</h1>
          {description && (
            <p className="mt-1 max-w-3xl text-sm text-ink-muted">
              {description}
            </p>
          )}
        </div>
      </div>
      {ribbon && <div className="mt-3">{ribbon}</div>}
    </header>
  );
}

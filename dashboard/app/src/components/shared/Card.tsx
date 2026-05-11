import type { ReactNode } from "react";

interface CardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export default function Card({
  title,
  subtitle,
  toolbar,
  children,
  className,
  bodyClassName,
}: CardProps) {
  return (
    <section className={`card ${className ?? ""}`}>
      {(title || toolbar) && (
        <header className="card-header">
          <div className="min-w-0">
            {title && <div className="card-title truncate">{title}</div>}
            {subtitle && (
              <div className="card-subtle mt-0.5 truncate">{subtitle}</div>
            )}
          </div>
          {toolbar && <div className="ml-3 shrink-0">{toolbar}</div>}
        </header>
      )}
      <div className={`p-4 ${bodyClassName ?? ""}`}>{children}</div>
    </section>
  );
}

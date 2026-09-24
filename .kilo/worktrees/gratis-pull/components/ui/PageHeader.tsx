import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("max-w-3xl", className)}>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
          {eyebrow}
        </p>
      )}
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        {title}
      </h1>
      {description && (
        <p className="mt-3 text-base leading-7 text-muted">{description}</p>
      )}
      {actions && <div className="mt-5 flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="max-w-2xl">
        <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
          {title}
        </h2>
        {description && <p className="mt-1 text-sm leading-6 text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

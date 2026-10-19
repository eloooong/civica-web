import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
  size = "default",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  /**
   * `compact` is for dense record pages that sit under breadcrumbs: the title
   * steps down so it does not compete with the record name underneath it.
   */
  size?: "default" | "compact";
}) {
  return (
    <div className={cn("max-w-3xl", className)}>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
          {eyebrow}
        </p>
      )}
      <h1
        className={cn(
          "break-words font-bold tracking-tight text-ink",
          size === "compact" ? "mt-1 text-2xl sm:text-3xl" : "mt-1 text-3xl sm:text-4xl"
        )}
      >
        {title}
      </h1>
      {description && (
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base sm:leading-7">
          {description}
        </p>
      )}
      {actions && <div className="mt-5 flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

export function SectionHeader({
  id,
  eyebrow,
  title,
  description,
  action,
  large = false,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  large?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0 max-w-2xl">
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
            {eyebrow}
          </p>
        )}
        <h2
          id={id}
          className={
            large
              ? "break-words text-2xl font-extrabold tracking-tight text-ink sm:text-3xl"
              : "break-words text-xl font-bold tracking-tight text-ink sm:text-2xl"
          }
        >
          {title}
        </h2>
        {description && <p className="mt-1 text-sm leading-6 text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

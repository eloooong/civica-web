import { cn } from "@/lib/utils";

/**
 * Loading skeletons that mirror the shape of the real pages (header, stats,
 * tables/cards) so layout doesn't jump when data arrives.
 * `motion-safe:` keeps them static under prefers-reduced-motion.
 * Skeletons are aria-hidden; each loading route announces itself via role="status".
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("rounded-md bg-slate-200 motion-safe:animate-pulse", className)}
    />
  );
}

/** Breadcrumb-width line. */
export function CrumbSkeleton() {
  return <Skeleton className="h-4 w-44" />;
}

/** Eyebrow + title + description lines, like PageHeader. */
export function HeaderSkeleton({ titleWidth = "w-2/3" }: { titleWidth?: string }) {
  return (
    <div className="max-w-3xl space-y-3">
      <Skeleton className="h-3 w-36" />
      <Skeleton className={cn("h-9", titleWidth)} />
      <Skeleton className="h-4 w-full max-w-xl" />
      <Skeleton className="h-4 w-2/5" />
    </div>
  );
}

/** Row of stat cards. */
export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-lg border border-line bg-white p-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-8 w-32" />
          <Skeleton className="mt-2 h-3 w-40" />
        </div>
      ))}
    </div>
  );
}

/** Search/filter bar. */
export function FilterBarSkeleton() {
  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_180px_160px_auto]">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

/** Generic data table with header row. */
export function TableSkeleton({ rows = 6, cols = 3 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <div className="grid gap-3 border-b border-line bg-surface p-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} className="h-3 w-20" />
        ))}
      </div>
      <ul className="divide-y divide-line">
        {Array.from({ length: rows }, (_, i) => (
          <li
            key={i}
            className="grid items-center gap-3 p-4"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          >
            {Array.from({ length: cols }, (_, j) => (
              <Skeleton key={j} className={cn("h-4", j === 0 ? "w-3/4" : "w-1/2")} />
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Grid of content cards (bills, datasets, search results). */
export function CardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="rounded-lg border border-line bg-white p-5">
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="mt-3 h-5 w-full" />
          <Skeleton className="mt-2 h-5 w-5/6" />
          <Skeleton className="mt-2 h-5 w-2/3" />
          <Skeleton className="mt-4 h-4 w-24" />
        </li>
      ))}
    </ul>
  );
}

/** Two chart panels side by side. */
export function ChartsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-lg border border-line bg-white p-5">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="mt-4 h-64 w-full" />
        </div>
      ))}
    </div>
  );
}

/** Detail page: facts panel + sidebar. */
export function DetailSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="rounded-lg border border-line bg-white p-5">
        <Skeleton className="h-4 w-48" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex gap-4 border-b border-line pb-3 last:border-0">
              <Skeleton className="h-4 w-32 shrink-0" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </div>
      <div className="h-fit rounded-lg border border-line bg-white p-5">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-4/5" />
        <Skeleton className="mt-2 h-4 w-3/5" />
      </div>
    </div>
  );
}

/** Page shell shared by loading routes: announces loading to screen readers. */
export function LoadingShell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div role="status" aria-label={label} className="space-y-6">
        <span className="sr-only">{label}</span>
        {children}
      </div>
    </div>
  );
}

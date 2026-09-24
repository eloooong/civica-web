import type { LucideIcon } from "lucide-react";

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-line bg-white p-4 sm:p-5">
      <div className="flex items-center gap-2 text-muted">
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <p className="truncate text-xs font-semibold uppercase tracking-wider">{label}</p>
      </div>
      <p className="mt-2 truncate text-xl font-bold tracking-tight text-ink tabular-nums sm:text-2xl">{value}</p>
      {hint && <p className="mt-1 text-xs leading-5 text-muted">{hint}</p>}
    </div>
  );
}

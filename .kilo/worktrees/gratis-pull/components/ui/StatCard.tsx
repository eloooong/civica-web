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
    <div className="rounded-lg border border-line bg-white p-5">
      <div className="flex items-center gap-2 text-muted">
        <Icon className="h-4 w-4" aria-hidden="true" />
        <p className="text-xs font-semibold uppercase tracking-wider">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs leading-5 text-muted">{hint}</p>}
    </div>
  );
}

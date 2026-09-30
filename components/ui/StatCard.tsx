import type { LucideIcon } from "lucide-react";
import { CountUp, type CountFormat } from "@/components/motion/count-up";

export function StatCard({
  icon: Icon,
  label,
  value,
  valueNumber,
  valueFormat = "count",
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  /** Supplies the same figure as `value` for counting. Leave unset to render the string as given. */
  valueNumber?: number;
  valueFormat?: CountFormat;
  hint?: string;
}) {
  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-line bg-white p-4 sm:p-5">
      <div className="flex items-center gap-2 text-muted">
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <p className="truncate text-xs font-semibold uppercase tracking-wider">{label}</p>
      </div>
      <p className="mt-2 truncate text-2xl font-bold tracking-tight text-ink tabular-nums sm:text-3xl">
        {valueNumber === undefined ? value : <CountUp value={valueNumber} format={valueFormat} />}
      </p>
      {hint && <p className="mt-1 min-h-5 text-xs leading-5 text-muted">{hint}</p>}
    </div>
  );
}

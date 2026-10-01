import type { LucideIcon } from "lucide-react";
import { CountUp, type CountFormat } from "@/components/motion/count-up";

export interface StatCardDetailRow {
  label: string;
  value: string;
}

/**
 * Small labelled list pinned to the bottom of a stat card. Stat cards share a
 * row with a chart card and stretch to its height, so without a footer they
 * leave a tall empty gap under the hint. The rows come from the same fetched
 * data as the card, so nothing extra is requested.
 */
export interface StatCardDetails {
  caption: string;
  rows: StatCardDetailRow[];
}

export function StatCard({
  icon: Icon,
  label,
  value,
  valueNumber,
  valueFormat = "count",
  hint,
  details,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  /** Supplies the same figure as `value` for counting. Leave unset to render the string as given. */
  valueNumber?: number;
  valueFormat?: CountFormat;
  hint?: string;
  details?: StatCardDetails;
}) {
  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-line bg-white p-4 sm:p-5">
      <div className="flex items-start gap-2 text-muted">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p className="line-clamp-2 text-xs font-semibold uppercase tracking-wider">{label}</p>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-ink tabular-nums sm:text-3xl">
        {valueNumber === undefined ? value : <CountUp value={valueNumber} format={valueFormat} />}
      </p>
      {hint && <p className="mt-1 min-h-5 text-xs leading-5 text-muted">{hint}</p>}
      {details && details.rows.length > 0 && (
        <div className="mt-auto border-t border-line pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            {details.caption}
          </p>
          <ul className="mt-2 space-y-1.5 text-xs">
            {details.rows.map((row) => (
              <li key={row.label} className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-muted">{row.label}</span>
                <span className="shrink-0 font-semibold tabular-nums text-ink">{row.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

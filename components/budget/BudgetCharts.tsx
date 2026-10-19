"use client";

import { useMemo, type CSSProperties } from "react";
import { useReducedMotion } from "motion/react";
import { BarChart } from "@/components/charts/bar-chart";
import { Bar } from "@/components/charts/bar";
import { BarYAxis } from "@/components/charts/bar-y-axis";
import { ChartShell } from "@/components/charts/chart-shell";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip/chart-tooltip";
import type { DepartmentRow, ExpenseClassRow, NationalYearTotal } from "@/types/budget";
import {
  formatPesoCompact,
  formatPesoFull,
  formatShare,
} from "@/lib/utils";

const BRAND = "var(--chart-1)";

/** Native labels keep the exact values available without hover or JavaScript. */
function BudgetYearBars({ totals }: { totals: NationalYearTotal[] }) {
  const ordered = [...totals].sort((a, b) => a.year - b.year);
  const maximum = Math.max(...ordered.map((row) => row.amount), 1);
  return (
    <>
      <p className="text-sm leading-6 text-muted">Enacted allocation in Philippine pesos. T = trillion; B = billion.</p>
      <ol className="mt-5 space-y-3 sm:grid sm:min-h-80 sm:flex-1 sm:auto-cols-fr sm:grid-flow-col sm:gap-3 sm:space-y-0" aria-label="Enacted allocation by fiscal year">
        {ordered.map((row) => (
          <li key={row.year} className="grid grid-cols-[3rem_minmax(0,1fr)_5rem] items-center gap-3 text-sm sm:flex sm:flex-col">
            <span className="text-muted sm:order-3">{row.year}</span>
            <div className="flex h-3 items-end overflow-hidden rounded-sm bg-brand-50 sm:order-2 sm:h-auto sm:min-h-56 sm:w-full sm:flex-1" aria-hidden="true" style={{ "--bar-share": `${row.amount / maximum * 100}%` } as CSSProperties}>
              <span className="block h-full w-[var(--bar-share)] rounded-sm bg-brand-700 sm:h-[var(--bar-share)] sm:w-full" />
            </div>
            <span title={formatPesoFull(row.amount)} className="text-right font-semibold tabular-nums text-ink sm:order-1 sm:text-xs lg:text-sm">{formatPesoCompact(row.amount)}</span>
          </li>
        ))}
      </ol>
    </>
  );
}

/** National enacted budget trend, FY2020–2026. */
export function NationalTrendChart({ totals }: { totals: NationalYearTotal[] }) {
  return (
    <ChartShell title="National budget trend (enacted GAA)" captionId="national-trend-caption" summary="" accessibleContent contentClassName="flex flex-col">
      <BudgetYearBars totals={totals} />
    </ChartShell>
  );
}

/** Largest first, with full department names and values visible at every size. */
export function TopDepartmentsChart({ departments, year, limit = 10 }: {
  departments: DepartmentRow[];
  year: number;
  limit?: number;
}) {
  const top = [...departments].sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0)).slice(0, limit);
  const maximum = Math.max(...top.map((row) => row.amount ?? 0), 1);
  return (
    <ChartShell title={`Largest departments · FY ${year}`} captionId="top-depts-caption" summary="" accessibleContent>
      <p className="text-sm leading-6 text-muted">Enacted allocation in Philippine pesos, largest first.</p>
      <ol className="mt-4 space-y-4" aria-label={`Largest department allocations for FY ${year}`}>
        {top.map((row) => (
          <li key={row.id} className="text-sm">
            <div className="flex items-start justify-between gap-3">
              <span className="min-w-0 text-ink">{row.description}</span>
              <span title={formatPesoFull(row.amount ?? 0)} className="shrink-0 font-semibold tabular-nums text-ink">{formatPesoCompact(row.amount ?? 0)}</span>
            </div>
            <div className="mt-1.5 h-2 rounded-sm bg-brand-50" aria-hidden="true">
              <div className="h-full rounded-sm bg-brand-700" style={{ width: `${(row.amount ?? 0) / maximum * 100}%` }} />
            </div>
          </li>
        ))}
      </ol>
    </ChartShell>
  );
}

/** One department's enacted budget across the available fiscal years. */
export function DepartmentTrendChart({ totals }: { totals: NationalYearTotal[] }) {
  return (
    <ChartShell title="Budget trend (enacted GAA)" captionId="dept-trend-caption" summary="" accessibleContent contentClassName="flex flex-col">
      <BudgetYearBars totals={totals} />
    </ChartShell>
  );
}

const EXPENSE_SHORT: Record<string, string> = {
  "Personnel Services": "PS",
  "Maintenance and Other Operating Expenses": "MOOE",
  "Financial Expenses": "FinEx",
  "Capital Outlays": "CO",
};

/** Expense-class mix for one fiscal year, as sorted horizontal bars. */
export function ExpenseMixChart({
  classes,
  year,
}: {
  classes: ExpenseClassRow[];
  year: number;
}) {
  const yearKey = String(year);
  const reduced = useReducedMotion();
  const total = classes.reduce((sum, c) => sum + (c.years[yearKey]?.amount ?? 0), 0);
  const items = useMemo(
    () =>
      classes
        .map((c) => ({
          full: c.label,
          short: EXPENSE_SHORT[c.label] ?? c.label,
          amount: c.years[yearKey]?.amount ?? 0,
        }))
        .sort((a, b) => b.amount - a.amount),
    [classes, yearKey]
  );
  const summary = items
    .map((d) => `${d.full}: ${formatPesoCompact(d.amount)} (${total > 0 ? formatShare(d.amount / total) : "–"})`)
    .join("; ");
  return (
    <ChartShell
      title={`Where it goes · FY ${year}`}
      captionId="expense-mix-caption"
      summary={`Budget by expense class for FY ${year}. ${summary}.`}
    >
      <BarChart
        data={items.map((d) => ({ name: d.short, amount: d.amount / 1e9 }))}
        xDataKey="name"
        orientation="horizontal"
        aspectRatio="4 / 3"
        // Shared minimum height with the sibling chart keeps the pair even.
        // The gutter fits the truncated axis labels inside the chart.
        // No h-full here: the legend below needs the leftover card space,
        // and a full height chart would push the legend past the card edge.
        className="min-h-[320px] sm:min-h-[360px]"
        margin={{ top: 16, right: 16, bottom: 32, left: 72 }}
      >
        <Grid vertical />
        <Bar dataKey="amount" fill={BRAND} lineCap="round" animate={!reduced} />
        <BarYAxis />
        <ChartTooltip
          showDatePill={false}
          rows={(point) => {
            const item = items.find((d) => d.short === String(point.name));
            const amount = item?.amount ?? 0;
            return [
              { color: "#0038A8", label: item?.full ?? String(point.name), value: formatPesoFull(amount) },
              {
                color: "#5B8DEF",
                label: `Share of FY ${year}`,
                value: total > 0 ? formatShare(amount / total) : "–",
              },
            ];
          }}
        />
      </BarChart>
      <ul className="mt-4 space-y-2.5" aria-label="Expense class breakdown">
        {items.map((d) => (
          <li key={d.full} className="flex items-center gap-2.5 text-sm">
            <span
              aria-hidden="true"
              className="h-3 w-3 shrink-0 rounded-sm bg-brand-700"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-ink">{d.full}</span>
              <span className="block text-xs text-muted">
                {formatPesoCompact(d.amount)} · {total > 0 ? formatShare(d.amount / total) : "–"}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </ChartShell>
  );
}

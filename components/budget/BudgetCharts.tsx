"use client";

import { useMemo } from "react";
import { BarChart } from "@/components/charts/bar-chart";
import { Bar } from "@/components/charts/bar";
import { BarXAxis } from "@/components/charts/bar-x-axis";
import { BarYAxis } from "@/components/charts/bar-y-axis";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip/chart-tooltip";
import type { TooltipRow } from "@/components/charts/tooltip/tooltip-content";
import type { DepartmentRow, ExpenseClassRow, NationalYearTotal } from "@/types/budget";
import { deptShortName as shortDeptName, formatPesoCompact, formatPesoFull, formatShare, toTrillions } from "@/lib/utils";

const BRAND = "var(--chart-1)";

function ChartShell({
  title,
  captionId,
  summary,
  children,
}: {
  title: string;
  captionId: string;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <figure className="flex h-full min-w-0 flex-col rounded-lg border border-line bg-white p-5">
      <figcaption id={captionId} className="text-sm font-bold text-ink">
        {title}
      </figcaption>
      <p className="sr-only">{summary}</p>
      {/* Bklit charts render aria-hidden SVGs and size themselves. */}
      <div className="mt-4 min-h-0 flex-1" aria-hidden="true">
        {children}
      </div>
    </figure>
  );
}

/** Bklit tooltips show raw numbers — format peso values via custom rows. */
function pesoRow(color: string, label: string, trillions: number): TooltipRow {
  return { color, label, value: `₱${trillions.toFixed(2)} trillion` };
}

/** National enacted budget trend, FY2020–2026. */
export function NationalTrendChart({ totals }: { totals: NationalYearTotal[] }) {
  // Stable identity: Bklit chart internals sync derived state in effects,
  // so a fresh array every render would re-trigger them forever.
  const data = useMemo(
    () => totals.map((t) => ({ year: String(t.year), amount: toTrillions(t.amount) })),
    [totals]
  );
  const summary = totals.map((t) => `${t.year}: ${formatPesoCompact(t.amount)}`).join("; ");
  return (
    <ChartShell
      title="National budget trend (enacted GAA)"
      captionId="national-trend-caption"
      summary={`Enacted national budget per year. ${summary}.`}
    >
      <BarChart data={data} xDataKey="year" aspectRatio="2 / 1" className="h-full min-h-[320px] sm:min-h-[360px]">
        <Grid horizontal />
        <Bar dataKey="amount" fill={BRAND} lineCap="round" animate />
        <BarXAxis />
        <ChartTooltip
          showDatePill={false}
          rows={(point) => [
            pesoRow("#0038A8", `FY ${String(point.year)} enacted`, Number(point.amount)),
          ]}
        />
      </BarChart>
    </ChartShell>
  );
}

/** Top departments for one fiscal year, horizontal bars. */
export function TopDepartmentsChart({
  departments,
  year,
  limit = 10,
}: {
  departments: DepartmentRow[];
  year: number;
  limit?: number;
}) {
  const top = useMemo(
    () =>
      [...departments]
        .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))
        .slice(0, limit)
        .map((d) => ({ name: shortDeptName(d.description), amount: toTrillions(d.amount ?? 0) }))
        .reverse(),
    [departments, limit]
  );
  const summary = top.map((t) => `${t.name}: ₱${t.amount}T`).join("; ");
  return (
    <ChartShell
      title={`Largest departments · FY ${year}`}
      captionId="top-depts-caption"
      summary={`Largest department budgets for FY ${year}. ${summary}.`}
    >
      <BarChart
        data={top}
        xDataKey="name"
        orientation="horizontal"
        aspectRatio="4 / 3"
        // Roomy bands on phones: 10 labels at 12px need ~30px each, but a
        // 4/3 box only yields ~15px per band at 360px wide. The shared
        // minimum height keeps bands readable on phones and keeps the
        // chart pair even on desktop (ParentSize measures the real box).
        // h-full fills extra height when the sibling card stretches taller.
        className="h-full min-h-[320px] sm:min-h-[360px]"
        // Wide left gutter: axis labels truncate at 70px and right-align
        // into this gutter. The 40px default clips them past the card edge.
        margin={{ top: 16, right: 16, bottom: 32, left: 96 }}
      >
        <Grid vertical />
        <Bar dataKey="amount" fill={BRAND} lineCap="round" animate />
        <BarYAxis />
        <ChartTooltip
          showDatePill={false}
          rows={(point) => [
            pesoRow("#0038A8", `${String(point.name)} · FY ${year}`, Number(point.amount)),
          ]}
        />
      </BarChart>
    </ChartShell>
  );
}

/**
 * One department's enacted budget across FY2020–2026.
 * Rendered as categorical bars: Bklit's line chart is a time-series chart
 * whose axis labels ("Jan 1" style) cannot represent fiscal years.
 */
export function DepartmentTrendChart({ totals }: { totals: NationalYearTotal[] }) {
  const data = useMemo(
    () => totals.map((t) => ({ year: String(t.year), amount: toTrillions(t.amount) })),
    [totals]
  );
  const summary = totals.map((t) => `${t.year}: ${formatPesoCompact(t.amount)}`).join("; ");
  return (
    <ChartShell
      title="Budget trend (enacted GAA)"
      captionId="dept-trend-caption"
      summary={`Department enacted budget per year. ${summary}.`}
    >
      <BarChart data={data} xDataKey="year" aspectRatio="2 / 1" className="h-full min-h-[320px] sm:min-h-[360px]">
        <Grid horizontal />
        <Bar dataKey="amount" fill={BRAND} lineCap="round" animate />
        <BarXAxis />
        <ChartTooltip
          showDatePill={false}
          rows={(point) => [
            pesoRow("#0038A8", `FY ${String(point.year)} enacted`, Number(point.amount)),
          ]}
        />
      </BarChart>
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
        <Bar dataKey="amount" fill={BRAND} lineCap="round" animate />
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

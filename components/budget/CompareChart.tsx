"use client";

import { useMemo } from "react";
import { useReducedMotion } from "motion/react";
import { Bar } from "@/components/charts/bar";
import { BarChart } from "@/components/charts/bar-chart";
import { BarXAxis } from "@/components/charts/bar-x-axis";
import { ChartShell } from "@/components/charts/chart-shell";
import { Grid } from "@/components/charts/grid";
import { ChartTooltip } from "@/components/charts/tooltip/chart-tooltip";
import { formatPesoCompact, formatPesoFull } from "@/lib/utils";

/** One department plotted on the comparison chart. */
export interface CompareSeries {
  /** Row key holding this department's value, one key per series. */
  dataKey: string;
  /** Department name, already shortened. */
  label: string;
  color: string;
}

export interface CompareChartPoint {
  /** Fiscal year label, for example "2023". */
  year: string;
  /** Raw peso amounts, one key per series. */
  values: Record<string, number>;
}

/**
 * Two departments as grouped bars across fiscal years.
 *
 * Grouped rather than stacked: the reader is comparing magnitudes, and a
 * stacked bar would make the second department a remainder of the first.
 * Values are divided by 1e12 for the axis, and the tooltip carries the exact
 * peso figure, the same split the other budget charts use.
 *
 * Fiscal years stay categorical on the x axis. Bklit's line chart is a time
 * series whose labels render as dates, which cannot represent fiscal years.
 */
export function CompareChart({
  title,
  captionId,
  points,
  series,
  summary,
}: {
  title: string;
  captionId: string;
  points: CompareChartPoint[];
  series: CompareSeries[];
  summary: string;
}) {
  const reduced = useReducedMotion();
  const data = useMemo(
    () =>
      points.map((point) => {
        const row: Record<string, unknown> = { year: point.year };
        for (const s of series) {
          row[s.dataKey] = (point.values[s.dataKey] ?? 0) / 1e12;
        }
        return row;
      }),
    [points, series]
  );

  return (
    <ChartShell title={title} captionId={captionId} summary={summary} accessibleContent>
      <div aria-hidden="true">
        <BarChart
          data={data}
          xDataKey="year"
          aspectRatio="2 / 1"
          // No h-full: the legend below needs the leftover card space, and a
          // full height chart would push it past the card edge.
          className="min-h-[320px] sm:min-h-[360px]"
        >
          <Grid horizontal />
          {series.map((s) => (
            <Bar key={s.dataKey} dataKey={s.dataKey} fill={s.color} lineCap="round" animate={!reduced} />
          ))}
          <BarXAxis />
          <ChartTooltip
            showDatePill={false}
            rows={(point) =>
              series.map((s) => ({
                color: s.color,
                label: `${s.label} · FY ${String(point.year)}`,
                value: formatPesoCompact(Number(point[s.dataKey] ?? 0) * 1e12),
              }))
            }
          />
        </BarChart>
      </div>
      <ul className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2" aria-label="Departments compared">
        {series.map((s) => (
          <li key={s.dataKey} className="flex items-center gap-2 text-sm">
            <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-sm" style={{ background: s.color }} />
            <span className="font-semibold text-ink">{s.label}</span>
          </li>
        ))}
      </ul>
      <dl aria-label="Yearly comparison figures" className="mt-5 grid grid-cols-1 gap-x-5 gap-y-3 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-4">
        {points.map((point) => (
          <div key={point.year} className="text-sm">
            <dt className="font-semibold text-ink">FY {point.year}</dt>
            <dd className="mt-1 space-y-1">
              {series.map((entry) => (
                <div key={entry.dataKey} className="flex flex-wrap justify-between gap-x-2 text-muted">
                  <span>{entry.label}</span>
                  <span className="font-semibold tabular-nums text-ink" aria-label={formatPesoFull(point.values[entry.dataKey] ?? 0)} title={formatPesoFull(point.values[entry.dataKey] ?? 0)}>{formatPesoCompact(point.values[entry.dataKey] ?? 0)}</span>
                </div>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </ChartShell>
  );
}

export default CompareChart;

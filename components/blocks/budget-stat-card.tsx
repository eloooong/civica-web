"use client";

import { useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import { AreaChart } from "@/components/charts/area-chart";
import { Area } from "@/components/charts/area";
import { ChartStatFlow } from "@/components/charts/chart-stat-flow";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  StatCardChart,
  statCardLabelClassName,
  statCardValueClassName,
  type StatCardHoverState,
} from "./stat-card-chart";
import {
  formatStatCardYear,
  StatCardHoverBridge,
} from "./stat-card-hover-bridge";
import { TrendBadge } from "./trend-badge";

export interface BudgetSeriesPoint {
  year: number;
  amount: number;
}

/**
 * KPI card with an area sparkline of the yearly series and a trend badge.
 * Hovering the sparkline swaps the headline value/label/trend to that year.
 * Follows the Bklit stat-card-area block pattern, themed for CivicLens.
 */
export function BudgetStatCard({
  title,
  series,
  defaultLabel,
  defaultTrend,
}: {
  title: string;
  series: BudgetSeriesPoint[];
  defaultLabel: string;
  defaultTrend: number | null;
}) {
  const reduceMotion = useReducedMotion();
  const [hover, setHover] = useState<StatCardHoverState>({
    value: null,
    label: null,
    trend: null,
  });
  const data = useMemo(
    () => series.map((p) => ({ date: new Date(p.year, 0, 1), value: p.amount })),
    [series]
  );
  const last = series[series.length - 1];
  const displayValue = hover.value ?? last?.amount ?? 0;
  const displayLabel = hover.label ?? defaultLabel;
  const displayTrend = hover.trend ?? defaultTrend;

  return (
    <Card className="h-full w-full min-w-0 gap-0 border-line py-0 shadow-none">
      <CardHeader className="px-4 py-3">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted">
          {title}
        </CardTitle>
        <CardAction>
          {displayTrend !== null && <TrendBadge value={displayTrend} />}
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 px-4 pt-2 pb-3">
        <ChartStatFlow
          formatOptions={{ notation: "compact", maximumFractionDigits: 2 }}
          label={displayLabel}
          labelClassName={statCardLabelClassName}
          prefix="₱"
          value={displayValue}
          valueClassName={statCardValueClassName}
        />

        <StatCardChart size="sm">
          <AreaChart
            aspectRatio="2.5 / 1"
            className="w-full"
            data={data}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <StatCardHoverBridge
              dataKey="value"
              formatLabel={formatStatCardYear}
              onHoverChange={setHover}
            />
            <Area
              dataKey="value"
              fill="var(--chart-1)"
              fillOpacity={0.45}
              gradientToOpacity={0}
              showHighlight
              stroke="var(--chart-1)"
              strokeWidth={2}
              animate={!reduceMotion}
            />
          </AreaChart>
        </StatCardChart>
      </CardContent>
    </Card>
  );
}

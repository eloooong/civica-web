import { useChart } from "@/components/charts/chart-context";
import { useEffect, useRef } from "react";
import type { StatCardHoverState } from "./stat-card-chart";

export type { StatCardHoverState } from "./stat-card-chart";

/** "FY 2026" label for a January-1st fiscal-year date. */
export function formatStatCardYear(date: Date) {
  return `FY ${date.getFullYear()}`;
}

function parsePointDate(raw: unknown): Date | null {
  if (raw instanceof Date) {
    return raw;
  }
  if (typeof raw === "string") {
    return new Date(raw);
  }
  return null;
}

function computePeriodTrend(
  data: Record<string, unknown>[],
  index: number,
  dataKey: string
): number | null {
  if (index <= 0) {
    return null;
  }

  const current = data[index]?.[dataKey];
  const previous = data[index - 1]?.[dataKey];

  if (
    typeof current !== "number" ||
    typeof previous !== "number" ||
    previous === 0
  ) {
    return null;
  }

  return ((current - previous) / previous) * 100;
}

/** Syncs hovered chart values, labels, and trend into stat card UI. */
export function StatCardHoverBridge({
  dataKey,
  dateKey = "date",
  formatLabel,
  onHoverChange,
}: {
  dataKey: string;
  dateKey?: string;
  formatLabel: (date: Date) => string;
  onHoverChange: (state: StatCardHoverState) => void;
}) {
  const { data, tooltipData } = useChart();
  // Only propagate when the hover state actually changed. Without this,
  // every effect run sends a fresh object identity, which re-renders the
  // parent, which re-renders the chart, which re-fires this effect forever.
  const lastSent = useRef<StatCardHoverState>({ value: null, label: null, trend: null });

  useEffect(() => {
    let next: StatCardHoverState;
    if (!tooltipData?.point) {
      next = { value: null, label: null, trend: null };
    } else {
      const raw = tooltipData.point[dataKey];
      const value = typeof raw === "number" ? raw : null;
      const date = parsePointDate(tooltipData.point[dateKey]);
      const label = date ? formatLabel(date) : null;
      const trend = computePeriodTrend(data, tooltipData.index, dataKey);
      next = { value, label, trend };
    }
    const prev = lastSent.current;
    if (prev.value !== next.value || prev.label !== next.label || prev.trend !== next.trend) {
      lastSent.current = next;
      onHoverChange(next);
    }
  }, [data, dataKey, dateKey, formatLabel, onHoverChange, tooltipData]);

  return null;
}

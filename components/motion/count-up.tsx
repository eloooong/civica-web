"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "motion/react";
import { formatCount, formatPctDelta, formatPesoCompact } from "@/lib/utils";
import { DURATION_COUNTER, EASE_INSTITUTIONAL } from "./tokens";

/**
 * Counts a figure up when it scrolls into view.
 *
 * The real number is what renders on the server and before hydration, so a
 * reader never sees a placeholder standing in for a government figure, and
 * no-JS readers get the actual value. Zero is only ever shown once the
 * element is on screen, which is why this pairs with a reveal rather than
 * sitting alone in a heading.
 */

export type CountFormat = "peso-compact" | "count" | "percent";

const FORMATTERS: Record<CountFormat, (value: number) => string> = {
  "peso-compact": formatPesoCompact,
  count: formatCount,
  percent: formatPctDelta,
};

export function CountUp({
  value,
  format = "count",
  duration = DURATION_COUNTER,
  className,
}: {
  value: number;
  format?: CountFormat;
  duration?: number;
  className?: string;
}) {
  const formatValue = FORMATTERS[format];
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  // Latest frame written by the animation, or null before the first one.
  const [frame, setFrame] = useState<number | null>(null);
  const running = inView;

  // Government figures are whole numbers, so every intermediate frame is
  // rounded to one. Without this a single-digit counter climbing to 7 flashes
  // 3.667 on its way there, and a two-digit one flashes 14.829: toLocaleString
  // keeps up to three fraction digits, and on a short number they dominate the
  // figure. A fractional target keeps its decimals.
  const whole = Number.isInteger(value);

  // Deriving the start frame during render rather than resetting it from an
  // effect avoids a render that briefly shows the finished figure again.
  const display = running ? (frame ?? 0) : value;

  useEffect(() => {
    if (!running) return;
    const controls = animate(0, value, {
      duration,
      ease: EASE_INSTITUTIONAL,
      onUpdate: (latest) => setFrame(whole ? Math.round(latest) : latest),
    });
    return () => controls.stop();
  }, [running, value, duration, whole]);

  return (
    <span ref={ref} className={className}>
      {formatValue(display)}
    </span>
  );
}

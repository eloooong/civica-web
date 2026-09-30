"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";
import { formatCount, formatPesoCompact } from "@/lib/utils";
import { DURATION_COUNTER, EASE_INSTITUTIONAL } from "./tokens";

/**
 * Counts a figure up when it scrolls into view.
 *
 * The real number is what renders on the server and before hydration, so a
 * reader never sees a placeholder standing in for a government figure, and
 * no-JS readers get the actual value. Zero is only ever shown once the
 * element is on screen, which is why this pairs with a reveal rather than
 * sitting alone in a heading.
 *
 * Under reduced motion the value is simply present. There is no shortened
 * count and no shortened delay.
 */

export type CountFormat = "peso-compact" | "count";

const FORMATTERS: Record<CountFormat, (value: number) => string> = {
  "peso-compact": formatPesoCompact,
  count: formatCount,
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
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  // Latest frame written by the animation, or null before the first one.
  const [frame, setFrame] = useState<number | null>(null);
  const running = inView && !reduceMotion;

  // Deriving the start frame during render rather than resetting it from an
  // effect avoids a render that briefly shows the finished figure again.
  const display = running ? (frame ?? 0) : value;

  useEffect(() => {
    if (!running) return;
    const controls = animate(0, value, {
      duration,
      ease: EASE_INSTITUTIONAL,
      onUpdate: (latest) => setFrame(latest),
    });
    return () => controls.stop();
  }, [running, value, duration]);

  return (
    <span ref={ref} className={className}>
      {formatValue(display)}
    </span>
  );
}

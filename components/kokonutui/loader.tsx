"use client";

/**
 * KokonutUI `loader`, adapted on install.
 *
 * Upstream: https://kokonutui.com  (MIT)
 *
 * Four changes from upstream, all required by this project's contracts:
 *
 * 1. Reduced motion. Upstream runs four infinite rotation loops with no
 *    guard. Here `loop()` returns a zero-length, single-iteration
 *    transition. The animate *targets* are deliberately left untouched, so
 *    the first frame the server renders and the first frame the client
 *    renders are identical. Swapping the target instead would change SSR
 *    output and reintroduce the hydration mismatch this project already had.
 *
 * 2. Server rendering. Upstream sets `initial={{ opacity: 0, y: 12 }}` on
 *    the title and subtitle, which ships invisible text to crawlers and
 *    no-JS readers. The entrance animation is removed; the rings carry the
 *    motion, and the text is readable on the first paint.
 *
 * 3. Heading structure. Upstream renders the title as an `<h1>`, which
 *    nests a second level-one heading inside a loading state. It is a
 *    paragraph here.
 *
 * 4. Copy and palette. The upstream default reads "Configuring your
 *    account...", which is wrong for a government data site. The subtitle is
 *    now optional and omitted when not supplied. Colours use the project
 *    ink and muted tokens rather than hardcoded black.
 *
 * The eight near-identical ring blocks upstream are collapsed into one
 * `Ring`. The geometry and timing of each ring are unchanged.
 */

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
}

/** Ring radii as a percentage, outermost first. */
const RING_GRADIENTS = [
  "conic-gradient(from 0deg, transparent 0deg, rgb(0, 0, 0) 90deg, transparent 180deg)",
  "conic-gradient(from 0deg, transparent 0deg, rgb(0, 0, 0) 120deg, rgba(0, 0, 0, 0.5) 240deg, transparent 360deg)",
  "conic-gradient(from 180deg, transparent 0deg, rgba(0, 0, 0, 0.6) 45deg, transparent 90deg)",
  "conic-gradient(from 270deg, transparent 0deg, rgba(0, 0, 0, 0.4) 20deg, transparent 40deg)",
];

const RING_MASKS = [
  "radial-gradient(circle at 50% 50%, transparent 35%, black 37%, black 39%, transparent 41%)",
  "radial-gradient(circle at 50% 50%, transparent 42%, black 44%, black 48%, transparent 50%)",
  "radial-gradient(circle at 50% 50%, transparent 52%, black 54%, black 56%, transparent 58%)",
  "radial-gradient(circle at 50% 50%, transparent 61%, black 62%, black 63%, transparent 64%)",
];

const RING_OPACITIES = [0.8, 0.9, 0.35, 0.5];
const RING_DURATIONS = [3, 2.5, 4, 3.5];
const RING_DIRECTIONS = [1, 1, -1, 1];

export default function Loader({
  title = "Loading",
  subtitle,
  size = "md",
  className,
  ...props
}: LoaderProps) {
  const sizeConfig = {
    sm: {
      container: "size-20",
      titleClass: "text-sm/tight font-medium",
      subtitleClass: "text-xs/relaxed",
      spacing: "space-y-2",
      maxWidth: "max-w-48",
    },
    md: {
      container: "size-32",
      titleClass: "text-base/snug font-medium",
      subtitleClass: "text-sm/relaxed",
      spacing: "space-y-3",
      maxWidth: "max-w-56",
    },
    lg: {
      container: "size-40",
      titleClass: "text-lg/tight font-semibold",
      subtitleClass: "text-base/relaxed",
      spacing: "space-y-4",
      maxWidth: "max-w-64",
    },
  };

  const config = sizeConfig[size];

  /**
   * Timing only. Keeping `duration` and `repeat` as the sole variables is
   * what guarantees the server and client agree on the rendered frame.
   */
  const loop = (duration: number, ease: "linear" | [number, number, number, number] = "linear") => ({
    duration,
    repeat: Number.POSITIVE_INFINITY,
    ease,
  });

  return (
    <div className={cn("flex flex-col items-center justify-center gap-6 p-6", className)} {...props}>
      <motion.div
        animate={{ scale: [1, 1.02, 1] }}
        className={cn("relative", config.container)}
        transition={loop(4, [0.4, 0, 0.6, 1])}
      >
        {RING_GRADIENTS.map((gradient, i) => (
          <motion.div
            animate={{ rotate: [0, 360 * RING_DIRECTIONS[i]!] }}
            className="absolute inset-0 rounded-full"
            key={gradient}
            style={{
              background: gradient,
              mask: RING_MASKS[i],
              WebkitMask: RING_MASKS[i],
              opacity: RING_OPACITIES[i],
            }}
            transition={loop(RING_DURATIONS[i]!, i === 1 || i === 2 ? [0.4, 0, 0.6, 1] : "linear")}
          />
        ))}
      </motion.div>

      {/* No entrance animation, so the text is present in the server HTML. */}
      <div className={cn("text-center", config.spacing, config.maxWidth)}>
        <p className={cn(config.titleClass, "font-medium leading-[1.15] text-ink", "tracking-[-0.02em] antialiased")}>
          {title}
        </p>
        {subtitle && (
          <p className={cn(config.subtitleClass, "font-normal leading-[1.45] text-muted", "tracking-[-0.01em] antialiased")}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

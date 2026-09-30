"use client";

/**
 * KokonutUI `background-paths`, adapted on install.
 *
 * Upstream: https://kokonutui.com  (MIT)
 *
 * Upstream ships a complete hero section: its own `min-h-screen` wrapper, a
 * centred `AnimatedTitle` rendered as an `<h1>`, and a purple, pink and blue
 * gradient. On this site that would compete with the existing homepage hero
 * and add a second level-one heading. It is reduced here to what it is
 * actually good at, which is the drifting line layer.
 *
 * Changes from upstream:
 *
 * 1. Hydration. `generateUniqueId` called `Math.random()` and the result
 *    became React `key`s inside `useMemo`, so the server and the client
 *    produced different keys and a different DOM. Ids are now derived from
 *    the loop index. The gradient id comes from `useId`, which is stable
 *    across server and client, and which also stops two instances sharing
 *    one gradient.
 *
 * 2. Reduced motion. Upstream runs an infinite vertical drift per path with
 *    no guard. `loop()` below returns a zero-length, single-iteration
 *    transition instead. The animate targets are untouched on purpose: if
 *    the target changed with the preference, server and client would render
 *    different attributes.
 *
 * 3. Decoration only. The `min-h-screen` wrapper, the centred title block
 *    and the `<h1>` are gone, and the whole layer is `aria-hidden` and
 *    `pointer-events-none`.
 *
 * 4. Restraint. Path count is cut from 37 to 12, which is 12 infinite
 *    animations instead of 37. The palette is the project's own brand blue
 *    and amber on the hero blue, rather than upstream's purple and pink.
 *
 * 5. Float determinism. Coordinates are rounded to two decimals, because
 *    `Math.sin` and `Math.cos` are implementation-defined and Node and the
 *    browser can disagree in the last bit, which serialises to a different
 *    `d` attribute and trips a hydration mismatch. See `q` below.
 */

import { motion, useReducedMotion } from "motion/react";
import { memo, useId, useMemo } from "react";

interface Point {
  x: number;
  y: number;
}

type PathKind = "primary" | "secondary" | "accent";

/** Path counts, kept low so the drift stays cheap to composite. */
const PATH_COUNTS: Record<PathKind, number> = {
  primary: 4,
  secondary: 5,
  accent: 3,
};

const KIND_OPACITY: Record<PathKind, number> = {
  primary: 0.18,
  secondary: 0.14,
  accent: 0.1,
};

const KIND_WIDTH: Record<PathKind, number> = {
  primary: 3.5,
  secondary: 2.5,
  accent: 2,
};

/** Vertical travel in user units, and seconds per half cycle. */
const KIND_TRAVEL: Record<PathKind, number> = {
  primary: 15,
  secondary: 10,
  accent: 5,
};

const KIND_DURATION: Record<PathKind, number> = {
  primary: 8,
  secondary: 6,
  accent: 4,
};

/**
 * Quantise a coordinate to two decimals.
 *
 * `Math.sin` and `Math.cos` are implementation-defined, so Node and a
 * non-V8 browser can disagree in the final bit of a float. Serialised into
 * the `d` attribute that disagreement is visible: the server emitted
 * `1852.8000000000002` where the client produced `1852.7999999999997`, and
 * React reported a hydration mismatch on an attribute it will not patch.
 *
 * Two decimals is far below one pixel at this viewBox scale (4800 units
 * across a full-bleed hero), so rounding costs nothing visually and removes
 * the whole class of problem. It also shrinks the serialised path data by
 * roughly two thirds.
 */
function q(value: number): number {
  return Math.round(value * 100) / 100;
}

function generateAestheticPath(index: number, position: number, kind: PathKind): string {
  const baseAmplitude = kind === "primary" ? 150 : kind === "secondary" ? 100 : 60;
  const phase = index * 0.2;
  const segments = kind === "primary" ? 10 : kind === "secondary" ? 8 : 6;
  const points: Point[] = [];

  const startX = 2400;
  const startY = 800;
  const endX = -2400;
  const endY = -800 + index * 25;

  for (let i = 0; i <= segments; i++) {
    const progress = i / segments;
    const eased = 1 - (1 - progress) ** 2;

    const baseX = startX + (endX - startX) * eased;
    const baseY = startY + (endY - startY) * eased;

    const amplitudeFactor = 1 - eased * 0.3;
    const wave1 = Math.sin(progress * Math.PI * 3 + phase) * (baseAmplitude * 0.7 * amplitudeFactor);
    const wave2 = Math.cos(progress * Math.PI * 4 + phase) * (baseAmplitude * 0.3 * amplitudeFactor);
    const wave3 = Math.sin(progress * Math.PI * 2 + phase) * (baseAmplitude * 0.2 * amplitudeFactor);

    points.push({ x: baseX * position, y: baseY + wave1 + wave2 + wave3 });
  }

  const tension = 0.4;
  return points
    .map((point, i) => {
      if (i === 0) return `M ${q(point.x)} ${q(point.y)}`;
      const prev = points[i - 1]!;
      const cp1x = prev.x + (point.x - prev.x) * tension;
      const cp2x = prev.x + (point.x - prev.x) * (1 - tension);
      return `C ${q(cp1x)} ${q(prev.y)}, ${q(cp2x)} ${q(point.y)}, ${q(point.x)} ${q(point.y)}`;
    })
    .join(" ");
}

function PathLayer({
  kind,
  gradientId,
  reducedMotion,
}: {
  kind: PathKind;
  gradientId: string;
  reducedMotion: boolean;
}) {
  const paths = useMemo(
    () =>
      Array.from({ length: PATH_COUNTS[kind] }, (_, i) => ({
        id: `${kind}-${i}`,
        d: generateAestheticPath(i, 1, kind),
      })),
    [kind],
  );

  /**
   * Timing only. Keeping the animate target identical in both branches is
   * what makes the server and client render the same attributes.
   */
  const travel = KIND_TRAVEL[kind];
  const transition = reducedMotion
    ? { duration: 0, repeat: 0 }
    : {
        duration: KIND_DURATION[kind],
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut" as const,
        repeatType: "reverse" as const,
      };

  return (
    <g style={{ opacity: KIND_OPACITY[kind] }}>
      {paths.map((path) => (
        <motion.path
          animate={{ y: reducedMotion ? 0 : [0, -travel, 0] }}
          d={path.d}
          key={path.id}
          stroke={`url(#${gradientId})`}
          strokeLinecap="round"
          strokeWidth={KIND_WIDTH[kind]}
          transition={transition}
        />
      ))}
    </g>
  );
}

const PathLayerMemo = memo(PathLayer);

export default function BackgroundPaths({ className }: { className?: string }) {
  const gradientId = useId();
  // This version of Motion types the preference as boolean | null.
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
    >
      <svg
        className="h-full w-full"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        viewBox="-2400 -800 4800 1600"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" x2="100%" y1="0%" y2="0%">
            {/* brand-200 through to amber-300, legible on the hero blue */}
            <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="50%" stopColor="rgba(185,205,253,0.4)" />
            <stop offset="100%" stopColor="rgba(252,211,77,0.35)" />
          </linearGradient>
        </defs>

        <PathLayerMemo gradientId={gradientId} kind="primary" reducedMotion={reducedMotion} />
        <PathLayerMemo gradientId={gradientId} kind="secondary" reducedMotion={reducedMotion} />
        <PathLayerMemo gradientId={gradientId} kind="accent" reducedMotion={reducedMotion} />
      </svg>
    </div>
  );
}

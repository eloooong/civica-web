"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

/**
 * Ledger-grid hero backdrop with a subtle scroll parallax. The grid drifts
 * down slower than the page (transform only, so it stays on the GPU).
 *
 * Both server and client always render the same motion element with an
 * initial offset of 0, so hydration matches. When the user prefers reduced
 * motion the range collapses to [0, 0] and the backdrop stays frozen.
 */
export function HeroBackdrop() {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, reduceMotion ? 0 : 90]);

  return (
    <motion.div
      aria-hidden="true"
      style={{ y }}
      className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:2.75rem_2.75rem] [mask-image:radial-gradient(ellipse_70%_80%_at_50%_20%,black_30%,transparent_75%)]"
    />
  );
}

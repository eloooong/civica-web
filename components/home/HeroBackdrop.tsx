"use client";

import { motion, useScroll, useTransform } from "motion/react";
import BackgroundPaths from "@/components/kokonutui/background-paths";

/**
 * Homepage hero backdrop, in three layers: a drifting KokonutUI path layer,
 * a ledger grid, and a soft glow. The grid and the glow drift with scroll.
 *
 * The ambient loops are CSS keyframes or guarded KokonutUI components rather
 * than Motion `animate` props on this element. A Motion `animate` prop is
 * materialised into inline styles during server rendering, and those styles
 * do not reliably match the first client render, which produces a hydration
 * mismatch. Only the scroll parallax stays in Motion, because it genuinely
 * needs a scroll position.
 *
 * The grid travels exactly one tile per loop, so the pattern has no seam.
 */

export function HeroBackdrop() {
  const { scrollY } = useScroll();

  const gridY = useTransform(scrollY, [0, 600], [0, 90]);
  const glowY = useTransform(scrollY, [0, 600], [0, 150]);

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <BackgroundPaths />

      <motion.div
        style={{ y: gridY }}
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_70%_80%_at_50%_20%,black_30%,transparent_75%)] animate-grid-drift"
      />

      <motion.div style={{ y: glowY }} className="absolute inset-0">
        <div className="absolute inset-0 origin-top bg-[radial-gradient(ellipse_60%_55%_at_50%_0%,rgba(255,255,255,0.20),transparent_70%)] animate-glow-breathe" />
      </motion.div>
    </div>
  );
}

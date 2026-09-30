"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

/**
 * Homepage hero backdrop: a ledger grid and a soft glow, both drifting with
 * the scroll.
 *
 * The ambient loops are CSS keyframes rather than Motion animations on
 * purpose. A Motion `animate` prop is materialised into inline styles during
 * server rendering, and those styles do not reliably match the first client
 * render once the motion preference is taken into account, which produces a
 * hydration mismatch. CSS emits no inline style at all, so the server and
 * client agree by construction, and the existing reduced-motion block in
 * globals.css already switches the loops off.
 *
 * Only the scroll parallax stays in Motion, because it genuinely needs a
 * scroll position. It resolves to zero on both the server and the first
 * client render, so it stays in agreement.
 *
 * The grid travels exactly one tile per loop, so the pattern has no seam.
 */

export function HeroBackdrop() {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();

  const gridY = useTransform(scrollY, [0, 600], [0, reduceMotion ? 0 : 90]);
  const glowY = useTransform(scrollY, [0, 600], [0, reduceMotion ? 0 : 150]);

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <motion.div
        style={{ y: gridY }}
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_70%_80%_at_50%_20%,black_30%,transparent_75%)] motion-safe:animate-grid-drift"
      />

      <motion.div style={{ y: glowY }} className="absolute inset-0">
        <div className="absolute inset-0 origin-top bg-[radial-gradient(ellipse_60%_55%_at_50%_0%,rgba(255,255,255,0.20),transparent_70%)] motion-safe:animate-glow-breathe" />
      </motion.div>
    </div>
  );
}

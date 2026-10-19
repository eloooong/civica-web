"use client";

import { useInView } from "motion/react";
import { useRef, useSyncExternalStore } from "react";
import { GridScan } from "@/components/reactbits/GridScan";
import { usePrefersReducedMotion } from "@/components/motion/use-prefers-reduced-motion";

function subscribeToVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

function isDocumentVisible() {
  return !document.hidden;
}

/** Ambient motion rests when the hero is offscreen or the reader requests it. */
export function HeroBackdrop() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.05 });
  const reduced = usePrefersReducedMotion();
  const visible = useSyncExternalStore(subscribeToVisibility, isDocumentVisible, () => false);
  const active = inView && visible && !reduced;

  return (
    <div ref={ref} aria-hidden="true" data-hero-motion={active ? "active" : "resting"} className="pointer-events-none absolute inset-0 overflow-hidden">
      <GridScan
        paused={!active}
        linesColor="#7aa7ff"
        scanColor="#b9cdfd"
        cells={7}
        lineThickness={0.8}
        depth={2.5}
        parallax={0.25}
        points={false}
        reflection={0.15}
        shading={0.35}
        scanDuration={4}
        scanDelay={2}
        scanWidth={0.8}
        trail={0.3}
        glow={0.15}
        interactive={!reduced}
        clickEffect="none"
        intro={false}
        dpr={1}
        className="opacity-80"
      />
      <div className="absolute inset-0 bg-brand-900/65" />
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Transition } from "motion/react";
import { DURATION_BASE, EASE_INSTITUTIONAL, EASE_STANDARD } from "./tokens";

/**
 * Crossfades between routes.
 *
 * This lives in the root layout rather than a template so the exiting page
 * stays mounted long enough to finish its exit. A template remounts on every
 * navigation, which would cut the exit animation off.
 *
 * The exit is deliberately much shorter than the entrance. Readers paging
 * through results should feel the new page arrive, not wait on the old one.
 *
 * Reduced motion is expressed as a zero-length transition, never as a
 * different element tree. useReducedMotion reads a media query the server
 * cannot evaluate, so returning a different tree from it makes the server
 * markup and the first client render disagree. React then discards the whole
 * page and rebuilds it, which is both a hydration error and a visible
 * flicker. The wrapper renders unconditionally and only the timing changes.
 */

const ENTER: Transition = { duration: DURATION_BASE, ease: EASE_INSTITUTIONAL };
const EXIT: Transition = { duration: 0.12, ease: EASE_STANDARD };
const NONE: Transition = { duration: 0 };

export function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  // Opacity starts at 1 under reduced motion so the incoming page is never
  // even momentarily transparent.
  const offset = reduceMotion ? 0 : 10;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: reduceMotion ? 1 : 0, y: offset }}
        animate={{ opacity: 1, y: 0, transition: reduceMotion ? NONE : ENTER }}
        exit={{ opacity: 0, transition: reduceMotion ? NONE : EXIT }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

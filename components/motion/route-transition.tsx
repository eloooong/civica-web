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
 */

const ENTER: Transition = { duration: DURATION_BASE, ease: EASE_INSTITUTIONAL };
const EXIT: Transition = { duration: 0.12, ease: EASE_STANDARD };

export function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0, transition: reduced ? { duration: 0 } : ENTER }}
        exit={{ opacity: 0, transition: reduced ? { duration: 0 } : EXIT }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

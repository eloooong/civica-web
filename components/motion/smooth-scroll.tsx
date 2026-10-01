"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Momentum scrolling for the whole document.
 *
 * Lenis wraps the browser's own scroll rather than replacing it, so position:
 * sticky, the scrollbar, keyboard paging, and find-in-page all keep working.
 * This component renders nothing. It exists only to own the instance's
 * lifetime, which is why it lives in the root layout instead of a page.
 *
 * Contract for reduced motion: a reader who asks for less motion never gets an
 * instance at all. Lenis defaults to staying alive and merely forcing the
 * smoothing off, which still costs a requestAnimationFrame loop for the life of
 * the page, so the instance is created and destroyed around the media query
 * here instead. The preference is picked up live, without a reload.
 *
 * Contract for the server: the component renders null, so it adds nothing to
 * the shipped markup. Anchor jumps keep working before hydration through the
 * plain scroll-behavior rule in globals.css.
 *
 * Lenis resolves an anchor target by reading scroll-padding-top off the
 * document element, so the existing 5rem offset that stops the sticky navbar
 * from covering a jump target is honoured without a second offset to maintain.
 */

/** The same query the reduced-motion block in globals.css keys off. */
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function SmoothScroll() {
  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    let lenis: Lenis | null = null;

    function start() {
      if (lenis) return;
      lenis = new Lenis({
        // Lenis owns the frame loop, and destroy() cancels it, so this
        // component never holds a requestAnimationFrame id of its own.
        autoRaf: true,
        // Lenis cancels anchor clicks while it is running, which would break
        // the skip link. Turning this on routes them through lenis.scrollTo.
        anchors: true,
        // Wheel input is smoothed. Touch input is deliberately left native:
        // these pages are long and table-heavy, and Lenis documents that
        // syncTouch misbehaves on iOS below 16.
        smoothWheel: true,
        syncTouch: false,
        // An internal link drops any momentum still in flight, so a page
        // cannot keep gliding while RouteTransition crossfades to the next one.
        stopInertiaOnNavigate: true,
      });
    }

    function stop() {
      lenis?.destroy();
      lenis = null;
    }

    function sync() {
      if (query.matches) {
        stop();
      } else {
        start();
      }
    }

    sync();
    query.addEventListener("change", sync);

    return () => {
      query.removeEventListener("change", sync);
      stop();
    };
  }, []);

  return null;
}

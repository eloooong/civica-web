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
 * Contract for the server: the component renders null, so it adds nothing to
 * the shipped markup. Anchor jumps keep working before hydration through the
 * plain scroll-behavior rule in globals.css.
 *
 * Lenis resolves an anchor target by reading scroll-padding-top off the
 * document element, so the existing 5rem offset that stops the sticky navbar
 * from covering a jump target is honoured without a second offset to maintain.
 */

export function SmoothScroll() {
  useEffect(() => {
    // Lenis owns the frame loop, and destroy() cancels it, so this component
    // never holds a requestAnimationFrame id of its own.
    const lenis = new Lenis({
      autoRaf: true,
      // Lenis cancels anchor clicks while it is running, which would break
      // the skip link. Turning this on routes them through lenis.scrollTo.
      anchors: true,
      // Follow the reader's operating-system preference, including changes
      // made while the page is open.
      respectReducedMotion: true,
      // Exponential follow rather than a fixed-duration tween. The library
      // default is 0.1, which reads a touch abrupt on pages this long; 0.075
      // lets a single flick coast instead of stopping dead.
      lerp: 0.075,
      // Slightly under 1:1 so one notch of a mouse wheel travels a little
      // less than the platform's own step, which keeps the tables readable.
      wheelMultiplier: 0.9,
      // Touch input is smoothed too, otherwise phones (most of the traffic)
      // get none of this. Lenis documents syncTouch as unreliable below
      // iOS 16, where touch then falls back to the native scroller.
      syncTouch: true,
      syncTouchLerp: 0.075,
      // A finger covers far less ground than a wheel notch, so it needs more
      // distance per gesture to reach the same scroll speed.
      touchMultiplier: 1.4,
      // An internal link drops any momentum still in flight, so a page
      // cannot keep gliding while RouteTransition crossfades to the next one.
      stopInertiaOnNavigate: true,
    });

    return () => lenis.destroy();
  }, []);

  return null;
}

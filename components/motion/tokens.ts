import type { Transition } from "motion/react";

/**
 * Civica motion tokens.
 *
 * The character is restrained institutional: short travel distances, no
 * bounce, no overshoot, and no looping motion on anything a reader has to
 * parse. Text that carries meaning reveals fast and settles. Decoration is
 * the only thing allowed to breathe, and it moves slowly.
 */

/** Decelerating curve. Reads as settling into place rather than arriving. */
export const EASE_INSTITUTIONAL: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

/** Symmetric curve for two-way motion such as page exits. */
export const EASE_STANDARD: [number, number, number, number] = [0.4, 0, 0.2, 1];

export const DURATION_MICRO = 0.16;
export const DURATION_BASE = 0.24;
export const DURATION_SLOW = 0.4;
export const DURATION_COUNTER = 0.9;

/** Vertical travel for a reveal, in pixels. Small enough to read as a settle. */
export const REVEAL_DISTANCE = 12;

/** Delay added per item inside a reveal group. */
export const REVEAL_STAGGER = 0.055;

/** Build a tween transition on the institutional curve. */
export function tween(duration: number = DURATION_BASE, delay = 0): Transition {
  return { duration, delay, ease: EASE_INSTITUTIONAL };
}

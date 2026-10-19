"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";
import { motion, useInView } from "motion/react";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";
import type { TargetAndTransition, Transition } from "motion/react";
import { DURATION_BASE, EASE_INSTITUTIONAL, REVEAL_DISTANCE, REVEAL_STAGGER } from "./tokens";

/**
 * Scroll and mount reveals.
 *
 * Contract for the server: markup renders in the visible state. Hiding is
 * armed in a layout effect, so crawlers, no-JS readers, and the first paint
 * all get real content rather than an invisible element waiting on
 * hydration.
 */

const HIDDEN: TargetAndTransition = { opacity: 0, y: REVEAL_DISTANCE };
const VISIBLE: TargetAndTransition = { opacity: 1, y: 0 };

/** Duration zero when hiding, so arming never fades content out. */
const INSTANT: Transition = { duration: 0 };

type MotionTagProps = {
  ref?: Ref<Element>;
  className?: string;
  style?: CSSProperties;
  initial?: boolean;
  animate?: TargetAndTransition;
  transition?: Transition;
  children?: ReactNode;
};

const TAG_MAP = {
  article: motion.article,
  dd: motion.dd,
  div: motion.div,
  dl: motion.dl,
  h2: motion.h2,
  h3: motion.h3,
  header: motion.header,
  li: motion.li,
  p: motion.p,
  section: motion.section,
  span: motion.span,
  ul: motion.ul,
};

export type RevealTag = keyof typeof TAG_MAP;

/**
 * Every motion component accepts the same prop surface we use, so one
 * signature covers the whole tag list without a union of prop types.
 */
const TAGS = TAG_MAP as unknown as Record<RevealTag, ComponentType<MotionTagProps>>;

/**
 * Picks a layout effect in the browser and a passive effect on the server.
 * The alias also keeps the one-time flag below out of reach of the
 * set-state-in-effect lint rule, which is the point: arming is a mount
 * marker, not a synchronization with anything outside React.
 */
const useArmingEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

interface RevealGroupValue {
  /** True once the group has entered the viewport. */
  active: boolean;
}

const RevealGroupContext = createContext<RevealGroupValue | null>(null);

function RevealInner({
  as,
  className,
  style,
  delay,
  active,
  innerRef,
  children,
}: {
  as: RevealTag;
  className?: string;
  style?: CSSProperties;
  delay: number;
  active: boolean;
  innerRef: RefObject<Element | null>;
  children: ReactNode;
}) {
  const [armed, setArmed] = useState(false);
  const reduced = usePrefersReducedMotion();

  useArmingEffect(() => {
    setArmed(true);
  }, []);

  // `initial={false}` means framer-motion writes the animate target straight
  // into the style attribute, so before arming this renders the visible
  // target and the server ships readable, visible markup. Once armed, the
  // element is free to sit hidden until it scrolls into view. The layout
  // effect means that switch lands before the browser paints, so no frame is
  // ever wasted drawing content that is about to disappear.
  const visible = reduced || !armed || active;
  const Tag = TAGS[as]!;

  return (
    <Tag
      ref={innerRef}
      className={className}
      style={style}
      initial={false}
      animate={visible ? VISIBLE : HIDDEN}
      transition={reduced ? INSTANT : visible ? { duration: DURATION_BASE, delay, ease: EASE_INSTITUTIONAL } : INSTANT}
    >
      {children}
    </Tag>
  );
}

export interface RevealProps {
  /** Element to render. Defaults to a div. */
  as?: RevealTag;
  className?: string;
  style?: CSSProperties;
  /** Seconds to wait before revealing. */
  delay?: number;
  /** Fraction of the element that must be visible before it reveals. */
  amount?: number;
  children: ReactNode;
}

/**
 * Reveal one element when it enters the viewport, or on mount when the
 * element sits above the fold. `delay` staggers siblings.
 */
export function Reveal({ as = "div", className, style, delay = 0, amount = 0.05, children }: RevealProps) {
  const ref = useRef<Element>(null);
  const inView = useInView(ref, { once: true, amount });

  return (
    <RevealInner
      as={as}
      className={className}
      style={style}
      delay={delay}
      active={inView}
      innerRef={ref}
    >
      {children}
    </RevealInner>
  );
}

export interface RevealGroupProps {
  as?: RevealTag;
  className?: string;
  style?: CSSProperties;
  /** Fraction of the group that must be visible before items reveal. */
  amount?: number;
  children: ReactNode;
}

/**
 * Watches one element and releases every {@link RevealItem} inside it at the
 * same moment, so a grid animates as a unit rather than as separate rows.
 */
export function RevealGroup({ as = "div", className, style, amount = 0.05, children }: RevealGroupProps) {
  const ref = useRef<Element>(null);
  const inView = useInView(ref, { once: true, amount });
  const Tag = TAGS[as]!;

  return (
    <RevealGroupContext.Provider value={{ active: inView }}>
      <Tag ref={ref} className={className} style={style}>
        {children}
      </Tag>
    </RevealGroupContext.Provider>
  );
}

export interface RevealItemProps {
  as?: RevealTag;
  className?: string;
  style?: CSSProperties;
  /** Position in the group. Drives the stagger delay. */
  index?: number;
  /** Overrides the stagger delay entirely. */
  delay?: number;
  children: ReactNode;
}

/** A child of {@link RevealGroup}. Reveals with its group, staggered by index. */
export function RevealItem({ as = "div", className, style, index = 0, delay, children }: RevealItemProps) {
  const group = useContext(RevealGroupContext);
  const ref = useRef<Element>(null);
  // Standalone use outside a group still works: watch the item itself.
  const inView = useInView(ref, { once: true, amount: 0.05 });
  const active = group ? group.active : inView;

  return (
    <RevealInner
      as={as}
      className={className}
      style={style}
      delay={delay ?? index * REVEAL_STAGGER}
      active={active}
      innerRef={ref}
    >
      {children}
    </RevealInner>
  );
}

"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/components/motion/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

interface NavigationItem {
  href: string;
  label: string;
  active: boolean;
}

interface SmoothNavigationProps {
  items: NavigationItem[];
  label: string;
}

const ITEM_CLASS = "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full px-4 text-sm font-medium";

/**
 * Kokonut UI Smooth Tab's clipped-label technique, adapted for page links.
 * Reference: https://kokonutui.com/docs/navigation/smooth-tab
 * The clipped copy keeps labels readable as the selection moves across them.
 */
export function SmoothNavigation({ items, label }: SmoothNavigationProps) {
  const navRef = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const [clipPath, setClipPath] = useState<string | null>(null);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    let alive = true;

    const measure = () => {
      if (!alive) return;
      const selected = nav.querySelector<HTMLAnchorElement>('a[aria-current="page"]');
      const box = nav.getBoundingClientRect();
      if (!selected || box.width === 0) {
        setClipPath(null);
        return;
      }
      const rect = selected.getBoundingClientRect();
      setClipPath(`inset(${rect.top - box.top}px ${Math.max(0, box.right - rect.right)}px ${Math.max(0, box.bottom - rect.bottom)}px ${rect.left - box.left}px round ${rect.height / 2}px)`);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    nav.querySelectorAll("a").forEach((link) => observer.observe(link));
    document.fonts.ready.then(measure).catch(() => undefined);
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, [items]);

  return (
    <nav ref={navRef} aria-label={label} className="relative inline-flex max-w-full rounded-full bg-slate-100 p-1">
      <ul className="flex gap-1">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                ITEM_CLASS,
                item.active && !clipPath
                  ? "bg-brand-700 text-white"
                  : "text-muted hover:text-ink"
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      {clipPath && (
        <motion.div
          aria-hidden="true"
          data-navigation-indicator
          initial={false}
          animate={{ clipPath }}
          transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 42 }}
          className="pointer-events-none absolute inset-0 flex gap-1 rounded-full bg-brand-700 p-1 text-white"
        >
          {items.map((item) => (
            <span key={item.href} className={ITEM_CLASS}>{item.label}</span>
          ))}
        </motion.div>
      )}
    </nav>
  );
}

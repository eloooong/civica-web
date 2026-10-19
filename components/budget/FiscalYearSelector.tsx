"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { usePrefersReducedMotion } from "@/components/motion/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

interface FiscalYearLink {
  year: number;
  href: string;
}

interface FiscalYearSelectorProps {
  year: number;
  links: FiscalYearLink[];
  className?: string;
  label?: string;
}

/**
 * Split-around-selection interaction inspired by Kokonut UI Morphic Navbar.
 * https://kokonutui.com/docs/navigation/morphic-navbar
 * Selection follows the rendered fiscal year, including browser history.
 */
export function FiscalYearSelector({ year, links, className, label = "Fiscal year" }: FiscalYearSelectorProps) {
  const reduced = usePrefersReducedMotion();
  const [hovered, setHovered] = useState<number | null>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const selected = links.findIndex((link) => link.year === year);
  const gaps = links.slice(1).map((_, joint) => {
    if (joint === selected - 1 || joint === selected) return 8;
    return hovered !== null && (joint === hovered - 1 || joint === hovered) ? 2 : 0;
  });
  const totalGap = gaps.reduce<number>((sum, gap) => sum + gap, 0);
  const offsets = links.map((_, index) => gaps.slice(0, index).reduce<number>((sum, gap) => sum + gap, 0) - totalGap / 2);
  const transition = reduced ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 42 };

  useLayoutEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    let alive = true;
    const revealSelection = () => {
      if (!alive) return;
      const current = rail.querySelector<HTMLAnchorElement>('a[aria-current="date"]');
      if (!current) return;
      const outer = rail.getBoundingClientRect();
      const inner = current.getBoundingClientRect();
      // Move only the horizontal rail; mounting Compare must not scroll the page.
      if (inner.left < outer.left + 16) rail.scrollLeft += inner.left - outer.left - 16;
      else if (inner.right > outer.right - 16) rail.scrollLeft += inner.right - outer.right + 16;
    };
    revealSelection();
    const observer = new ResizeObserver(revealSelection);
    observer.observe(rail);
    document.fonts.ready.then(revealSelection).catch(() => undefined);
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, [year]);

  const moveFocus = (event: KeyboardEvent<HTMLAnchorElement>, index: number) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const target = event.key === "ArrowRight" ? Math.min(index + 1, links.length - 1)
      : event.key === "ArrowLeft" ? Math.max(index - 1, 0)
      : event.key === "Home" ? 0
      : event.key === "End" ? links.length - 1 : null;
    if (target === null) return;
    event.preventDefault();
    railRef.current?.querySelectorAll<HTMLAnchorElement>("a")[target]?.focus();
  };

  return (
    <nav aria-label={label} className={cn("flex min-w-0 max-w-full items-center gap-2", className)}>
      <span aria-hidden="true" className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted">FY</span>
      <div ref={railRef} data-fiscal-year-rail className="min-w-0 overflow-x-auto px-1 py-2">
        <ul className="flex w-max px-2" onPointerLeave={() => setHovered(null)}>
          {links.map((link, index) => {
            const active = link.year === year;
            return (
              <motion.li
                key={link.year}
                initial={false}
                animate={{ x: offsets[index] }}
                transition={transition}
                className={cn("relative shrink-0", active && "z-10")}
                onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovered(index); }}
              >
                <Link
                  href={link.href}
                  aria-current={active ? "date" : undefined}
                  aria-label={`Fiscal year ${link.year}`}
                  onKeyDown={(event) => moveFocus(event, index)}
                  className={cn(
                    "relative inline-flex min-h-11 items-center justify-center rounded-xl px-3.5 text-sm font-semibold tabular-nums",
                    active ? "bg-brand-700 text-white" : "bg-slate-100 text-muted hover:text-ink"
                  )}
                >
                  {index > 0 && (
                    <motion.span
                      aria-hidden="true"
                      initial={false}
                      animate={{ scaleX: gaps[index - 1] === 0 ? 1 : 0 }}
                      transition={transition}
                      className="pointer-events-none absolute inset-y-0 -left-px w-3 origin-left bg-inherit"
                    />
                  )}
                  {index < links.length - 1 && (
                    <motion.span
                      aria-hidden="true"
                      initial={false}
                      animate={{ scaleX: gaps[index] === 0 ? 1 : 0 }}
                      transition={transition}
                      className="pointer-events-none absolute inset-y-0 -right-px w-3 origin-right bg-inherit"
                    />
                  )}
                  <span className="relative">{link.year}</span>
                </Link>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

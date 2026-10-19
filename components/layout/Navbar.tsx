"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import {
  ChartColumn,
  ChevronRight,
  ClipboardList,
  Database,
  Droplets,
  FileText,
  Gavel,
  Layers,
  Search,
  Table,
  Users,
  Video,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { MotionConfig, motion, useReducedMotion } from "motion/react";
import { tween } from "@/components/motion/tokens";
import { cn } from "@/lib/utils";
import { isBudgetFiscalYear } from "@/types/budget";
import { SmoothNavigation } from "@/components/ui/SmoothNavigation";

interface NavNode {
  href: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  children?: NavNode[];
}

/**
 * The site as a folder tree. A branch is a disclosure rather than a link, and
 * its first child opens the same page, so no two rows in the tree claim to be
 * the same destination.
 *
 * Every row carries an icon from one library at one stroke weight and size, so
 * the set reads as a single drawn system rather than a set of pictures. The
 * branch icons name the collection, the leaf icons name the page, and no two
 * leaves in a branch share one, since a repeated glyph tells the reader
 * nothing.
 */
const tree: NavNode[] = [
  {
    href: "/budget",
    label: "Budget",
    icon: Wallet,
    children: [
      { href: "/budget", label: "Budget explorer", shortLabel: "Explorer", icon: Table },
      { href: "/budget/compare", label: "Compare departments", shortLabel: "Compare", icon: ChartColumn },
      { href: "/budget/nep", label: "FY2027 proposal", icon: FileText },
      { href: "/budget/cycle", label: "Budget execution", shortLabel: "Execution", icon: Layers },
      { href: "/budget/hearings", label: "House budget hearings", shortLabel: "Hearings", icon: Video },
    ],
  },
  {
    href: "/congress",
    label: "Congress",
    icon: Gavel,
  },
  {
    href: "/data",
    label: "Government Data",
    icon: Database,
    children: [
      { href: "/data", label: "Dataset catalog", icon: ClipboardList },
      { href: "/data/flood-control", label: "Flood control contracts", shortLabel: "Flood control", icon: Droplets },
      { href: "/data/contractors", label: "Public contractors", shortLabel: "Contractors", icon: Users },
    ],
  },
  { href: "/search", label: "Search", icon: Search },
];

/**
 * The current page, and every ancestor destination, resolved to the most
 * specific match. `/budget/07` marks Budget explorer, `/budget/compare` marks
 * only Compare, and a page outside every branch marks nothing.
 */
function activeHrefFor(pathname: string): string | null {
  let best: string | null = null;
  for (const branch of tree) {
    for (const node of [branch, ...(branch.children ?? [])]) {
      const matches = pathname === node.href || pathname.startsWith(`${node.href}/`);
      if (matches && (best === null || node.href.length > best.length)) best = node.href;
    }
  }
  return best;
}

function sectionFor(pathname: string) {
  return tree.find((node) => pathname === node.href || pathname.startsWith(`${node.href}/`));
}

function useEnactedYear(activeHref: string | null) {
  const params = useSearchParams();
  const year = params.get("year");
  return (activeHref === "/budget" || activeHref === "/budget/compare") &&
    year !== null && /^\d{4}$/.test(year) && isBudgetFiscalYear(Number(year))
    ? year : undefined;
}

function destination(href: string, year?: string) {
  return year && (href === "/budget" || href === "/budget/compare")
    ? `${href}?year=${year}` : href;
}

function SectionLinks({ section, activeHref, year }: { section: NavNode; activeHref: string | null; year?: string }) {
  return (
    <div data-section-navigation className="hidden border-t border-line lg:block">
      <div className="mx-auto flex max-w-7xl px-6 py-2">
        <SmoothNavigation
          label={`${section.label} tools`}
          items={(section.children ?? []).map((node) => ({
            href: destination(node.href, year),
            label: node.shortLabel ?? node.label,
            active: activeHref === node.href,
          }))}
        />
      </div>
    </div>
  );
}

function YearAwareSectionLinks(props: { section: NavNode; activeHref: string | null }) {
  const year = useEnactedYear(props.activeHref);
  return <SectionLinks {...props} year={year} />;
}

/**
 * Resting span of the three lines in the 24 unit box, and the longer hover
 * span. Two units of margin are left at each end, one of which the round cap
 * eats, so the grown line never touches the edge of the box and no clipping
 * happens at the extremes of the stroke.
 */
const LINE_IN = 4;
const LINE_OUT = 20;
const LINE_IN_HOVER = 2.5;
const LINE_OUT_HOVER = 21.5;

/**
 * Three lines that become a cross.
 *
 * The top and bottom lines travel to the middle and rotate 45 degrees in
 * opposite directions while the middle line collapses, so the control reads as
 * one object changing shape rather than two icons swapping. Rotation is about
 * the centre of the 24 pixel box, which is why the origin is pinned and the
 * box is set to the view box rather than each line's own bounds.
 *
 * Hover grows the lines outward from the centre. The growth moves the line ends
 * rather than scaling the line, because a horizontal scale stretches the round
 * stroke caps into ovals, and the ends still sit inside the view box.
 *
 * `initial={false}` means the server renders the closed pose and the first
 * client render agrees, so there is no hydration mismatch and the lines do not
 * animate in on arrival.
 */
function MenuMorph({ open }: { open: boolean }) {
  const reduced = useReducedMotion();
  const transition = reduced ? { duration: 0 } : tween(0.22);
  return (
    <motion.svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
      animate={open ? "open" : "closed"}
      whileHover="hover"
    >
      <motion.line
        x1={LINE_IN}
        y1={6}
        x2={LINE_OUT}
        y2={6}
        initial={false}
        variants={{
          closed: { y1: 6, y2: 6, rotate: 0 },
          open: { y1: 12, y2: 12, rotate: 45 },
          hover: { x1: LINE_IN_HOVER, x2: LINE_OUT_HOVER },
        }}
        style={{ transformOrigin: "12px 12px", transformBox: "view-box" }}
        transition={transition}
      />
      <motion.line
        x1={LINE_IN}
        y1={12}
        x2={LINE_OUT}
        y2={12}
        initial={false}
        variants={{
          closed: { scaleX: 1, opacity: 1 },
          open: { scaleX: 0, opacity: 0 },
          hover: { x1: LINE_IN_HOVER, x2: LINE_OUT_HOVER },
        }}
        style={{ transformOrigin: "12px 12px", transformBox: "view-box" }}
        transition={transition}
      />
      <motion.line
        x1={LINE_IN}
        y1={18}
        x2={LINE_OUT}
        y2={18}
        initial={false}
        variants={{
          closed: { y1: 18, y2: 18, rotate: 0 },
          open: { y1: 12, y2: 12, rotate: -45 },
          hover: { x1: LINE_IN_HOVER, x2: LINE_OUT_HOVER },
        }}
        style={{ transformOrigin: "12px 12px", transformBox: "view-box" }}
        transition={transition}
      />
    </motion.svg>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center rounded-sm" aria-label="Civica home">
      {/* The wordmark carries the name, so the image is decorative and the link
          is named by its label. `sizes` keeps the browser from fetching a
          candidate wider than the lockup it renders. */}
      <Image
        src="/typologo.png"
        alt=""
        width={640}
        height={176}
        priority
        sizes="(min-width: 1024px) 116px, 102px"
        className="h-7 w-auto sm:h-8"
      />
    </Link>
  );
}

function Branch({
  node,
  activeHref,
  collapsed,
  onToggle,
  onNavigate,
  year,
}: {
  node: NavNode;
  activeHref: string | null;
  collapsed: ReadonlySet<string>;
  onToggle: (href: string) => void;
  onNavigate?: () => void;
  year?: string;
}) {
  const children = node.children ?? [];

  if (children.length > 0) {
    // The reader's collapse choice wins, even on the branch that holds the
    // current page: a chevron that silently refuses to move is worse than a
    // folder the reader closed on purpose. The branch keeps its tint either
    // way, so "you are in here" survives the collapse.
    const inPath = activeHref === node.href || activeHref?.startsWith(`${node.href}/`);
    const open = !collapsed.has(node.href);
    return (
      <li>
        <button
          type="button"
          onClick={() => onToggle(node.href)}
          aria-expanded={open}
          aria-controls={open ? `mobile-nav-${node.href.slice(1)}` : undefined}
          aria-label={`${open ? "Collapse" : "Expand"} ${node.label}`}
          className={cn(
            "flex min-h-11 w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-semibold transition-colors duration-150 hover:bg-surface",
            inPath ? "text-brand-800" : "text-ink"
          )}
        >
          <node.icon aria-hidden="true" strokeWidth={2} className="h-4 w-4 shrink-0" />
          {node.label}
          {inPath && !open && (
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-700"
            />
          )}
          <ChevronRight
            aria-hidden="true"
            strokeWidth={2}
            className={cn("ml-auto h-4 w-4 shrink-0 transition-transform duration-150", open && "rotate-90")}
          />
        </button>
        {open && (
          <ul id={`mobile-nav-${node.href.slice(1)}`} className="ml-5 space-y-0.5 border-l border-line pl-3">
            {children.map((child) => (
              <Branch
                key={child.href}
                node={child}
                activeHref={activeHref}
                collapsed={collapsed}
                onToggle={onToggle}
                onNavigate={onNavigate}
                year={year}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li>
      <Link
        href={destination(node.href, year)}
        aria-current={activeHref === node.href ? "page" : undefined}
        onClick={onNavigate}
        className={cn(
          "flex min-h-11 items-center gap-2.5 rounded-md py-2 pl-3 pr-2.5 text-sm transition-colors duration-150 ease-institutional",
          activeHref === node.href
            ? "bg-brand-50 font-semibold text-brand-800"
            : "font-medium text-ink/80 hover:bg-surface hover:text-ink"
        )}
      >
        <node.icon aria-hidden="true" strokeWidth={2} className="h-4 w-4 shrink-0" />
        {node.label}
      </Link>
    </li>
  );
}

function NavTree({
  activeHref,
  collapsed,
  onToggle,
  onNavigate,
  label,
  year,
}: {
  activeHref: string | null;
  collapsed: ReadonlySet<string>;
  onToggle: (href: string) => void;
  onNavigate?: () => void;
  label: string;
  year?: string;
}) {
  return (
    <nav aria-label={label}>
      <ul className="space-y-1.5">
        {tree.map((node) => (
          <Branch
            key={node.href}
            node={node}
            activeHref={activeHref}
            collapsed={collapsed}
            onToggle={onToggle}
            onNavigate={onNavigate}
            year={year}
          />
        ))}
      </ul>
    </nav>
  );
}

function YearAwareNavTree(props: Parameters<typeof NavTree>[0]) {
  const year = useEnactedYear(props.activeHref);
  return <NavTree {...props} year={year} />;
}

/**
 * Site shell: desktop section links and contextual tools, with a mobile drawer.
 *
 * On phones a permanent tree would cost most of the screen, so the tree lives
 * in a modal drawer behind the menu button: focus moves into it, Tab is trapped,
 * Escape closes it and returns focus, and the page behind it cannot scroll. The
 * drawer covers the header toggle, so it carries its own close control.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    const handleSearchShortcut = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k" || !(event.ctrlKey || event.metaKey) || event.altKey || event.repeat || event.defaultPrevented) return;
      const target = event.target;
      if (target instanceof Element && target.closest("input, textarea, select, [contenteditable], [role=dialog]")) return;
      event.preventDefault();
      const field = document.querySelector<HTMLInputElement>("#site-search");
      if (field) field.focus();
      else router.push("/search#site-search");
    };
    window.addEventListener("keydown", handleSearchShortcut);
    return () => window.removeEventListener("keydown", handleSearchShortcut);
  }, [router]);
  const activeHref = activeHrefFor(pathname);
  const section = sectionFor(pathname);
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());
  const drawerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  // Close on any route change, not only a link click: the back button and
  // programmatic navigation land here too. Done during render because it is a
  // reset against a changed input, not a sync with anything outside React.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    if (sectionFor(lastPath)?.href !== section?.href) setCollapsed(new Set());
    setLastPath(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (!desktop.matches) return;
      setOpen(false);
      if (drawerRef.current?.contains(document.activeElement) || document.activeElement === toggleRef.current) {
        const header = headerRef.current;
        const target = header?.querySelector<HTMLElement>('nav[aria-label="Main navigation"] a[aria-current]')
          ?? header?.querySelector<HTMLElement>('a[aria-label="Civica home"]');
        target?.focus();
      }
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!open) return;

    // Lock the page behind the drawer, so a wheel or trackpad gesture cannot
    // scroll the content underneath a modal panel.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = drawerRef.current;
    panel?.querySelector<HTMLElement>("a[href], button")?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled])"
      );
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const toggleFolder = (href: string) =>
    setCollapsed((previous) => {
      const next = new Set(previous);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      return next;
    });

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen flex-col bg-white">
        <header ref={headerRef} className="sticky top-0 z-30 border-b border-line bg-white">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="site-drawer"
              aria-label={open ? "Close menu" : "Open menu"}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-md text-ink transition-colors hover:bg-slate-100 lg:hidden"
            >
              <MenuMorph open={open} />
            </button>
            <Brand />
            <nav aria-label="Main navigation" className="ml-auto hidden items-center gap-1 lg:flex">
              {tree.map((node) => {
                const selected = pathname === node.href || pathname.startsWith(`${node.href}/`);
                return (
                  <Link
                    key={node.href}
                    href={node.href}
                    aria-current={selected ? "location" : undefined}
                    aria-keyshortcuts={node.href === "/search" ? "Control+k Meta+k" : undefined}
                    className={cn(
                      "inline-flex min-h-11 items-center gap-2 rounded-md border-b-2 px-4 text-sm font-semibold transition-colors",
                      selected ? "border-brand-700 bg-brand-50 text-brand-800" : "border-transparent text-muted hover:bg-surface hover:text-ink"
                    )}
                  >
                    {node.href === "/search" && <Search className="h-4 w-4" aria-hidden="true" />}
                    {node.label}
                    {node.href === "/search" && <kbd className="rounded border border-line px-1.5 py-0.5 text-xs font-normal text-muted">Ctrl K</kbd>}
                  </Link>
                );
              })}
            </nav>
          </div>
          {section?.children && (
            <Suspense fallback={<SectionLinks section={section} activeHref={activeHref} />}>
              <YearAwareSectionLinks section={section} activeHref={activeHref} />
            </Suspense>
          )}
        </header>

        <div
          id="site-drawer"
          ref={drawerRef}
          role="dialog"
          aria-modal={open ? true : undefined}
          aria-label="Site navigation"
          inert={!open}
          data-lenis-prevent
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-[22rem] max-w-[85vw] overflow-y-auto border-r border-line bg-white px-4 py-5 shadow-2xl transition-transform duration-200 ease-institutional lg:hidden",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* The drawer covers the header toggle, so it carries its own close
              control. Escape and the backdrop close it too. */}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              toggleRef.current?.focus();
            }}
            aria-label="Close menu"
            className="inline-flex h-12 w-12 items-center justify-center rounded-md text-ink transition-colors hover:bg-slate-100"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="mt-4">
            <Suspense fallback={<NavTree activeHref={activeHref} collapsed={collapsed} onToggle={toggleFolder} label="Site menu" />}>
              <YearAwareNavTree
                activeHref={activeHref}
                collapsed={collapsed}
                onToggle={toggleFolder}
                onNavigate={() => setOpen(false)}
                label="Site menu"
              />
            </Suspense>
          </div>
        </div>

        {open && (
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => {
              setOpen(false);
              toggleRef.current?.focus();
            }}
            className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </MotionConfig>
  );
}

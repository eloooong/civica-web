"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
import { motion } from "motion/react";
import { tween } from "@/components/motion/tokens";
import { cn } from "@/lib/utils";

interface NavNode {
  href: string;
  label: string;
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
      { href: "/budget", label: "Budget explorer", icon: Table },
      { href: "/budget/compare", label: "Compare departments", icon: ChartColumn },
      { href: "/budget/nep", label: "FY2027 proposal", icon: FileText },
      { href: "/budget/cycle", label: "Budget execution", icon: Layers },
      { href: "/budget/hearings", label: "House budget hearings", icon: Video },
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
      { href: "/data/flood-control", label: "Flood control contracts", icon: Droplets },
      { href: "/data/contractors", label: "Public contractors", icon: Users },
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

/**
 * Three lines that become a cross.
 *
 * The top and bottom lines travel to the middle and rotate 45 degrees in
 * opposite directions while the middle line collapses, so the control reads as
 * one object changing shape rather than two icons swapping. Rotation is about
 * the centre of the 24 pixel box, which is why the origin is pinned and the
 * box is set to the view box rather than each line's own bounds.
 *
 * `initial={false}` means the server renders the closed pose and the first
 * client render agrees, so there is no hydration mismatch and the lines do not
 * animate in on arrival.
 */
function MenuMorph({ open }: { open: boolean }) {
  const transition = tween(0.22);
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <motion.line
        x1="4"
        y1="12"
        x2="20"
        y2="12"
        initial={false}
        animate={{ scaleX: open ? 0 : 1, opacity: open ? 0 : 1 }}
        style={{ transformOrigin: "12px 12px", transformBox: "view-box" }}
        transition={transition}
      />
      <motion.line
        x1="4"
        y1={open ? 12 : 6}
        x2="20"
        y2={open ? 12 : 6}
        initial={false}
        animate={{ rotate: open ? 45 : 0 }}
        style={{ transformOrigin: "12px 12px", transformBox: "view-box" }}
        transition={transition}
      />
      <motion.line
        x1="4"
        y1={open ? 12 : 18}
        x2="20"
        y2={open ? 12 : 18}
        initial={false}
        animate={{ rotate: open ? -45 : 0 }}
        style={{ transformOrigin: "12px 12px", transformBox: "view-box" }}
        transition={transition}
      />
    </svg>
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
}: {
  node: NavNode;
  activeHref: string | null;
  collapsed: ReadonlySet<string>;
  onToggle: (href: string) => void;
  onNavigate?: () => void;
}) {
  const children = node.children ?? [];

  if (children.length > 0) {
    // The reader's collapse choice wins, even on the branch that holds the
    // current page: a chevron that silently refuses to move is worse than a
    // folder the reader closed on purpose. The branch keeps its tint either
    // way, so "you are in here" survives the collapse.
    const inPath = activeHref === node.href;
    const open = !collapsed.has(node.href);
    return (
      <li>
        <div className="flex items-center gap-2 pr-1">
          <button
            type="button"
            onClick={() => onToggle(node.href)}
            aria-expanded={open}
            aria-label={`${open ? "Collapse" : "Expand"} ${node.label}`}
            className="flex h-9 w-7 shrink-0 items-center justify-center rounded text-muted transition-colors duration-150 hover:text-ink"
          >
            <ChevronRight
              aria-hidden="true"
              strokeWidth={2}
              className={cn("h-4 w-4 transition-transform duration-150", open && "rotate-90")}
            />
          </button>
          {/* The branch is tinted, not bordered: a coloured rule beside a list
              item reads as decoration and competes with the data. Weight and
              tint carry the state, and a collapsed in-path branch keeps a dot
              so the reader is never left with a folder and no clue. */}
          <span
            className={cn(
              "flex min-h-9 items-center gap-2.5 text-sm font-semibold transition-colors duration-150",
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
          </span>
        </div>
        {open && (
          <ul className="ml-[3.125rem] space-y-0.5 border-l border-line pl-2.5">
            {children.map((child) => (
              <Branch
                key={child.href}
                node={child}
                activeHref={activeHref}
                collapsed={collapsed}
                onToggle={onToggle}
                onNavigate={onNavigate}
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
        href={node.href}
        aria-current={activeHref === node.href ? "page" : undefined}
        onClick={onNavigate}
        className={cn(
          "flex min-h-10 items-center gap-2.5 rounded-md py-2 pl-3 pr-2.5 text-sm transition-colors duration-150 ease-institutional",
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
}: {
  activeHref: string | null;
  collapsed: ReadonlySet<string>;
  onToggle: (href: string) => void;
  onNavigate?: () => void;
  label: string;
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
          />
        ))}
      </ul>
    </nav>
  );
}

/**
 * Site shell: a full-bleed header bar and a drawer holding the folder tree.
 *
 * On phones a permanent tree would cost most of the screen, so the tree lives
 * in a modal drawer behind the menu button: focus moves into it, Tab is trapped,
 * Escape closes it and returns focus, and the page behind it cannot scroll. The
 * drawer covers the header toggle, so it carries its own close control.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const activeHref = activeHrefFor(pathname);
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set());
  const drawerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Close on any route change, not only a link click: the back button and
  // programmatic navigation land here too. Done during render because it is a
  // reset against a changed input, not a sync with anything outside React.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }

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
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-white px-4 py-3 sm:px-6">
        <button
          ref={toggleRef}
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="site-drawer"
          aria-label={open ? "Close menu" : "Open menu"}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-ink transition-colors hover:bg-slate-100"
        >
          <MenuMorph open={open} />
        </button>
        <Brand />
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
          "fixed inset-y-0 left-0 z-40 w-[22rem] max-w-[85vw] overflow-y-auto border-r border-line bg-white px-4 py-5 shadow-2xl transition-transform duration-200 ease-institutional",
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
          className="inline-flex h-11 w-11 items-center justify-center rounded-md text-ink transition-colors hover:bg-slate-100"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="mt-4">
          <NavTree
            activeHref={activeHref}
            collapsed={collapsed}
            onToggle={toggleFolder}
            onNavigate={() => setOpen(false)}
            label="Site menu"
          />
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
          className="fixed inset-0 z-30 bg-ink/40"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

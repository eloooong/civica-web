"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Landmark, Menu, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/budget", label: "Budget" },
  { href: "/congress", label: "Congress" },
  { href: "/data", label: "Government Data" },
];

export function Navbar() {
  const pathname = usePathname();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const firstLink = menuRef.current?.querySelector("a");
    firstLink?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenAt(null);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div aria-hidden="true" className="flex h-1 w-full">
        <span className="w-1/2 bg-brand-600" />
        <span className="w-1/3 bg-accent-600" />
        <span className="w-1/6 bg-amber-300" />
      </div>
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6"
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-sm"
          aria-label="CivicLens PH home"
        >
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-700 text-white"
          >
            <Landmark className="h-5 w-5" strokeWidth={2} />
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-bold tracking-tight text-ink">
              CivicLens PH
            </span>
            <span className="hidden text-[10px] font-semibold uppercase tracking-widest text-muted lg:block">
              Government data, made understandable
            </span>
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ease-institutional",
                    active
                      ? "bg-brand-50 text-brand-800"
                      : "text-ink/80 hover:bg-slate-100 hover:text-ink"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
          <li>
            <Link
              href="/search"
              aria-current={pathname === "/search" ? "page" : undefined}
              className={cn(
                "ml-2 inline-flex items-center gap-2 rounded-md border px-3.5 py-2 text-sm font-semibold transition-colors duration-150 ease-institutional",
                pathname === "/search"
                  ? "border-brand-700 bg-brand-700 text-white"
                  : "border-brand-200 bg-white text-brand-700 hover:border-brand-600 hover:bg-brand-50"
              )}
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Search
            </Link>
          </li>
        </ul>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/search"
            aria-label="Search CivicLens"
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-line text-ink hover:bg-slate-50"
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </Link>
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpenAt(open ? null : pathname)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-line text-ink hover:bg-slate-50"
          >
            {open ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div id="mobile-menu" ref={menuRef} className="border-t border-line bg-white md:hidden">
          <ul className="mx-auto w-full max-w-7xl space-y-1 px-4 py-3 sm:px-6">
            {[{ href: "/", label: "Explore" }, ...links, { href: "/search", label: "Search" }].map(
              (link) => {
                const active = pathname === link.href;
                return (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      onClick={() => setOpenAt(null)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-11 items-center rounded-md px-3 py-2.5 text-sm font-medium",
                        active
                          ? "bg-brand-50 text-brand-800"
                          : "text-ink/80 hover:bg-slate-100"
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              }
            )}
          </ul>
        </div>
      )}
    </header>
  );
}

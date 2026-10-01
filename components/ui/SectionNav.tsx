import Link from "next/link";
import { cn } from "@/lib/utils";

export interface SectionLink {
  href: string;
  label: string;
}

/**
 * The pages that make up a collection. Kept here rather than inside each hub
 * page so every page in the section renders the same list, and so a new
 * sub-page cannot be added in one place and forgotten in the other.
 */
export const BUDGET_SECTIONS: SectionLink[] = [
  { href: "/budget", label: "Explorer" },
  { href: "/budget/compare", label: "Compare" },
  { href: "/budget/nep", label: "FY2027 proposal" },
  { href: "/budget/cycle", label: "Execution" },
  { href: "/budget/hearings", label: "Hearings" },
];

export const DATA_SECTIONS: SectionLink[] = [
  { href: "/data", label: "Dataset catalog" },
  { href: "/data/flood-control", label: "Flood control contracts" },
  { href: "/data/contractors", label: "Public contractors" },
];

/**
 * Sub-navigation for one collection, shown on the collection hub and its
 * direct children. Detail pages leave it out: the breadcrumb trail already
 * places them, and a second row of links on a long record page is noise.
 *
 * Wraps rather than scrolls horizontally, so every page stays reachable on a
 * phone without a hidden swipe.
 */
export function SectionNav({
  section,
  links,
  current,
}: {
  /** Collection name, used as the row label and the landmark name. */
  section: string;
  links: SectionLink[];
  /** Href of the page being rendered, matched exactly. */
  current: string;
}) {
  return (
    <nav aria-label={`${section} pages`} className="mt-4">
      <ul className="flex flex-wrap items-center gap-2">
        <li className="text-xs font-semibold uppercase tracking-wider text-muted">
          {section}
        </li>
        {links.map((link) => {
          const active = link.href === current;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-md border px-3 py-2 text-sm font-semibold transition-colors duration-150 ease-institutional",
                  active
                    ? "border-brand-700 bg-brand-700 text-white"
                    : "border-line bg-white text-ink/80 hover:border-brand-200 hover:text-brand-700"
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

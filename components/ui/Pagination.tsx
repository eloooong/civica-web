import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Offset-based pagination with shareable page numbers.
 * Pure presentational — the parent builds hrefs that preserve all filters.
 */
export function Pagination({
  page,
  total,
  limit,
  hrefFor,
}: {
  page: number;
  total: number;
  limit: number;
  hrefFor: (page: number) => string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  if (totalPages <= 1) {
    return (
      <p className="text-sm text-muted" role="status">
        {total.toLocaleString("en-PH")} result{total === 1 ? "" : "s"}
      </p>
    );
  }

  const from = (safePage - 1) * limit + 1;
  const to = Math.min(safePage * limit, total);

  // Compact window: first, last, and ±1 around current.
  const pages = [...new Set([1, safePage - 1, safePage, safePage + 1, totalPages])]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);

  const arrowClass =
    "inline-flex h-11 w-11 items-center justify-center rounded-md border border-line bg-white text-ink transition-colors duration-150 ease-institutional";
  const disabledArrowClass = "opacity-40";
  const activeArrowClass = "hover:border-brand-200 hover:text-brand-700";

  const prevDisabled = safePage <= 1;
  const nextDisabled = safePage >= totalPages;

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted" role="status" aria-live="polite">
        Showing {from.toLocaleString("en-PH")}–{to.toLocaleString("en-PH")} of{" "}
        {total.toLocaleString("en-PH")}
      </p>
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          {prevDisabled ? (
            <span aria-hidden="true" className={cn(arrowClass, disabledArrowClass)}>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </span>
          ) : (
            <Link
              href={hrefFor(safePage - 1)}
              aria-label="Previous page"
              className={cn(arrowClass, activeArrowClass)}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </li>
        {pages.map((p, i) => {
          const showEllipsis = i > 0 && p - pages[i - 1]! > 1;
          return (
            <li key={p} className="flex items-center gap-1">
              {showEllipsis && (
                <span aria-hidden="true" className="px-1 text-sm text-muted">
                  …
                </span>
              )}
              <Link
                href={hrefFor(p)}
                aria-label={`Page ${p}`}
                aria-current={p === safePage ? "page" : undefined}
                className={cn(
                  "inline-flex h-11 min-w-11 items-center justify-center rounded-md border px-2 text-sm font-semibold transition-colors duration-150 ease-institutional",
                  p === safePage
                    ? "border-brand-700 bg-brand-700 text-white"
                    : "border-line bg-white text-ink/80 hover:border-brand-200 hover:text-brand-700"
                )}
              >
                {p}
              </Link>
            </li>
          );
        })}
        <li>
          {nextDisabled ? (
            <span aria-hidden="true" className={cn(arrowClass, disabledArrowClass)}>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </span>
          ) : (
            <Link
              href={hrefFor(safePage + 1)}
              aria-label="Next page"
              className={cn(arrowClass, activeArrowClass)}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </li>
      </ol>
    </nav>
  );
}

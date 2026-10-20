"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDownWideNarrow, ChevronRight, Search } from "lucide-react";
import type { DepartmentRow } from "@/types/budget";
import { formatPesoCompact, formatShare } from "@/lib/utils";
import { EmptyState } from "@/components/ui/States";

type SortKey = "amount-desc" | "amount-asc" | "name-asc";

/**
 * Client-side explorer table. Receives server-fetched, year-scoped department
 * rows via props — it never calls the API itself.
 *
 * The department name is the row's only link, so the table spends its width
 * on the name, the amount, and the share instead of a per-row "View" column.
 * The share reads twice: as a percentage, and as a bar scaled to the largest
 * department in the current result set, which is what makes the ranking
 * scannable without a separate chart.
 */
export function BudgetExplorer({
  departments,
  year,
}: {
  departments: DepartmentRow[];
  year: number;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("amount-desc");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? departments.filter(
          (d) =>
            d.description.toLowerCase().includes(q) ||
            d.id.toLowerCase().includes(q)
        )
      : departments;
    const sorted = [...filtered];
    switch (sort) {
      case "amount-asc":
        sorted.sort((a, b) => (a.amount ?? 0) - (b.amount ?? 0));
        break;
      case "name-asc":
        sorted.sort((a, b) => a.description.localeCompare(b.description));
        break;
      case "amount-desc":
      default:
        sorted.sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));
    }
    return sorted;
  }, [departments, query, sort]);

  // Bars are scaled to the biggest row on screen, not to 100% of the national
  // total: the top department is only about a tenth of it, so absolute bars
  // would all look empty.
  const maxShare = useMemo(
    () => rows.reduce((max, d) => Math.max(max, d.share ?? 0), 0),
    [rows]
  );

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          />
          <label htmlFor="dept-filter" className="sr-only">
            Filter departments by name or code
          </label>
          <input
            id="dept-filter"
            type="search"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter departments by name or code…"
            className="min-h-11 w-full rounded-md border border-control bg-white py-2.5 pl-9 pr-3 text-base text-ink placeholder:text-muted focus:border-brand-600"
          />
        </div>
        <div className="flex items-center gap-2">
          <ArrowDownWideNarrow className="h-4 w-4 text-muted" aria-hidden="true" />
          <label htmlFor="dept-sort" className="sr-only">
            Sort departments
          </label>
          <select
            id="dept-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="min-h-11 rounded-md border border-control bg-white px-3 py-2.5 text-base text-ink"
          >
            <option value="amount-desc">Largest budget first</option>
            <option value="amount-asc">Smallest budget first</option>
            <option value="name-asc">Name (A–Z)</option>
          </select>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted" role="status" aria-live="polite">
        Showing {rows.length} of {departments.length} departments · FY {year}
      </p>

      {rows.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No departments match your filter"
            description={`Nothing in the FY ${year} enacted budget matches “${query.trim()}”. Try a different name or code.`}
            action={
              <button
                type="button"
                onClick={() => setQuery("")}
                className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
              >
                Clear filter
              </button>
            }
          />
        </div>
      ) : (
        <>
          {/* Phones: one card per department. A three-column table cannot
              hold a full department name at this width, so the rows become
              stacked cards and the horizontal scroll disappears. */}
          <ul className="mt-3 space-y-3 sm:hidden">
            {rows.map((d) => {
              const share = d.share ?? 0;
              const barWidth =
                maxShare > 0 ? Math.max((share / maxShare) * 100, 3) : 0;
              return (
                <li key={d.id} className="rounded-lg border border-line bg-white p-4">
                  <Link
                    href={`/budget/${d.id}?year=${year}`}
                    className="block text-sm font-semibold text-ink hover:text-brand-700"
                  >
                    {d.description}
                    <span className="sr-only">budget details for FY {year}</span>
                  </Link>
                  <div className="mt-2 flex items-baseline justify-between gap-3">
                    <p className="text-base font-bold tabular-nums text-ink">
                      {formatPesoCompact(d.amount ?? 0)}
                    </p>
                    <p className="shrink-0 text-xs tabular-nums text-muted">
                      {d.share !== undefined
                        ? `${formatShare(d.share)} of national`
                        : "–"}
                    </p>
                  </div>
                  <span
                    aria-hidden="true"
                    className="mt-2 block h-1.5 overflow-hidden rounded-full bg-line"
                  >
                    <span
                      className="block h-full rounded-full bg-brand-700/70"
                      style={{ width: `${barWidth}%` }}
                    />
                  </span>
                </li>
              );
            })}
          </ul>

          <div
            tabIndex={0}
            role="region"
            aria-label={`Enacted national budget allocations by department for FY ${year}, scrollable table`}
            className="data-table-scroll mt-3 hidden overflow-x-auto rounded-lg border border-line sm:block"
          >
            <table className="data-table w-full min-w-[420px] border-collapse bg-white text-left text-sm">
              <caption className="sr-only">
                Enacted national budget allocations by department for FY {year}
              </caption>
              <thead>
                <tr className="border-b border-line bg-surface text-xs uppercase tracking-wider text-muted">
                  <th scope="col" className="px-4 py-2.5 font-semibold">Department</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold">FY {year}</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold">Share</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => {
                  const share = d.share ?? 0;
                  const barWidth =
                    maxShare > 0 ? Math.max((share / maxShare) * 100, 3) : 0;
                  return (
                    <tr
                      key={d.id}
                      className="group border-b border-line last:border-0 hover:bg-surface/60"
                    >
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/budget/${d.id}?year=${year}`}
                          className="inline-flex items-center gap-0.5 font-semibold text-ink transition-colors duration-150 hover:text-brand-700 hover:underline group-hover:text-brand-700"
                        >
                          {d.description}
                          <ChevronRight
                            aria-hidden="true"
                            className="h-3.5 w-3.5 shrink-0 text-brand-700 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                          />
                          <span className="sr-only">
                            budget details for FY {year}
                          </span>
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right font-semibold tabular-nums text-ink">
                        {formatPesoCompact(d.amount ?? 0)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-2.5">
                          <span
                            aria-hidden="true"
                            className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-line sm:block"
                          >
                            <span
                              className="block h-full rounded-full bg-brand-700/70"
                              style={{ width: `${barWidth}%` }}
                            />
                          </span>
                          <span className="w-14 shrink-0 text-right tabular-nums text-muted">
                            {d.share !== undefined ? formatShare(d.share) : "–"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

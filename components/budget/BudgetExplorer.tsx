"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDownWideNarrow, Search } from "lucide-react";
import type { DepartmentRow } from "@/types/budget";
import { formatPesoCompact, formatShare } from "@/lib/utils";
import { EmptyState } from "@/components/ui/States";

type SortKey = "amount-desc" | "amount-asc" | "name-asc";

/**
 * Client-side explorer table. Receives server-fetched, year-scoped department
 * rows via props — it never calls the API itself.
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

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
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
            className="w-full rounded-md border border-line bg-white py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-muted/80 focus:border-brand-600"
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
            className="rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink"
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
        <div
          tabIndex={0}
          role="region"
          aria-label={`Enacted national budget allocations by department for FY ${year}, scrollable table`}
          className="mt-3 overflow-x-auto rounded-lg border border-line"
        >
          <table className="w-full min-w-[620px] border-collapse bg-white text-left text-sm">
            <caption className="sr-only">
              Enacted national budget allocations by department for FY {year}
            </caption>
            <thead>
              <tr className="border-b border-line bg-surface text-xs uppercase tracking-wider text-muted">
                <th scope="col" className="px-4 py-3 font-semibold">Department</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">FY {year}</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Share</th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id} className="border-b border-line last:border-0 hover:bg-surface/60">
                  <td className="px-4 py-3.5">
                    <span className="block font-semibold text-ink">{d.description}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-ink">
                    {formatPesoCompact(d.amount ?? 0)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right text-muted">
                    {d.share !== undefined ? formatShare(d.share) : "–"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right">
                    <Link
                      href={`/budget/${d.id}`}
                      className="rounded-sm text-sm font-semibold text-brand-700 hover:underline"
                      aria-label={`View ${d.description} budget details`}
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

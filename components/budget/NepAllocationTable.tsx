"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { Download, Search } from "lucide-react";
import { formatPesoCompact, formatPesoFull, formatPctDelta } from "@/lib/utils";
import { toCsv } from "@/lib/csv";
import type { SourceRetrieval } from "@/lib/api/source-cache";

export interface NepAllocationRow {
  id: string;
  name: string;
  detail?: string;
  href?: string;
  amount: number;
  base_amount: number;
  delta: number;
  pct: number;
}

type SortOrder = "amount-desc" | "amount-asc" | "baseline-desc" | "increase" | "decrease" | "name";

function PesoAmount({ value, exact, signed = false }: { value: number; exact: boolean; signed?: boolean }) {
  const sign = signed ? (value < 0 ? "-" : "+") : "";
  const amount = signed ? Math.abs(value) : value;
  const full = `${sign}${formatPesoFull(amount)}`;
  return (
    <data value={value} title={full}>
      <span aria-hidden="true">{exact ? full : `${sign}${formatPesoCompact(amount)}`}</span>
      <span className="sr-only">{full}</span>
    </data>
  );
}

export function NepAllocationTable({
  rows,
  kind,
  fiscalYear,
  baselineYear,
  source,
  retrieval,
}: {
  rows: NepAllocationRow[];
  kind: "departments" | "regions" | "expense classes";
  fiscalYear: number;
  baselineYear: number;
  source: string;
  retrieval: SourceRetrieval;
}) {
  const id = useId();
  const viewport = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOrder>("amount-desc");
  const [exact, setExact] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState("");
  const term = query.trim().toLowerCase();
  const visibleRows = rows.filter((row) =>
    `${row.name} ${row.id} ${row.detail ?? ""}`.toLowerCase().includes(term)
  ).sort((a, b) => {
    const nameOrder = a.name.localeCompare(b.name, "en");
    switch (sort) {
      case "amount-asc": return a.amount - b.amount || nameOrder;
      case "baseline-desc": return b.base_amount - a.base_amount || nameOrder;
      case "increase": return b.delta - a.delta || nameOrder;
      case "decrease": return a.delta - b.delta || nameOrder;
      case "name": return nameOrder;
      default: return b.amount - a.amount || nameOrder;
    }
  });
  const showShare = kind !== "departments";
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  const caption = `FY${fiscalYear} proposed budget by ${kind} against FY${baselineYear} enacted`;
  const countLabel = kind === "departments" ? "allocation groups" : kind;
  const nameLabel = kind === "departments" ? "Allocation group" : "Category";

  function downloadCsv() {
    try {
      const csv = toCsv([
        ["code", "name", "detail", "proposed_fiscal_year", "enacted_fiscal_year", "proposed_php", "enacted_php", "change_php", "change_percent",
          ...(showShare ? ["share_percent", "complete_breakdown_total_php"] : []),
          "currency", "proposal_status", "search_filter", "sort_order", "source", "source_endpoint", "retrieved_at_utc"],
        ...visibleRows.map((row) => [row.id, row.name, row.detail, fiscalYear, baselineYear, row.amount, row.base_amount, row.delta, row.base_amount > 0 ? row.pct : null,
          ...(showShare ? [total > 0 ? row.amount / total * 100 : null, total] : []),
          "PHP", "Proposed, not enacted", query.trim(), sort, source, retrieval.endpoint, retrieval.retrievedAt]),
      ]);
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `civica-nep-fy${fiscalYear}-${kind.replaceAll(" ", "-")}${term ? "-filtered" : ""}.csv`;
      document.body.appendChild(link);
      try {
        link.click();
      } finally {
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      setDownloadStatus(`CSV download started with ${visibleRows.length} ${visibleRows.length === 1 ? "row" : "rows"}.`);
    } catch {
      setDownloadStatus("Could not start the CSV download. Please try again.");
    }
  }

  function resetScroll() {
    if (viewport.current) viewport.current.scrollTop = 0;
  }

  function rowName(row: NepAllocationRow) {
    return (
      <>
        {row.href ? (
          <Link href={row.href} aria-label={`${row.name}: FY${baselineYear} enacted budget`} className="font-semibold text-ink underline decoration-line underline-offset-4 hover:text-brand-700 hover:decoration-brand-700">
            {row.name}
          </Link>
        ) : <span className="font-semibold text-ink">{row.name}</span>}
        <span className="mt-1 block text-xs font-normal text-muted">
          {row.id}{row.detail ? ` · ${row.detail}` : ""}
          {row.href && <span className="block">View FY{baselineYear} enacted budget</span>}
        </span>
      </>
    );
  }

  function change(row: NepAllocationRow) {
    return (
      <>
        <PesoAmount value={row.delta} exact={exact} signed />
        <span className="mt-0.5 block text-xs font-normal text-muted">
          {row.base_amount > 0 ? formatPctDelta(row.pct) : "No enacted baseline"}
        </span>
      </>
    );
  }

  function share(row: NepAllocationRow) {
    return total > 0 ? `${((row.amount / total) * 100).toFixed(1)}%` : "Unavailable";
  }

  return (
    <div className="mt-4 min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-0 flex-1 sm:min-w-56">
          <label htmlFor={`${id}-search`} className="mb-1.5 block text-xs font-semibold text-muted">Search {kind}</label>
          <div className="relative">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id={`${id}-search`}
              ref={searchInput}
              type="search"
              autoComplete="off"
              value={query}
              onChange={(event) => { setQuery(event.target.value); setDownloadStatus(""); resetScroll(); }}
              placeholder="Name or code"
              className="min-h-11 w-full rounded-md border border-control bg-white py-2 pl-9 pr-3 text-base text-ink placeholder:text-muted"
            />
          </div>
        </div>
        <div className="sm:w-60">
          <label htmlFor={`${id}-sort`} className="mb-1.5 block text-xs font-semibold text-muted">Sort {kind}</label>
          <select id={`${id}-sort`} value={sort} onChange={(event) => { setSort(event.target.value as SortOrder); setDownloadStatus(""); resetScroll(); }} className="min-h-11 w-full rounded-md border border-control bg-white px-3 py-2 text-base text-ink">
            <option value="amount-desc">Largest proposal first</option>
            <option value="amount-asc">Smallest proposal first</option>
            <option value="baseline-desc">Largest enacted first</option>
            <option value="increase">Largest peso increase first</option>
            <option value="decrease">Largest peso decrease first</option>
            <option value="name">Name (A to Z)</option>
          </select>
        </div>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={exact} onChange={(event) => setExact(event.target.checked)} aria-label={`Show exact amounts for ${kind}`} className="h-4 w-4 accent-brand-700" />
          Exact amounts
        </label>
        <button type="button" onClick={downloadCsv} disabled={visibleRows.length === 0} aria-label={`Download shown ${kind} as CSV`} aria-describedby={`${id}-export-help`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-control bg-white px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50">
          <Download aria-hidden="true" className="h-4 w-4" /> Download CSV
        </button>
      </div>
      <p id={`${id}-export-help`} className="mt-1 text-xs leading-5 text-muted">CSV includes the shown rows in this sort order, exact peso values, source, and retrieval time.</p>
      <p role="status" className="text-xs leading-5 text-muted">{downloadStatus}</p>
      <div className="mt-3 flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs leading-5 text-muted">
        <p role="status">Showing {visibleRows.length} of {rows.length} {countLabel}</p>
        <p id={`${id}-units`}>{exact ? "All amounts in Philippine pesos." : "Philippine pesos. T = trillion; B = billion; M = million."}</p>
      </div>

      {visibleRows.length === 0 ? (
        <div className="mt-3 rounded-lg border border-line bg-surface p-5">
          <p className="font-semibold text-ink">{rows.length === 0 ? `No ${countLabel} available` : "No matching allocations"}</p>
          <p className="mt-1 text-sm text-muted">{rows.length === 0 ? "This source response contains no rows for this breakdown." : "Try a different name, acronym, or code."}</p>
          {query && <button type="button" onClick={() => { setQuery(""); searchInput.current?.focus(); }} className="mt-3 min-h-11 rounded-md border border-control bg-white px-3 text-sm font-semibold text-brand-700 hover:bg-brand-50">Clear search</button>}
        </div>
      ) : (
        <>
          <div ref={viewport} role="region" tabIndex={0} aria-label={`${caption}, scrollable table`} aria-describedby={`${id}-units`} className="data-table-scroll rail-scroll relative mt-3 hidden max-h-[36rem] max-w-full overflow-auto rounded-lg border border-line bg-white sm:block">
            <table className="data-table w-full min-w-[680px] border-separate border-spacing-0 text-left text-sm">
              <caption className="sr-only">{caption}{showShare ? ". Shares use the complete breakdown, including rows hidden by search." : ""}</caption>
              <thead className="sticky top-0 z-10 bg-surface text-xs text-muted">
                <tr>
                  <th scope="col" aria-sort={sort === "name" ? "ascending" : undefined} className="border-b border-line px-4 py-3 font-semibold">{nameLabel}</th>
                  <th scope="col" aria-sort={sort === "amount-desc" ? "descending" : sort === "amount-asc" ? "ascending" : undefined} className="whitespace-nowrap border-b border-line px-4 py-3 text-right font-semibold">FY{fiscalYear} proposed</th>
                  <th scope="col" aria-sort={sort === "baseline-desc" ? "descending" : undefined} className="whitespace-nowrap border-b border-line px-4 py-3 text-right font-semibold">FY{baselineYear} enacted</th>
                  <th scope="col" aria-sort={sort === "increase" ? "descending" : sort === "decrease" ? "ascending" : undefined} className="border-b border-line px-4 py-3 text-right font-semibold">Change</th>
                  {showShare && <th scope="col" className="border-b border-line px-4 py-3 text-right font-semibold">Share</th>}
                </tr>
              </thead>
              <tbody className="[&>tr:last-child>*]:border-b-0">
                {visibleRows.map((row) => (
                  <tr key={row.id} className="hover:bg-surface/60">
                    <th scope="row" className="min-w-64 border-b border-line px-4 py-3.5 font-normal">{rowName(row)}</th>
                    <td className="whitespace-nowrap border-b border-line px-4 py-3.5 text-right font-semibold tabular-nums text-ink"><PesoAmount value={row.amount} exact={exact} /></td>
                    <td className="whitespace-nowrap border-b border-line px-4 py-3.5 text-right tabular-nums text-muted"><PesoAmount value={row.base_amount} exact={exact} /></td>
                    <td className="whitespace-nowrap border-b border-line px-4 py-3.5 text-right font-semibold tabular-nums text-ink">{change(row)}</td>
                    {showShare && <td className="whitespace-nowrap border-b border-line px-4 py-3.5 text-right tabular-nums text-muted">{share(row)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="mt-3 space-y-3 sm:hidden" aria-label={caption}>
            {visibleRows.map((row) => (
              <li key={row.id} className="rounded-lg border border-line bg-white p-4">
                <h3 className="text-sm leading-6">{rowName(row)}</h3>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
                  <div className={exact ? "col-span-2" : ""}><dt className="text-muted">FY{fiscalYear} proposed</dt><dd className="mt-1 font-semibold tabular-nums text-ink"><PesoAmount value={row.amount} exact={exact} /></dd></div>
                  <div className={exact ? "col-span-2" : ""}><dt className="text-muted">FY{baselineYear} enacted</dt><dd className="mt-1 tabular-nums text-ink"><PesoAmount value={row.base_amount} exact={exact} /></dd></div>
                  <div className="col-span-2"><dt className="text-muted">Proposed change</dt><dd className="mt-1 font-semibold tabular-nums text-ink">{change(row)}</dd></div>
                  {showShare && <div className="col-span-2"><dt className="text-muted">Share of complete breakdown</dt><dd className="mt-1 tabular-nums text-ink">{share(row)}</dd></div>}
                </dl>
              </li>
            ))}
          </ul>
          {showShare && <p className="mt-2 text-xs leading-5 text-muted">Shares use the complete breakdown and do not change when you search.</p>}
        </>
      )}
    </div>
  );
}

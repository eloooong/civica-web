import Link from "next/link";
import type { Metadata } from "next";
import { Building2, Coins, FileText } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader, SectionHeader } from "@/components/ui/PageHeader";
import { OverviewDisclosure } from "@/components/ui/OverviewDisclosure";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Pagination } from "@/components/ui/Pagination";
import { SourceAttribution } from "@/components/ui/SourceAttribution";
import {
  FLOOD_CONTROL_DATA_URL,
  FLOOD_DATASET_NAME,
  FLOOD_DATASET_PAGE,
  FLOOD_DOCS_URL,
  FLOOD_SOURCE_NAME,
  FloodApiError,
  getFloodSummary,
  getFloodRetrieval,
  queryContractors,
} from "@/lib/api/floodControl";
import { formatCount, formatPesoCompact, formatPesoFull } from "@/lib/utils";
import type { ContractorSort } from "@/types/floodControl";

export const metadata: Metadata = {
  title: "Public Contractors",
  description:
    "Companies awarded flood control contracts in the Philippines: contract counts, awarded amounts, and where they work.",
};

const RESULTS_PER_PAGE = 25;

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "cost", label: "Awarded amount (high to low)" },
  { value: "contracts", label: "Number of contracts" },
  { value: "name", label: "Company name (A to Z)" },
];

type ContractorSearchParams = {
  q?: string;
  sort?: string;
  page?: string;
};

type ContractorBase = {
  q?: string;
  sort?: string;
};

function parseSort(raw: string | undefined): ContractorSort {
  if (raw === "contracts" || raw === "name") return raw;
  return "cost";
}

function pageHref(base: ContractorBase, page: number): string {
  const qs = new URLSearchParams();
  if (base.q) qs.set("q", base.q);
  if (base.sort) qs.set("sort", base.sort);
  if (page > 1) qs.set("page", String(page));
  const s = qs.toString();
  return s ? `/data/contractors?${s}` : "/data/contractors";
}

function contractsHref(contractor: string): string {
  const qs = new URLSearchParams();
  qs.set("contractor", contractor);
  return `/data/flood-control?${qs.toString()}`;
}

function yearsLabel(firstYear: number, lastYear: number): string {
  if (firstYear === 0 && lastYear === 0) return "Not recorded";
  if (firstYear === lastYear) return String(firstYear);
  return `${firstYear} to ${lastYear}`;
}

function shell(title: string, description: string, body: React.ReactNode) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Government Data", href: "/data" }, { label: "Contractors" }]}
      />
      <div className="mt-4">
        <PageHeader title={title} description={description} />
      </div>
      <div className="mt-6">{body}</div>
    </div>
  );
}

export default async function ContractorsPage({
  searchParams,
}: {
  searchParams: Promise<ContractorSearchParams>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const sort = parseSort(sp.sort);
  const parsedPage = Number.parseInt(sp.page ?? "", 10);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  let summary;
  let result;
  let retrieval;
  try {
    [summary, result, retrieval] = await Promise.all([
      getFloodSummary(),
      queryContractors({ q: q || undefined, sort, page, pageSize: RESULTS_PER_PAGE }),
      getFloodRetrieval(),
    ]);
  } catch (err) {
    return shell(
      "Public contractors",
      "Companies awarded flood control contracts in the Philippines.",
      <>
      <ErrorState
        title="Unable to load contractor data"
        description={
          err instanceof FloodApiError
            ? err.isNotFound ? "The published snapshot could not be found. You can inspect the source below or try again." : `${err.message} (Source: BetterGov.PH Transparency Dashboard.)`
            : "The flood control data file may be temporarily unavailable. Please try again."
        }
        retryHref={pageHref(sp, page)}
      />
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Link href={FLOOD_DATASET_PAGE} className="inline-flex min-h-11 items-center rounded-md border border-control px-4 text-sm font-semibold text-brand-700 hover:bg-surface">View published source</Link>
        <Link href="/data" className="inline-flex min-h-11 items-center rounded-sm px-2 text-sm font-semibold text-brand-700 hover:underline">Browse other datasets</Link>
      </div>
      </>
    );
  }

  const base: ContractorBase = { q: q || undefined, sort: sort === "cost" ? undefined : sort };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Government Data", href: "/data" },
          { label: "Contractors" },
        ]}
      />

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title="Public contractors"
          description="Companies awarded flood control contracts: how many contracts each one holds, how much it was awarded, and the regions where it works."
        />
        <div className="flex flex-wrap gap-3">
          <Link
            href="/data/flood-control"
            className="inline-flex min-h-11 items-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-brand-200 hover:text-brand-700"
          >
            All contracts
          </Link>
          <Link
            href={FLOOD_DATASET_PAGE}
            className="inline-flex min-h-11 items-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-brand-200 hover:text-brand-700"
          >
            Published source
          </Link>
        </div>
      </div>

      <p className="mt-4 max-w-3xl text-sm leading-6 text-muted">
        Publisher snapshot dated <time dateTime="2025-12-15">December 15, 2025</time>.
        Companies are grouped by the names recorded in that snapshot. Contract counts and approved budgets count each contract once; awarded amounts sum its recorded project components.
        Contract IDs are retained as published, including source IDs written in scientific notation.
      </p>

      <OverviewDisclosure title="Dataset overview">
        <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-4 lg:grid-cols-3">
          <StatCard
            icon={Building2}
            label="Companies"
            value={formatCount(summary.contractors)}
            hint="Distinct contractor names"
          />
          <StatCard
            icon={FileText}
            label="Contracts covered"
            value={formatCount(summary.contracts)}
            hint={`Across ${formatCount(summary.components)} project components`}
          />
          <StatCard
            icon={Coins}
            label="Awarded amount"
            value={formatPesoCompact(summary.totalCost)}
            hint="Sum of recorded component amounts"
          />
        </div>
      </OverviewDisclosure>

      <section aria-labelledby="contractors-heading" className="mt-8">
        <SectionHeader id="contractors-heading"
          title="Companies"
          description="Select a company to see every contract it holds in the flood control data. Every filter is reflected in the URL."
        />

        <form
          key={JSON.stringify(base)}
          method="get"
          role="search"
          aria-label="Filter contractors"
          className="mt-4 grid gap-3 rounded-lg border border-line bg-white p-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,260px)_auto]"
        >
          <div className="min-w-0 sm:col-span-2 xl:col-span-1">
            <label htmlFor="ct-q" className="block text-sm font-semibold text-muted">
              Search companies
            </label>
            <input
              id="ct-q"
              name="q"
              type="search"
              autoComplete="off"
              defaultValue={q}
              placeholder="e.g. construction, builders, trading"
              className="mt-1 w-full min-h-11 min-w-0 rounded-md border border-control bg-white px-3 py-2 text-base text-ink placeholder:text-muted focus:border-brand-600"
            />
          </div>
          <div className="min-w-0">
            <label htmlFor="ct-sort" className="block text-sm font-semibold text-muted">
              Sort by
            </label>
            <select
              id="ct-sort"
              name="sort"
              defaultValue={sort}
              className="mt-1 w-full min-h-11 min-w-0 rounded-md border border-control bg-white px-3 py-2 text-base text-ink"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <button
              type="submit"
              className="min-h-11 w-full rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 sm:w-auto"
            >
              Apply
            </button>
            {q && (
              <Link
                href="/data/contractors"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-control px-4 py-2 text-center text-sm font-semibold text-ink hover:bg-slate-50 sm:w-auto"
              >
                Clear
              </Link>
            )}
          </div>
        </form>

        {result.total === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No companies match your search"
              description="Try a shorter keyword, for example part of the company name."
              action={
                <Link
                  href="/data/contractors"
                  className="inline-block rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
                >
                  Clear search
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <p className="mt-4 text-sm text-muted" role="status">
              {formatCount(result.total)} compan{result.total === 1 ? "y" : "ies"} · showing page{" "}
              {result.page} of {result.totalPages}
            </p>

            <div
              tabIndex={0}
              role="region"
              aria-label="Contractors by awarded flood control contract value, scrollable table"
              className="data-table-scroll mt-3 hidden overflow-x-auto rounded-lg border border-line sm:block relative min-w-0 max-w-full"
            >
              <table className="data-table w-full min-w-[880px] table-fixed bg-white text-left text-sm">
                <caption className="sr-only">
                  Contractors by awarded flood control contract value
                </caption>
                <colgroup><col className="w-[36%]" /><col className="w-[10%]" /><col className="w-[18%]" /><col className="w-[18%]" /><col className="w-[18%]" /></colgroup>
                <thead>
                  <tr className="border-b border-line bg-surface text-xs uppercase tracking-wider text-muted">
                    <th scope="col" className="px-4 py-3 font-semibold">Company</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Contracts</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Awarded amount</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Approved budget</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Coverage</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((c) => (
                    <tr key={c.contractor} className="border-b border-line last:border-0 hover:bg-surface/60">
                      <th scope="row" className="break-words px-4 py-3.5 text-left font-normal">
                        <Link
                          href={contractsHref(c.contractor)}
                          className="block font-semibold leading-6 text-ink hover:text-brand-700"
                        >
                          {c.contractor}
                          <span className="mt-2 block text-xs font-medium text-brand-700 underline underline-offset-4">View contracts</span>
                        </Link>
                      </th>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold tabular-nums text-ink">
                        {formatCount(c.contracts)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold tabular-nums text-ink">
                        {formatPesoFull(Math.round(c.totalCost))}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right tabular-nums text-muted">
                        {formatPesoFull(Math.round(c.totalAbc))}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right tabular-nums text-muted">
                        <span className="block">{formatCount(c.regions)} {c.regions === 1 ? "region" : "regions"}</span>
                        <span className="mt-2 block text-xs">{yearsLabel(c.firstYear, c.lastYear)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="mt-4 space-y-3 sm:hidden">
              {result.items.map((c) => (
                <li key={c.contractor} className="rounded-lg border border-line bg-white p-4">
                  <Link
                    href={contractsHref(c.contractor)}
                    className="block text-sm font-semibold text-ink hover:text-brand-700 hover:underline"
                  >
                    {c.contractor}
                  </Link>
                  <dl className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] gap-x-4 gap-y-3 border-t border-line pt-4 text-sm">
                    <dt className="text-muted">Contracts</dt>
                    <dd className="text-right font-semibold tabular-nums text-ink">
                      {formatCount(c.contracts)}
                    </dd>
                    <dt className="text-muted">Awarded amount</dt>
                    <dd className="text-right font-semibold tabular-nums text-ink">
                      {formatPesoFull(Math.round(c.totalCost))}
                    </dd>
                    <dt className="text-muted">Approved budget</dt>
                    <dd className="text-right tabular-nums text-ink">
                      {formatPesoFull(Math.round(c.totalAbc))}
                    </dd>
                    <dt className="text-muted">Regions</dt>
                    <dd className="text-right tabular-nums text-ink">{formatCount(c.regions)}</dd>
                    <dt className="text-muted">Years active</dt>
                    <dd className="text-right tabular-nums text-ink">
                      {yearsLabel(c.firstYear, c.lastYear)}
                    </dd>
                  </dl>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <Pagination
                page={result.page}
                total={result.total}
                limit={result.pageSize}
                hrefFor={(p) => pageHref(base, p)}
              />
            </div>
          </>
        )}
      </section>

      <p className="mt-6 max-w-3xl rounded-lg border border-line bg-white p-4 text-sm leading-6 text-muted">
        Company names appear exactly as recorded in the published snapshot. Variants such
        as a name with or without a corporate suffix count as separate entries, and joint ventures
        appear as a single name. Amounts cover flood control contracts only, so they are not a
        company&apos;s total government business.
      </p>

      <div className="mt-6">
        <SourceAttribution
          source={FLOOD_SOURCE_NAME}
          docsUrl={FLOOD_DOCS_URL}
          endpoint={FLOOD_CONTROL_DATA_URL}
          dataset={FLOOD_DATASET_NAME}
          retrievals={[retrieval]}
        />
      </div>
    </div>
  );
}

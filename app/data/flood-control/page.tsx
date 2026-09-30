import Link from "next/link";
import type { Metadata } from "next";
import { Building2, Coins, FileText, MapPinned } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader, SectionHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Pagination } from "@/components/ui/Pagination";
import { SourceAttribution } from "@/components/ui/SourceAttribution";
import {
  FLOOD_CONTROL_JSON_URL,
  FLOOD_DATASET_NAME,
  FLOOD_DATASET_PAGE,
  FLOOD_DOCS_URL,
  FLOOD_SOURCE_NAME,
  FloodApiError,
  getFloodRegions,
  getFloodSummary,
  getFloodYears,
  queryFloodContracts,
} from "@/lib/api/floodControl";
import { formatCount, formatPesoCompact, formatPesoFull } from "@/lib/utils";
import type { FloodContractSort } from "@/types/floodControl";

export const metadata: Metadata = {
  title: "Flood Control Contracts",
  description:
    "Who builds Philippine flood control projects: every contract, contractor, approved budget, and award amount from the DPWH flood control dashboard.",
};

const RESULTS_PER_PAGE = 25;

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "cost", label: "Contract amount (high to low)" },
  { value: "abc", label: "Approved budget (high to low)" },
  { value: "contractor", label: "Contractor (A to Z)" },
  { value: "year", label: "Funding year (newest first)" },
];

type FloodSearchParams = {
  q?: string;
  contractor?: string;
  year?: string;
  region?: string;
  sort?: string;
  page?: string;
};

type FloodBase = {
  q?: string;
  contractor?: string;
  year?: string;
  region?: string;
  sort?: string;
};

function parseSort(raw: string | undefined): FloodContractSort {
  if (raw === "abc" || raw === "contractor" || raw === "year") return raw;
  return "cost";
}

function pageHref(base: FloodBase, page: number): string {
  const qs = new URLSearchParams();
  if (base.q) qs.set("q", base.q);
  if (base.contractor) qs.set("contractor", base.contractor);
  if (base.year) qs.set("year", base.year);
  if (base.region) qs.set("region", base.region);
  if (base.sort) qs.set("sort", base.sort);
  if (page > 1) qs.set("page", String(page));
  const s = qs.toString();
  return s ? `/data/flood-control?${s}` : "/data/flood-control";
}

function shell(title: string, description: string, body: React.ReactNode) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Government Data", href: "/data" }, { label: "Flood control contracts" }]}
      />
      <div className="mt-4">
        <PageHeader eyebrow="Government data · Contracts" title={title} description={description} />
      </div>
      <div className="mt-6">{body}</div>
    </div>
  );
}

export default async function FloodControlPage({
  searchParams,
}: {
  searchParams: Promise<FloodSearchParams>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const contractor = (sp.contractor ?? "").trim();
  const region = (sp.region ?? "").trim();
  const year = Number.parseInt(sp.year ?? "", 10);
  const hasYear = Number.isInteger(year) && year > 0;
  const sort = parseSort(sp.sort);
  const parsedPage = Number.parseInt(sp.page ?? "", 10);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  let summary;
  let regions;
  let years;
  let result;
  try {
    [summary, regions, years, result] = await Promise.all([
      getFloodSummary(),
      getFloodRegions(),
      getFloodYears(),
      queryFloodContracts({
        q: q || undefined,
        contractor: contractor || undefined,
        region: region || undefined,
        year: hasYear ? year : undefined,
        sort,
        page,
        pageSize: RESULTS_PER_PAGE,
      }),
    ]);
  } catch (err) {
    return shell(
      "Flood control contracts",
      "Every flood control contract recorded in the DPWH flood control dashboard, with the company that built it.",
      <ErrorState
        title="Unable to load flood control contracts"
        description={
          err instanceof FloodApiError
            ? `${err.message} (Source: Open Data Portal.)`
            : "The flood control data file may be temporarily unavailable. Please try again."
        }
        retryHref="/data/flood-control"
      />
    );
  }

  const base: FloodBase = {
    q: q || undefined,
    contractor: contractor || undefined,
    region: region || undefined,
    year: hasYear ? sp.year : undefined,
    sort: sort === "cost" ? undefined : sort,
  };
  const hasFilters = !!(q || contractor || region || hasYear);
  const yearLabel = hasYear ? `FY ${year}` : null;
  const regionLabel = region || null;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Government Data", href: "/data" },
          { label: "Flood control contracts" },
        ]}
      />

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          eyebrow="Government data · Contracts"
          title="Flood control contracts"
          description="Who builds Philippine flood control projects: the contractor, the approved budget, and the awarded amount for every contract in the DPWH flood control dashboard."
        />
        <div className="flex flex-wrap gap-3">
          <Link
            href="/data/contractors"
            className="inline-flex min-h-11 items-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-brand-200 hover:text-brand-700"
          >
            Contractors A to Z
          </Link>
          <Link
            href={FLOOD_DATASET_PAGE}
            className="inline-flex min-h-11 items-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-brand-200 hover:text-brand-700"
          >
            Dataset details
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 items-stretch gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={FileText}
          label="Contracts"
          value={formatCount(summary.contracts)}
          hint="Project components with a contract"
        />
        <StatCard
          icon={Building2}
          label="Contractors"
          value={formatCount(summary.contractors)}
          hint="Distinct company names"
        />
        <StatCard
          icon={Coins}
          label="Awarded amount"
          value={formatPesoCompact(summary.totalCost)}
          hint="Sum of contract costs"
        />
        <StatCard
          icon={MapPinned}
          label="Funding years"
          value={summary.yearMin === summary.yearMax ? String(summary.yearMin) : `${summary.yearMin} to ${summary.yearMax}`}
          hint={`Approved budget ${formatPesoCompact(summary.totalAbc)} total`}
        />
      </div>

      <section aria-labelledby="contracts-heading" className="mt-8">
        <SectionHeader
          title="Contracts"
          description="Search by project, contractor, or location, then filter by funding year and region. Every filter is reflected in the URL."
        />
        <h2 id="contracts-heading" className="sr-only">
          Flood control contracts
        </h2>

        <form
          method="get"
          role="search"
          aria-label="Filter flood control contracts"
          className="mt-4 grid gap-3 rounded-lg border border-line bg-white p-4 sm:grid-cols-[1fr_160px_200px_220px_auto]"
        >
          <div>
            <label htmlFor="fc-q" className="block text-xs font-semibold text-muted">
              Search contracts
            </label>
            <input
              id="fc-q"
              name="q"
              type="search"
              autoComplete="off"
              defaultValue={q}
              placeholder="e.g. pump station, Cebu, ABC Construction"
              className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand-600"
            />
          </div>
          <div>
            <label htmlFor="fc-year" className="block text-xs font-semibold text-muted">
              Funding year
            </label>
            <select
              id="fc-year"
              name="year"
              defaultValue={hasYear ? String(year) : ""}
              className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink"
            >
              <option value="">All years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="fc-region" className="block text-xs font-semibold text-muted">
              Region
            </label>
            <select
              id="fc-region"
              name="region"
              defaultValue={region}
              className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink"
            >
              <option value="">All regions</option>
              {regions.map((r) => (
                <option key={r.region} value={r.region}>
                  {r.region} ({formatCount(r.contracts)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="fc-sort" className="block text-xs font-semibold text-muted">
              Sort by
            </label>
            <select
              id="fc-sort"
              name="sort"
              defaultValue={sort}
              className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-end">
            <button
              type="submit"
              className="w-full rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 sm:w-auto"
            >
              Apply
            </button>
            {hasFilters && (
              <Link
                href="/data/flood-control"
                className="rounded-md border border-line px-4 py-2 text-center text-sm font-semibold text-ink hover:bg-slate-50 sm:w-auto"
              >
                Clear
              </Link>
            )}
          </div>
        </form>

        {(contractor || yearLabel || regionLabel || q) && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {contractor && (
              <li>
                <Link
                  href={pageHref({ ...base, contractor: undefined }, 1)}
                  className="inline-flex items-center gap-1 rounded-md border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-100"
                  aria-label={`Remove contractor filter: ${contractor}`}
                >
                  Contractor: {contractor}
                  <span aria-hidden="true">×</span>
                </Link>
              </li>
            )}
            {yearLabel && (
              <li>
                <Link
                  href={pageHref({ ...base, year: undefined }, 1)}
                  className="inline-flex items-center gap-1 rounded-md border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-100"
                  aria-label={`Remove funding year filter: ${yearLabel}`}
                >
                  {yearLabel}
                  <span aria-hidden="true">×</span>
                </Link>
              </li>
            )}
            {regionLabel && (
              <li>
                <Link
                  href={pageHref({ ...base, region: undefined }, 1)}
                  className="inline-flex items-center gap-1 rounded-md border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-100"
                  aria-label={`Remove region filter: ${regionLabel}`}
                >
                  {regionLabel}
                  <span aria-hidden="true">×</span>
                </Link>
              </li>
            )}
            {q && (
              <li>
                <Link
                  href={pageHref({ ...base, q: undefined }, 1)}
                  className="inline-flex items-center gap-1 rounded-md border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-100"
                  aria-label={`Remove search filter: ${q}`}
                >
                  Search: {q}
                  <span aria-hidden="true">×</span>
                </Link>
              </li>
            )}
          </ul>
        )}

        {result.total === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No contracts match your filters"
              description="Try a different keyword, funding year, or region."
              action={
                <Link
                  href="/data/flood-control"
                  className="inline-block rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
                >
                  Clear filters
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <p className="mt-4 text-sm text-muted" role="status">
              {formatCount(result.total)} contract{result.total === 1 ? "" : "s"} · showing page{" "}
              {result.page} of {result.totalPages}
            </p>

            <div className="mt-3 hidden overflow-x-auto rounded-lg border border-line sm:block">
              <table className="w-full min-w-[960px] border-collapse bg-white text-left text-sm">
                <caption className="sr-only">
                  Flood control contracts with contractor, approved budget, and awarded amount
                </caption>
                <thead>
                  <tr className="border-b border-line bg-surface text-xs uppercase tracking-wider text-muted">
                    <th scope="col" className="px-4 py-3 font-semibold">Contractor</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Project</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Contract</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Approved budget</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Contract amount</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Funding year</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((c) => (
                    <tr key={`${c.contractId}-${c.projectComponentId}`} className="border-b border-line last:border-0 hover:bg-surface/60">
                      <td className="px-4 py-3.5 align-top">
                        <Link
                          href={pageHref({ contractor: c.contractor }, 1)}
                          className="font-semibold text-ink hover:text-brand-700 hover:underline"
                        >
                          {c.contractor || "Not recorded"}
                        </Link>
                      </td>
                      <td className="max-w-[360px] px-4 py-3.5 align-top">
                        <span className="block leading-5 text-ink">{c.projectDescription}</span>
                        <span className="mt-0.5 block text-xs text-muted">
                          {c.municipality ? `${c.municipality} · ` : ""}
                          {c.province} · {c.region}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 align-top font-mono text-xs text-muted">
                        {c.contractId}
                        <span className="mt-0.5 block">
                          {c.startDate} to {c.completionDate || "not recorded"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right tabular-nums text-muted">
                        {formatPesoFull(Math.round(c.abc))}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold tabular-nums text-ink">
                        {formatPesoFull(Math.round(c.contractCost))}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right tabular-nums text-muted">
                        {c.fundingYear > 0 ? c.fundingYear : "–"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="mt-4 space-y-3 sm:hidden">
              {result.items.map((c) => (
                <li key={`${c.contractId}-${c.projectComponentId}`} className="rounded-lg border border-line bg-white p-4">
                  <p className="text-sm font-semibold text-ink">{c.contractor || "Contractor not recorded"}</p>
                  <p className="mt-1 text-sm leading-5 text-ink/80">{c.projectDescription}</p>
                  <p className="mt-1 text-xs text-muted">
                    {c.municipality ? `${c.municipality} · ` : ""}
                    {c.province} · {c.region}
                  </p>
                  <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <dt className="text-muted">Contract</dt>
                    <dd className="text-right font-mono text-ink">{c.contractId}</dd>
                    <dt className="text-muted">Approved budget</dt>
                    <dd className="text-right tabular-nums text-ink">{formatPesoFull(Math.round(c.abc))}</dd>
                    <dt className="text-muted">Contract amount</dt>
                    <dd className="text-right font-semibold tabular-nums text-ink">
                      {formatPesoFull(Math.round(c.contractCost))}
                    </dd>
                    <dt className="text-muted">Funding year</dt>
                    <dd className="text-right tabular-nums text-ink">
                      {c.fundingYear > 0 ? c.fundingYear : "–"}
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
        Approved budget (ABC) is the ceiling set for the bidding; the contract amount is what the
        winning company was awarded. Both figures, along with contractor names, come from the DPWH
        flood control dashboard. They record awarded contracts, not budget appropriations, and are
        reported per project component.
      </p>

      <div className="mt-6">
        <SourceAttribution
          source={FLOOD_SOURCE_NAME}
          docsUrl={FLOOD_DOCS_URL}
          endpoint={FLOOD_CONTROL_JSON_URL}
          dataset={FLOOD_DATASET_NAME}
        />
      </div>
    </div>
  );
}

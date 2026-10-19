import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Boxes, Building2, Percent } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader, SectionHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { DepartmentTrendChart, ExpenseMixChart } from "@/components/budget/BudgetCharts";
import { BudgetStatCard } from "@/components/blocks/budget-stat-card";
import { SourceAttribution } from "@/components/budget/SourceAttribution";
import {
  BUDGET_API_BASE,
  BudgetApiError,
  getDepartment,
  getObjects,
  getPrograms,
  getYearBreakdown,
} from "@/lib/api/budget";
import {
  BUDGET_FISCAL_YEARS,
  isBudgetFiscalYear,
} from "@/types/budget";
import { cn, budgetProgramPath, formatCount, formatPesoCompact, formatPesoFull, formatShare } from "@/lib/utils";

const DEFAULT_YEAR = 2026;
const PROGRAM_LIMIT = 100;
const OBJECT_LIMIT = 10;

type DetailSearchParams = {
  year?: string;
  q?: string;
  agency?: string;
  cursor?: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const { data } = await getDepartment(id);
    return {
      title: `${data.department.description} Budget`,
      description: `Enacted budget trends, agencies, and programs for ${data.department.description}, FY2020–2026.`,
    };
  } catch {
    return { title: "Department Budget" };
  }
}

function yearHref(id: string, year: number, q: string, agency: string): string {
  const qs = new URLSearchParams();
  if (year !== DEFAULT_YEAR) qs.set("year", String(year));
  if (q) qs.set("q", q);
  if (agency) qs.set("agency", agency);
  const s = qs.toString();
  return s ? `/budget/${id}?${s}` : `/budget/${id}`;
}

export default async function BudgetDepartmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<DetailSearchParams>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const parsedYear = Number.parseInt(sp.year ?? "", 10);
  const year = isBudgetFiscalYear(parsedYear) ? parsedYear : DEFAULT_YEAR;
  const budgetHref = `/budget?year=${year}`;
  const q = (sp.q ?? "").trim();
  const agency = (sp.agency ?? "").trim();
  const cursor = sp.cursor?.trim() || undefined;

  let detail;
  let programs;
  let national;
  let objects: Awaited<ReturnType<typeof getObjects>> | null = null;
  try {
    [detail, programs, national] = await Promise.all([
      getDepartment(id),
      getPrograms(id, {
        year,
        q: q || undefined,
        agencyId: agency || undefined,
        limit: PROGRAM_LIMIT,
        cursor,
      }),
      getYearBreakdown(year),
    ]);
  } catch (err) {
    if (err instanceof BudgetApiError && err.isNotFound) notFound();
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Budget", href: budgetHref }, { label: `Department ${id}` }]} />
        <div className="mt-6">
          <ErrorState
            title="Unable to load department budget"
            description={
              err instanceof BudgetApiError
                ? `${err.message} (Source: BetterGov.PH budget records.)`
                : "The BetterGov.PH budget source may be temporarily unavailable. Please try again."
            }
            retryHref={yearHref(id, year, q, agency)}
          />
        </div>
      </div>
    );
  }

  const { department, yearly_totals, agencies, expense_classes } = detail.data;
  const yearKey = String(year);
  const yearAmount = department.years[yearKey]?.amount ?? 0;
  const nationalTotal = national.data.total.amount;
  const share = nationalTotal > 0 ? yearAmount / nationalTotal : 0;
  const agencyName = new Map(agencies.map((a) => [a.id, a.description]));
  const sortedAgencies = [...agencies].sort(
    (a, b) => (b.years[yearKey]?.amount ?? 0) - (a.years[yearKey]?.amount ?? 0)
  );
  const prevTotal = yearly_totals.find((t) => t.year === year - 1);
  const currentTotal = yearly_totals.find((t) => t.year === year);
  const yoy =
    prevTotal && currentTotal && prevTotal.amount > 0
      ? ((currentTotal.amount - prevTotal.amount) / prevTotal.amount) * 100
      : null;

  // Object-level rows are optional detail: the page renders without them.
  objects = await getObjects(id, {
    year,
    sort: "amount",
    dir: "desc",
    limit: OBJECT_LIMIT,
  }).catch(() => null);

  const objectRows = objects?.data ?? [];

  const moreHref = programs.next_cursor
    ? (() => {
        const qs = new URLSearchParams();
        if (year !== DEFAULT_YEAR) qs.set("year", String(year));
        if (q) qs.set("q", q);
        if (agency) qs.set("agency", agency);
        qs.set("cursor", programs.next_cursor as string);
        return `/budget/${id}?${qs.toString()}`;
      })()
    : null;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Budget", href: budgetHref }, { label: department.description }]}
      />

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          size="compact"
          eyebrow={`Department ${department.id} · Source records`}
          title={department.description}
          description={`Enacted General Appropriations Act budgets, agencies, programs, and expense classes, FY2020–2026.`}
        />
        <Badge tone="brand">FY {year} · Enacted</Badge>
      </div>

      {/* Fiscal-year filter (shareable, preserves program filters) */}
      <div className="mt-6 flex flex-wrap items-center gap-2" role="group" aria-label="Fiscal year">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">FY</span>
        {BUDGET_FISCAL_YEARS.map((y) => (
          <Link
            key={y}
            href={yearHref(id, y, q, agency)}
            aria-current={y === year ? "true" : undefined}
            className={cn(
              "rounded-md border px-3 py-2.5 text-sm font-semibold transition-colors",
              y === year
                ? "border-brand-700 bg-brand-700 text-white"
                : "border-line bg-white text-ink/80 hover:border-brand-200 hover:text-brand-700"
            )}
          >
            {y}
          </Link>
        ))}
      </div>

      {/* Summary statistics: full-width trend card, then three even stat cards */}
      <div className="mt-6 space-y-4">
        <BudgetStatCard
          title={`Enacted budget · FY ${year}`}
          series={yearly_totals.map((t) => ({ year: t.year, amount: t.amount }))}
          defaultLabel={`Enacted GAA · FY ${year}`}
          defaultTrend={yoy}
          selectedYear={year}
          chartSize="md"
        />
        <div className="grid items-stretch gap-4 sm:grid-cols-3">
          <StatCard
            icon={Percent}
            label="Share of national budget"
            value={formatShare(share)}
            hint={`of ${formatPesoCompact(nationalTotal)} enacted`}
          />
          <StatCard
            icon={Building2}
            label="Agencies / bureaus"
            value={String(agencies.length)}
            hint="Under this department"
          />
          <StatCard
            icon={Boxes}
            label="Programs"
            value={programs.meta.matched !== undefined ? formatCount(programs.meta.matched) : "–"}
            hint={`P/A/P families · FY ${year}`}
          />
        </div>
      </div>

      {/* Charts */}
      <section aria-label="Department charts" className="mt-8 grid items-stretch gap-4 lg:grid-cols-2">
        <DepartmentTrendChart totals={yearly_totals} />
        <ExpenseMixChart classes={expense_classes} year={year} />
      </section>

      {/* Agencies */}
      <section aria-labelledby="agencies-heading" className="mt-8">
        <SectionHeader
          title="Agencies and bureaus"
          description={`Where the FY ${year} appropriation sits within the department.`}
        />
        <h2 id="agencies-heading" className="sr-only">
          Agencies and bureaus
        </h2>
        <div
          tabIndex={0}
          role="region"
          aria-label={`${department.description} agencies with FY ${year} enacted amounts, scrollable table`}
          className="mt-4 hidden overflow-x-auto rounded-lg border border-line sm:block"
        >
          <table className="w-full min-w-[560px] border-collapse bg-white text-left text-sm">
            <caption className="sr-only">
              {department.description} agencies with FY {year} enacted amounts
            </caption>
            <thead>
              <tr className="border-b border-line bg-surface text-xs uppercase tracking-wider text-muted">
                <th scope="col" className="px-4 py-3 font-semibold">Agency</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">FY {year}</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Share of dept.</th>
              </tr>
            </thead>
            <tbody>
              {sortedAgencies.map((a) => {
                const amount = a.years[yearKey]?.amount ?? 0;
                return (
                  <tr key={a.id} className="border-b border-line last:border-0 hover:bg-surface/60">
                    <td className="px-4 py-3.5">
                      <span className="block font-semibold text-ink">{a.description}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-ink">
                      {formatPesoFull(amount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right text-muted">
                      {yearAmount > 0 ? formatShare(amount / yearAmount) : "–"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <ul className="mt-4 space-y-3 sm:hidden">
          {sortedAgencies.map((a) => {
            const amount = a.years[yearKey]?.amount ?? 0;
            return (
              <li key={a.id} className="rounded-lg border border-line bg-white p-4">
                <p className="text-sm font-semibold text-ink">{a.description}</p>
                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <p className="text-sm font-bold tabular-nums text-ink">{formatPesoFull(amount)}</p>
                  <p className="text-xs text-muted">
                    FY {year} · {yearAmount > 0 ? formatShare(amount / yearAmount) : "–"} of dept.
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Programs */}
      <section aria-labelledby="programs-heading" className="mt-8">
        <SectionHeader
          title="Programs and projects"
          description={
            programs.meta.matched !== undefined
              ? `${formatCount(programs.meta.matched)} P/A/P families totaling ${formatPesoCompact(programs.meta.matched_amount ?? 0)} in FY ${year}.`
              : `P/A/P families funded in FY ${year}.`
          }
        />
        <h2 id="programs-heading" className="sr-only">
          Programs and projects
        </h2>

        <form method="get" className="mt-4 flex flex-col gap-3 rounded-lg border border-line bg-white p-4 sm:flex-row sm:items-end" role="search" aria-label="Filter programs">
          <input type="hidden" name="year" value={year} />
          <div className="flex-1">
            <label htmlFor="program-q" className="block text-xs font-semibold text-muted">
              Search programs
            </label>
            <input
              id="program-q"
              name="q"
              type="search"
              autoComplete="off"
              defaultValue={q}
              placeholder="e.g. school building, textbooks…"
              className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand-600"
            />
          </div>
          <div className="sm:w-64">
            <label htmlFor="program-agency" className="block text-xs font-semibold text-muted">
              Agency
            </label>
            <select
              id="program-agency"
              name="agency"
              defaultValue={agency}
              className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink"
            >
              <option value="">All agencies</option>
              {sortedAgencies.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.description}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              className="w-full rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 sm:w-auto"
            >
              Filter
            </button>
            {(q || agency) && (
              <Link
                href={yearHref(id, year, "", "")}
                className="rounded-md border border-line px-4 py-2 text-center text-sm font-semibold text-ink hover:bg-slate-50 sm:w-auto"
              >
                Clear
              </Link>
            )}
          </div>
        </form>

        {programs.data.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No programs match your filters"
              description="Try a different keyword or agency. Program search matches P/A/P family names for the selected fiscal year."
              action={
                <Link
                  href={yearHref(id, year, "", "")}
                  className="inline-block rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
                >
                  Clear filters
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <div
              tabIndex={0}
              role="region"
              aria-label={`Programs of ${department.description} in FY ${year}${q ? ` matching ${q}` : ""}, scrollable table`}
              className="mt-4 hidden overflow-x-auto rounded-lg border border-line sm:block"
            >
              <table className="w-full min-w-[640px] border-collapse bg-white text-left text-sm">
                <caption className="sr-only">
                  Programs of {department.description} in FY {year}
                  {q ? ` matching “${q}”` : ""}
                </caption>
                <thead>
                  <tr className="border-b border-line bg-surface text-xs uppercase tracking-wider text-muted">
                    <th scope="col" className="px-4 py-3 font-semibold">Program / project</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Agency</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">FY {year}</th>
                  </tr>
                </thead>
                <tbody>
                  {programs.data.map((p) => (
                    <tr key={p.fam_key} className="border-b border-line last:border-0 hover:bg-surface/60">
                      <td className="px-4 py-3.5">
                        <Link
                          href={budgetProgramPath(
                            id,
                            p.agency_id,
                            p.name,
                            year !== DEFAULT_YEAR ? year : undefined
                          )}
                          className="block font-semibold text-ink hover:text-brand-700 hover:underline"
                        >
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-muted">
                        {agencyName.get(p.agency_id) ?? p.agency_id}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-ink">
                        {formatPesoFull(p.years[yearKey]?.amount ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="mt-4 space-y-3 sm:hidden">
              {programs.data.map((p) => (
                <li key={p.fam_key} className="rounded-lg border border-line bg-white p-4">
                  <Link
                    href={budgetProgramPath(
                      id,
                      p.agency_id,
                      p.name,
                      year !== DEFAULT_YEAR ? year : undefined
                    )}
                    className="block text-sm font-semibold text-ink hover:text-brand-700 hover:underline"
                  >
                    {p.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted">
                    {agencyName.get(p.agency_id) ?? p.agency_id}
                  </p>
                  <p className="mt-2 text-sm font-bold tabular-nums text-ink">
                    {formatPesoFull(p.years[yearKey]?.amount ?? 0)}{" "}
                    <span className="font-normal text-muted">· FY {year}</span>
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted" role="status" aria-live="polite">
                Showing {programs.data.length}
                {programs.meta.matched !== undefined ? ` of ${formatCount(programs.meta.matched)}` : ""} programs
              </p>
              {moreHref && (
                <Link
                  href={moreHref}
                  className="rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-brand-700 hover:border-brand-200 hover:underline"
                >
                  Show more →
                </Link>
              )}
            </div>
          </>
        )}
      </section>

      {/* Object-level line items */}
      {objectRows.length > 0 && (
        <section aria-labelledby="objects-heading" className="mt-8">
          <SectionHeader
            title="Largest line items"
            description={
              objects?.meta.matched !== undefined
                ? `Top ${objectRows.length} of ${formatCount(objects.meta.matched)} line items totaling ${formatPesoCompact(objects.meta.matched_amount ?? 0)} in FY ${year}.`
                : `Individual line items for FY ${year}, the finest detail the GAA publishes.`
            }
          />
          <h2 id="objects-heading" className="sr-only">
            Largest line items
          </h2>
          <div
            tabIndex={0}
            role="region"
            aria-label={`Largest line items of ${department.description} in FY ${year}, scrollable table`}
            className="mt-4 hidden overflow-x-auto rounded-lg border border-line sm:block"
          >
            <table className="w-full min-w-[560px] border-collapse bg-white text-left text-sm">
              <caption className="sr-only">
                Largest line items of {department.description} in FY {year}
              </caption>
              <thead>
                <tr className="border-b border-line bg-surface text-xs uppercase tracking-wider text-muted">
                  <th scope="col" className="px-4 py-3 font-semibold">What the money buys</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">FY {year}</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Share of dept.</th>
                </tr>
              </thead>
              <tbody>
                {objectRows.map((row) => {
                  const amount = row.years[yearKey]?.amount ?? 0;
                  return (
                    <tr key={row.id} className="border-b border-line last:border-0 hover:bg-surface/60">
                      <td className="px-4 py-3.5 font-medium text-ink">{row.description}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold tabular-nums text-ink">
                        {formatPesoFull(amount)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right text-muted tabular-nums">
                        {yearAmount > 0 ? formatShare(amount / yearAmount) : "–"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ul className="mt-4 space-y-3 sm:hidden">
            {objectRows.map((row) => {
              const amount = row.years[yearKey]?.amount ?? 0;
              return (
                <li key={row.id} className="rounded-lg border border-line bg-white p-4">
                  <p className="text-sm font-semibold text-ink">{row.description}</p>
                  <div className="mt-2 flex items-baseline justify-between gap-2">
                    <p className="text-sm font-bold tabular-nums text-ink">{formatPesoFull(amount)}</p>
                    <p className="text-xs text-muted">
                      FY {year} · {yearAmount > 0 ? formatShare(amount / yearAmount) : "–"} of dept.
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="mt-8">
        <SourceAttribution endpoint={`${BUDGET_API_BASE}/gaa/departments/${id}`} retrievals={[detail.retrieval, programs.retrieval, national.retrieval, objects?.retrieval]} />
      </div>
    </div>
  );
}

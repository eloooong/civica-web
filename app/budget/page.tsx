import Link from "next/link";
import type { Metadata } from "next";
import { Layers, Landmark, TrendingUp } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader, SectionHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { ErrorState } from "@/components/ui/States";
import { BudgetExplorer } from "@/components/budget/BudgetExplorer";
import { NationalTrendChart, TopDepartmentsChart } from "@/components/budget/BudgetCharts";
import { BudgetStatCard } from "@/components/blocks/budget-stat-card";
import { SourceAttribution } from "@/components/budget/SourceAttribution";
import {
  BUDGET_API_BASE,
  BudgetApiError,
  getNationalTotals,
  getYearBreakdown,
} from "@/lib/api/budget";
import { BUDGET_FISCAL_YEARS, isBudgetFiscalYear } from "@/types/budget";
import { cn } from "@/lib/utils";
import { formatCount } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Budget Explorer",
  description:
    "Explore Philippine national budget data from the enacted General Appropriations Act, FY2020–2026.",
};

const DEFAULT_YEAR = 2026;

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const parsed = Number.parseInt(params.year ?? "", 10);
  const year = isBudgetFiscalYear(parsed) ? parsed : DEFAULT_YEAR;

  let national;
  let breakdown;
  try {
    [national, breakdown] = await Promise.all([getNationalTotals(), getYearBreakdown(year)]);
  } catch (err) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Budget" }]} />
        <div className="mt-4">
          <PageHeader
            eyebrow="Budget explorer"
            title="Budget Explorer"
            description="Explore Philippine national budget data from the enacted General Appropriations Act."
          />
        </div>
        <div className="mt-6">
          <ErrorState
            title="Unable to load budget data"
            description={
              err instanceof BudgetApiError
                ? `${err.message} (Source: BetterGov.PH Budget API.)`
                : "The BetterGov.PH Budget API may be temporarily unavailable. Please try again."
            }
            retryHref="/budget"
          />
        </div>
      </div>
    );
  }

  const totals = national.data;
  const { total, departments } = breakdown.data;
  const previous = totals.find((t) => t.year === year - 1);
  const yoy = previous ? ((total.amount - previous.amount) / previous.amount) * 100 : null;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Budget" }]} />
      <div className="mt-4">
        <PageHeader
          eyebrow="Budget explorer · Live data"
          title="Budget Explorer"
          description="Explore Philippine national budget data from the enacted General Appropriations Act (FY2020–2026), down to agency and program level."
          actions={
            <>
              <Link
                href="/budget/nep"
                className="inline-flex min-h-11 items-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-brand-200 hover:text-brand-700"
              >
                FY2027 proposed budget
              </Link>
              <Link
                href="/budget/cycle"
                className="inline-flex min-h-11 items-center rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-brand-200 hover:text-brand-700"
              >
                Budget execution, 2018 to 2026
              </Link>
            </>
          }
        />
      </div>

      {/* Fiscal-year filter (shareable via ?year=) */}
      <div className="mt-6 flex flex-wrap items-center gap-2" role="group" aria-label="Fiscal year">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">FY</span>
        {BUDGET_FISCAL_YEARS.map((y) => (
          <Link
            key={y}
            href={y === DEFAULT_YEAR ? "/budget" : `/budget?year=${y}`}
            aria-current={y === year ? "true" : undefined}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm font-semibold transition-colors",
              y === year
                ? "border-brand-700 bg-brand-700 text-white"
                : "border-line bg-white text-ink/80 hover:border-brand-200 hover:text-brand-700"
            )}
          >
            {y}
          </Link>
        ))}
      </div>

      {/* Summary statistics */}
      <div className="mt-6 grid grid-cols-2 items-stretch gap-3 sm:gap-4 lg:grid-cols-4">
        <BudgetStatCard
          title={`National budget · FY ${year}`}
          series={totals.map((t) => ({ year: t.year, amount: t.amount }))}
          defaultLabel={`Enacted GAA · FY ${year}`}
          defaultTrend={yoy}
        />
        <StatCard
          icon={Layers}
          label="Departments"
          value={String(departments.length)}
          hint={`In the FY ${year} enacted budget`}
        />
        <StatCard
          icon={Landmark}
          label="Line items"
          value={formatCount(total.line_items)}
          hint="Individual spending line items"
        />
        <StatCard
          icon={TrendingUp}
          label="7-year change"
          value={(() => {
            const first = totals[0];
            const last = totals[totals.length - 1];
            if (!first || !last) return "–";
            const pct = ((last.amount - first.amount) / first.amount) * 100;
            return `+${pct.toFixed(1)}%`;
          })()}
          hint="FY2020 → FY2026 enacted total"
        />
      </div>

      {/* Charts */}
      <section aria-label="Budget charts" className="mt-8 grid items-stretch gap-4 lg:grid-cols-2">
        <NationalTrendChart totals={totals} />
        <TopDepartmentsChart departments={departments} year={year} />
      </section>

      {/* Explorer table */}
      <section aria-labelledby="dept-table-heading" className="mt-8">
        <SectionHeader
          title="Budget by department"
          description={`Every department in the FY ${year} enacted budget. Select a department for agencies, programs, and trends.`}
        />
        <h2 id="dept-table-heading" className="sr-only">
          Budget by department
        </h2>
        <div className="mt-4">
          <BudgetExplorer departments={departments} year={year} />
        </div>
      </section>

      <div className="mt-8">
        <SourceAttribution endpoint={`${BUDGET_API_BASE}/gaa/years/${year}`} />
      </div>
    </div>
  );
}

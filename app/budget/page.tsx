import type { Metadata } from "next";
import { Layers, Landmark, TrendingUp } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { FiscalYearSelector } from "@/components/budget/FiscalYearSelector";
import { PageHeader, SectionHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { ErrorState } from "@/components/ui/States";
import { OverviewDisclosure } from "@/components/ui/OverviewDisclosure";
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
import { deptShortName, formatCount, formatPctDelta, formatPesoCompact, formatShare } from "@/lib/utils";

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
                ? `${err.message} (Source: BetterGov.PH budget records.)`
                : "The BetterGov.PH budget source may be temporarily unavailable. Please try again."
            }
            retryHref={`/budget?year=${year}`}
          />
        </div>
      </div>
    );
  }

  const totals = national.data;
  const { total, departments } = breakdown.data;
  const previous = totals.find((t) => t.year === year - 1);
  const yoy = previous ? ((total.amount - previous.amount) / previous.amount) * 100 : null;
  const totalsByYear = [...totals].sort((a, b) => a.year - b.year);
  const first = totalsByYear[0];
  const last = totalsByYear[totalsByYear.length - 1];
  const changePct =
    first && last && first.amount > 0
      ? ((last.amount - first.amount) / first.amount) * 100
      : null;

  // Footers for the stat cards, built from the rows already fetched above.
  const largestDepartments = [...departments]
    .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))
    .slice(0, 4)
    .map((d) => ({
      label: deptShortName(d.description),
      value: d.share !== undefined ? formatShare(d.share) : formatPesoCompact(d.amount ?? 0),
    }));

  const mostLineItems = [...departments]
    .filter((d) => (d.line_items ?? 0) > 0)
    .sort((a, b) => (b.line_items ?? 0) - (a.line_items ?? 0))
    .slice(0, 4)
    .map((d) => ({ label: deptShortName(d.description), value: formatCount(d.line_items ?? 0) }));

  const largestIncreases = totalsByYear
    .flatMap((t, i) => {
      const prev = totalsByYear[i - 1];
      if (!prev || prev.amount <= 0) return [];
      return [{ year: t.year, pct: ((t.amount - prev.amount) / prev.amount) * 100 }];
    })
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 4)
    .map((row) => ({
      label: `FY ${row.year} over FY ${row.year - 1}`,
      value: formatPctDelta(row.pct),
    }));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Budget" }]} />
      <div className="mt-4">
        <PageHeader
          title="Budget Explorer"
          description="Explore Philippine national budget data from the enacted General Appropriations Act (FY2020–2026), down to agency and program level."
        />
      </div>

      {/* Fiscal-year filter (shareable via ?year=) */}
      <FiscalYearSelector
        className="mt-6"
        year={year}
        links={BUDGET_FISCAL_YEARS.map((y) => ({ year: y, href: y === DEFAULT_YEAR ? "/budget" : `/budget?year=${y}` }))}
      />

      <OverviewDisclosure title={`Budget overview · FY ${year}`}>
        {/* Detailed statistics and charts stay available without pushing the
            department filter several screens down on phones. */}
        <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <BudgetStatCard
            title={`National budget · FY ${year}`}
            series={totals.map((t) => ({ year: t.year, amount: t.amount }))}
            defaultLabel={`Enacted GAA · FY ${year}`}
            defaultTrend={yoy}
            selectedYear={year}
          />
          <StatCard
            icon={Layers}
            label="Departments"
            value={String(departments.length)}
            valueNumber={departments.length}
            hint={`In the FY ${year} enacted budget`}
            details={{ caption: "Largest departments", rows: largestDepartments }}
          />
          <StatCard
            icon={Landmark}
            label="Line items"
            value={formatCount(total.line_items)}
            valueNumber={total.line_items}
            hint="Individual spending line items"
            details={{ caption: "Most line items", rows: mostLineItems }}
          />
          <StatCard
            icon={TrendingUp}
            label="7-year change"
            value={changePct === null ? "–" : formatPctDelta(changePct)}
            valueNumber={changePct ?? undefined}
            valueFormat="percent"
            hint="FY2020 → FY2026 enacted total"
            details={{ caption: "Largest annual increases", rows: largestIncreases }}
          />
        </div>

        {/* Charts */}
        <section aria-label="Budget charts" className="mt-8 grid items-stretch gap-4 lg:grid-cols-2">
          <NationalTrendChart totals={totals} />
          <TopDepartmentsChart departments={departments} year={year} />
        </section>
      </OverviewDisclosure>

      {/* Explorer table */}
      <section aria-labelledby="dept-table-heading" className="mt-8">
        <SectionHeader
          id="dept-table-heading"
          title="Budget by department"
          description={`Every department in the FY ${year} enacted budget. Select a department for agencies, programs, and trends.`}
        />
        <div className="mt-4">
          <BudgetExplorer departments={departments} year={year} />
        </div>
      </section>

      <div className="mt-8">
        <SourceAttribution endpoint={`${BUDGET_API_BASE}/gaa/years/${year}`} retrievals={[national.retrieval, breakdown.retrieval]} />
      </div>
    </div>
  );
}

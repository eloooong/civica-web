import Link from "next/link";
import type { Metadata } from "next";
import { Scale } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader, SectionHeader } from "@/components/ui/PageHeader";
import { ErrorState } from "@/components/ui/States";
import { SourceAttribution } from "@/components/budget/SourceAttribution";
import { CompareChart, type CompareSeries } from "@/components/budget/CompareChart";
import { BudgetStatCard } from "@/components/blocks/budget-stat-card";
import { BUDGET_API_BASE, BudgetApiError, getDepartment, getDepartments } from "@/lib/api/budget";
import {
  BUDGET_FISCAL_YEARS,
  type DepartmentRow,
  type ExpenseClassRow,
  isBudgetFiscalYear,
} from "@/types/budget";
import {
  cn,
  deptShortName,
  formatCount,
  formatPesoCompact,
  formatPesoFull,
  formatShare,
} from "@/lib/utils";

export const metadata: Metadata = {
  title: "Compare Departments",
  description:
    "Compare two Philippine departments' enacted General Appropriations Act budgets across fiscal years, FY2020 to FY2026.",
};

const DEFAULT_YEAR = 2026;

/** Amount for one department in one fiscal year, 0 when the year is absent. */
function amountIn(department: DepartmentRow, year: number): number {
  return department.years?.[String(year)]?.amount ?? 0;
}

function lineItemsIn(department: DepartmentRow, year: number): number {
  return department.years?.[String(year)]?.count ?? 0;
}

/** Year over year change for one department, null when the base is unusable. */
function yearOverYear(department: DepartmentRow, year: number): number | null {
  const previous = amountIn(department, year - 1);
  if (previous <= 0) return null;
  return ((amountIn(department, year) - previous) / previous) * 100;
}

function seriesFor(department: DepartmentRow): { year: number; amount: number }[] {
  return BUDGET_FISCAL_YEARS.map((year) => ({ year, amount: amountIn(department, year) }));
}

function classesByCode(rows: ExpenseClassRow[]): Map<string, ExpenseClassRow> {
  return new Map(rows.map((row) => [row.expense_code, row]));
}

interface ClassComparison {
  code: string;
  label: string;
  amountA: number;
  amountB: number;
  shareA: number;
  shareB: number;
  /** B minus A. Sign is direction only: neither department is the good one. */
  gap: number;
}

/** Percentage plus a bar, scaled to 100% of that department's own FY total. */
function ShareCell({ share }: { share: number }) {
  return (
    <div className="flex items-center justify-end gap-2.5">
      <span
        aria-hidden="true"
        className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-line sm:block"
      >
        <span
          className="block h-full rounded-full bg-brand-700/70"
          style={{ width: `${Math.max(share * 100, 2)}%` }}
        />
      </span>
      <span className="w-14 shrink-0 text-right tabular-nums text-muted">
        {formatShare(share)}
      </span>
    </div>
  );
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string; year?: string }>;
}) {
  const params = await searchParams;
  const parsedYear = Number.parseInt(params.year ?? "", 10);
  const year = isBudgetFiscalYear(parsedYear) ? parsedYear : DEFAULT_YEAR;

  let departments: DepartmentRow[];
  let departmentResponse: Awaited<ReturnType<typeof getDepartments>>;
  try {
    departmentResponse = await getDepartments();
    departments = departmentResponse.data;
  } catch (err) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Budget", href: "/budget" }, { label: "Compare" }]}
        />
        <div className="mt-4">
          <PageHeader
            eyebrow="Budget explorer"
            title="Compare departments"
            description="Two departments of the enacted General Appropriations Act, side by side."
          />
        </div>
        <div className="mt-6">
          <ErrorState
            title="Unable to load department budgets"
            description={
              err instanceof BudgetApiError
                ? `${err.message} (Source: BetterGov.PH budget records.)`
                : "The BetterGov.PH budget source may be temporarily unavailable. Please try again."
            }
            retryHref="/budget/compare"
          />
        </div>
      </div>
    );
  }

  /**
   * A pair is honoured only when both ids exist in the payload and differ.
   * Anything else falls back to the two largest departments for the year, so
   * the page is never empty and a mistyped parameter is not a 404.
   */
  const ranked = [...departments].sort((a, b) => amountIn(b, year) - amountIn(a, year));
  const known = new Set(departments.map((d) => d.id));
  const requestedA = params.a && known.has(params.a) ? params.a : null;
  const requestedB = params.b && known.has(params.b) ? params.b : null;
  const idA = requestedA ?? ranked[0]?.id ?? "";
  const idB = requestedB && requestedB !== idA ? requestedB : (ranked.find((d) => d.id !== idA)?.id ?? "");

  const rowA = departments.find((d) => d.id === idA);
  const rowB = departments.find((d) => d.id === idB);
  if (!rowA || !rowB) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Budget", href: "/budget" }, { label: "Compare" }]}
        />
        <div className="mt-4">
          <PageHeader eyebrow="Budget explorer" title="Compare departments" />
        </div>
        <div className="mt-6">
          <ErrorState
            title="No departments to compare"
            description="The enacted budget published no department rows for that year."
            retryHref="/budget"
          />
        </div>
      </div>
    );
  }

  // Expense classes need one request per department. Either failure degrades to
  // the trend comparison alone rather than losing the page.
  const [detailA, detailB] = await Promise.all(
    [rowA, rowB].map((row) =>
      getDepartment(row.id).catch(() => null)
    )
  );
  const classesA = detailA?.data.expense_classes ?? null;
  const classesB = detailB?.data.expense_classes ?? null;

  const yearKey = String(year);
  const totalA = amountIn(rowA, year);
  const totalB = amountIn(rowB, year);
  const labelA = deptShortName(rowA.description);
  const labelB = deptShortName(rowB.description);

  const chartPoints = BUDGET_FISCAL_YEARS.map((y) => ({
    year: String(y),
    values: { a: amountIn(rowA, y), b: amountIn(rowB, y) },
  }));
  const chartSeries: CompareSeries[] = [
    { dataKey: "a", label: labelA, color: "var(--chart-1)" },
    { dataKey: "b", label: labelB, color: "var(--chart-2)" },
  ];
  const chartSummary = BUDGET_FISCAL_YEARS.map(
    (y) =>
      `${y}: ${labelA} ${formatPesoCompact(amountIn(rowA, y))}, ${labelB} ${formatPesoCompact(amountIn(rowB, y))}`
  ).join("; ");

  const widest = chartPoints.reduce(
    (widestSoFar, point) =>
      Math.abs(point.values.a - point.values.b) >
      Math.abs(widestSoFar.values.a - widestSoFar.values.b)
        ? point
        : widestSoFar,
    { year: String(year), values: { a: 0, b: 0 } }
  );

  const classRows: ClassComparison[] = [];
  if (classesA && classesB) {
    const mapA = classesByCode(classesA);
    const mapB = classesByCode(classesB);
    for (const code of new Set([...mapA.keys(), ...mapB.keys()])) {
      const classA = mapA.get(code);
      const classB = mapB.get(code);
      const amountA = classA?.years[yearKey]?.amount ?? 0;
      const amountB = classB?.years[yearKey]?.amount ?? 0;
      classRows.push({
        code,
        label: classA?.label ?? classB?.label ?? code,
        amountA,
        amountB,
        shareA: totalA > 0 ? amountA / totalA : 0,
        shareB: totalB > 0 ? amountB / totalB : 0,
        gap: amountB - amountA,
      });
    }
    classRows.sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));
  }
  const widestClass = classRows[0];

  function yearHref(a: string, b: string, target: number): string {
    const qs = new URLSearchParams({ a, b });
    if (target !== DEFAULT_YEAR) qs.set("year", String(target));
    return `/budget/compare?${qs.toString()}`;
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Budget", href: "/budget" }, { label: "Compare" }]}
      />

      <div className="mt-4">
        <PageHeader
          eyebrow="Budget explorer · Source records"
          title="Compare two departments"
          description={`Enacted General Appropriations Act budgets for ${rowA.description} and ${rowB.description}, FY2020 to FY2026. Enacted amounts, not the FY2027 proposal.`}
        />
      </div>

      {/* Picker. A GET form keeps every pair linkable, which is the point. */}
      <form
        method="get"
        role="search"
        aria-label="Choose two departments"
        className="mt-6 flex flex-col gap-3 rounded-lg border border-line bg-white p-4 lg:flex-row lg:items-end"
      >
        <div className="flex-1">
          <label htmlFor="compare-a" className="block text-xs font-semibold text-muted">
            First department
          </label>
          <select
            id="compare-a"
            name="a"
            defaultValue={idA}
            className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink"
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.description}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label htmlFor="compare-b" className="block text-xs font-semibold text-muted">
            Second department
          </label>
          <select
            id="compare-b"
            name="b"
            defaultValue={idB}
            className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink"
          >
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.description}
              </option>
            ))}
          </select>
        </div>
        <div className="lg:w-32">
          <label htmlFor="compare-year" className="block text-xs font-semibold text-muted">
            Fiscal year
          </label>
          <select
            id="compare-year"
            name="year"
            defaultValue={year}
            className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink"
          >
            {BUDGET_FISCAL_YEARS.map((y) => (
              <option key={y} value={y}>
                FY {y}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 lg:w-auto"
        >
          Compare
        </button>
      </form>

      {(params.a || params.b) && (params.a !== idA || params.b !== idB) && (
        <p className="mt-3 text-xs text-muted" role="status">
          That pair is not in the enacted budget, so this shows {rowA.description} against{" "}
          {rowB.description}.
        </p>
      )}

      {/* One stat card per department, each pinned to the chosen year. */}
      <div className="mt-6 grid items-stretch gap-4 lg:grid-cols-2">
        <BudgetStatCard
          title={`${labelA} · FY ${year}`}
          series={seriesFor(rowA)}
          defaultLabel={`Enacted GAA · ${formatCount(lineItemsIn(rowA, year))} line items`}
          defaultTrend={yearOverYear(rowA, year)}
          selectedYear={year}
          chartSize="md"
        />
        <BudgetStatCard
          title={`${labelB} · FY ${year}`}
          series={seriesFor(rowB)}
          defaultLabel={`Enacted GAA · ${formatCount(lineItemsIn(rowB, year))} line items`}
          defaultTrend={yearOverYear(rowB, year)}
          selectedYear={year}
          chartSize="md"
        />
      </div>

      <section aria-labelledby="compare-trend-heading" className="mt-8">
        <h2 id="compare-trend-heading" className="sr-only">
          Seven year enacted budget for both departments
        </h2>
        <CompareChart
          captionId="compare-trend-caption"
          points={chartPoints}
          series={chartSeries}
          summary={`Enacted budget per fiscal year for ${rowA.description} and ${rowB.description}. ${chartSummary}.`}
          title="Enacted budget by fiscal year"
        />
      </section>

      <section aria-labelledby="compare-classes-heading" className="mt-8">
        <SectionHeader
          title={`Expense classes · FY ${year}`}
          description={
            classRows.length > 0
              ? "Personnel services, maintenance, financial expenses, and capital outlays, with each department's share of its own total for the year."
              : "Expense classes are unavailable for one of these departments right now."
          }
        />
        <h2 id="compare-classes-heading" className="sr-only">
          Expense classes for the selected fiscal year
        </h2>
        {classRows.length > 0 && (
          <>
            <div
              tabIndex={0}
              role="region"
              aria-label={`Expense classes for ${rowA.description} and ${rowB.description} in FY ${year}, scrollable table`}
              className="mt-4 hidden overflow-x-auto rounded-lg border border-line sm:block"
            >
              <table className="w-full min-w-[620px] border-collapse bg-white text-left text-sm">
                <caption className="sr-only">
                  Expense classes for {rowA.description} and {rowB.description} in FY {year}
                </caption>
                <thead>
                  <tr className="border-b border-line bg-surface text-xs uppercase tracking-wider text-muted">
                    <th scope="col" className="px-4 py-3 font-semibold">Expense class</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">{labelA}</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Share</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">{labelB}</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Share</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {classRows.map((row) => (
                    <tr key={row.code} className="border-b border-line last:border-0 hover:bg-surface/60">
                      <th scope="row" className="px-4 py-3.5 text-left font-semibold text-ink">
                        {row.label}
                      </th>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold tabular-nums text-ink">
                        {formatPesoFull(row.amountA)}
                      </td>
                      <td className="px-4 py-3.5">
                        <ShareCell share={row.shareA} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold tabular-nums text-ink">
                        {formatPesoFull(row.amountB)}
                      </td>
                      <td className="px-4 py-3.5">
                        <ShareCell share={row.shareB} />
                      </td>
                      <td
                        className={cn(
                          "whitespace-nowrap px-4 py-3.5 text-right font-semibold tabular-nums",
                          row.gap === 0 ? "text-muted" : "text-ink"
                        )}
                      >
                        {row.gap > 0 ? "+" : row.gap < 0 ? "−" : ""}
                        {formatPesoFull(Math.abs(row.gap))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="mt-4 space-y-3 sm:hidden">
              {classRows.map((row) => (
                <li key={row.code} className="rounded-lg border border-line bg-white p-4">
                  <p className="text-sm font-semibold text-ink">{row.label}</p>
                  <dl className="mt-2 space-y-1.5 text-xs">
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="min-w-0 truncate text-muted">{labelA}</dt>
                      <dd className="shrink-0 font-semibold tabular-nums text-ink">
                        {formatPesoFull(row.amountA)} · {formatShare(row.shareA)}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="min-w-0 truncate text-muted">{labelB}</dt>
                      <dd className="shrink-0 font-semibold tabular-nums text-ink">
                        {formatPesoFull(row.amountB)} · {formatShare(row.shareB)}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-muted">Difference</dt>
                      <dd className="shrink-0 font-semibold tabular-nums text-ink">
                        {row.gap > 0 ? "+" : row.gap < 0 ? "−" : ""}
                        {formatPesoFull(Math.abs(row.gap))}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Differences, stated only as arithmetic on the figures above. */}
      <section aria-labelledby="compare-gaps-heading" className="mt-8">
        <SectionHeader title="Where the two differ" description="Computed from the enacted figures above." />
        <h2 id="compare-gaps-heading" className="sr-only">
          Where the two departments differ
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-line bg-white p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
              <Scale className="h-4 w-4" aria-hidden="true" />
              FY {year} totals
            </p>
            <p className="mt-2 text-sm leading-6 text-ink/80">
              {labelA} is {formatPesoCompact(Math.abs(totalA - totalB))}{" "}
              {totalA >= totalB ? "above" : "below"} {labelB} in FY {year}:{" "}
              {formatPesoCompact(totalA)} against {formatPesoCompact(totalB)}.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-white p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
              <Scale className="h-4 w-4" aria-hidden="true" />
              Widest gap
            </p>
            <p className="mt-2 text-sm leading-6 text-ink/80">
              The largest difference between the two series falls in FY {widest.year}, at{" "}
              {formatPesoCompact(Math.abs(widest.values.a - widest.values.b))}.
            </p>
          </div>
        </div>
        {widestClass && (
          <p className="mt-3 text-sm leading-6 text-ink/80">
            The widest expense class difference in FY {year} is {widestClass.label}, where {labelB} is{" "}
            {formatPesoCompact(Math.abs(widestClass.gap))}{" "}
            {widestClass.gap >= 0 ? "above" : "below"} {labelA}.
          </p>
        )}
      </section>

      <nav aria-label="Compare other fiscal years" className="mt-8 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">Jump to FY</span>
        {BUDGET_FISCAL_YEARS.map((y) => (
          <Link
            key={y}
            href={yearHref(idA, idB, y)}
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
      </nav>

      <div className="mt-8">
        <SourceAttribution
          retrievals={[departmentResponse.retrieval, detailA?.retrieval, detailB?.retrieval]}
          dataset="General Appropriations Act (GAA), FY2020–2026"
          endpoint={`${BUDGET_API_BASE}/gaa/departments · ${BUDGET_API_BASE}/gaa/departments/${idA} · ${BUDGET_API_BASE}/gaa/departments/${idB}`}
        />
      </div>
    </div>
  );
}

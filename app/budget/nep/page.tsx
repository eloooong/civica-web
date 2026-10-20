import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader, SectionHeader } from "@/components/ui/PageHeader";
import { NepOverview } from "@/components/budget/NepOverview";
import { NepAllocationTable } from "@/components/budget/NepAllocationTable";
import { ErrorState } from "@/components/ui/States";
import { SourceAttribution } from "@/components/budget/SourceAttribution";
import { BUDGET_API_BASE, BudgetApiError, getNepOverview } from "@/lib/api/budget";
import type { NepDepartmentRow } from "@/types/budget";
import { cn, formatCount, formatPesoCompact, formatPesoDelta, formatPctDelta } from "@/lib/utils";

export const metadata: Metadata = {
  title: "FY2027 Proposed Budget",
  description:
    "The FY2027 National Expenditure Program: proposed appropriations by department, expense class, and region, compared with the FY2026 enacted budget.",
};

const DEPARTMENT_ID = /^\d{2}$/;

function changeCell(delta: number, pct: number): string {
  return `${formatPesoDelta(delta)} (${formatPctDelta(pct)})`;
}

function MoversList({
  title,
  rows,
  tone,
  baselineYear,
}: {
  title: string;
  rows: NepDepartmentRow[];
  tone: "up" | "down";
  baselineYear: number;
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-4 sm:p-5">
      <h3 className="text-sm font-bold text-ink">{title}</h3>
      <ol className="mt-3 space-y-3">
        {rows.map((row) => (
          <li key={row.id} className="flex items-baseline justify-between gap-3 border-b border-line pb-3 last:border-0 last:pb-0">
            <div className="min-w-0">
              {DEPARTMENT_ID.test(row.id) ? (
                <Link
                  href={`/budget/${row.id}?year=${baselineYear}`}
                      aria-label={`${row.description}: FY ${baselineYear} enacted budget`}
                  className="block line-clamp-2 text-sm font-semibold text-ink hover:text-brand-700 hover:underline"
                >
                  {row.description}
                </Link>
              ) : (
                <span className="block line-clamp-2 text-sm font-semibold text-ink">{row.description}</span>
              )}
              <span className={cn("block text-xs font-semibold tabular-nums", tone === "up" ? "text-emerald-700" : "text-accent-700")}>
                {changeCell(row.delta, row.pct)}
              </span>
            </div>
            <span className="shrink-0 text-xs text-muted tabular-nums">
              {formatPesoCompact(row.amount)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default async function NepPage() {
  let overview;
  try {
    overview = await getNepOverview();
  } catch (err) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Budget", href: "/budget" }, { label: "FY2027 Proposal" }]}
        />
        <div className="mt-4">
          <PageHeader
            title="FY2027 National Expenditure Program"
            description="The Executive's proposed budget for FY2027, compared with the FY2026 enacted budget."
          />
        </div>
        <div className="mt-6">
          <ErrorState
            title="Unable to load the proposed budget"
            description={
              err instanceof BudgetApiError
                ? `${err.message} (Source: BetterGov.PH budget records.)`
                : "The BetterGov.PH budget source may be temporarily unavailable. Please try again."
            }
            retryHref="/budget/nep"
          />
        </div>
      </div>
    );
  }

  const { meta, data } = overview;
  const { departments, expense_classes, regions, top_funds, top_programs, top_movers_up, top_movers_down } = data;
  const generatedOn = new Date(meta.generated_at).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Budget", href: "/budget" }, { label: "FY2027 Proposal" }]}
      />

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title="FY2027 National Expenditure Program"
          description="The proposal the Executive sends to Congress for FY2027, set against the FY2026 enacted budget. Proposal figures are not law until Congress enacts them."
        />
        <span className="rounded border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
          Proposal · not enacted
        </span>
      </div>

      <NepOverview meta={meta} data={data} />

      <p className="mt-4 text-sm text-muted">{departments.length} allocation groups · {regions.length} regional groups in this proposal</p>
      <nav aria-label="Proposal sections" className="mt-5 flex flex-wrap gap-2">
        {[['expense-classes-heading', 'Expense classes'], ['regions-heading', 'Regions'], ['nep-departments-heading', 'Departments'], ['movers-heading', 'Biggest movers'], ['top-programs-heading', 'Programs and funds']].map(([id, label]) => (
          <Link key={id} href={`#${id}`} className="inline-flex min-h-11 items-center rounded-md border border-control px-3 text-sm font-semibold text-brand-700 hover:bg-surface">{label}</Link>
        ))}
      </nav>

      <section aria-labelledby="expense-classes-heading" className="mt-8">
        <SectionHeader id="expense-classes-heading"
          title="By expense class"
          description="Personnel, maintenance, capital outlays, and financial expenditures in the proposal."
        />
        <NepAllocationTable
          kind="expense classes"
          fiscalYear={meta.fiscal_year}
          baselineYear={meta.baseline_year}
          rows={expense_classes.map((row) => ({
            id: row.code, name: row.description ?? row.code, detail: row.extra ?? undefined,
            amount: row.amount, base_amount: row.base_amount, delta: row.delta, pct: row.pct,
          }))}
        />
      </section>

      <section aria-labelledby="regions-heading" className="mt-8">
        <SectionHeader id="regions-heading"
          title="By region"
          description="Where the proposal would be spent. Regional tagging comes from the NEP source file."
        />
        <NepAllocationTable
          kind="regions"
          fiscalYear={meta.fiscal_year}
          baselineYear={meta.baseline_year}
          rows={regions.map((row) => ({
            id: row.code, name: row.description ?? row.code, detail: row.extra ?? undefined,
            amount: row.amount, base_amount: row.base_amount, delta: row.delta, pct: row.pct,
          }))}
        />
      </section>

      <section aria-labelledby="nep-departments-heading" className="mt-8">
        <SectionHeader id="nep-departments-heading"
          title="By department"
          description={`Search departments and other allocation groups, or sort by amount and change. Department links open the FY${meta.baseline_year} enacted-budget explorer.`}
        />
        <NepAllocationTable
          kind="departments"
          fiscalYear={meta.fiscal_year}
          baselineYear={meta.baseline_year}
          rows={departments.map((row) => ({
            id: row.id, name: row.description, detail: `${formatCount(row.programs)} programs`,
            href: DEPARTMENT_ID.test(row.id) ? `/budget/${row.id}?year=${meta.baseline_year}` : undefined,
            amount: row.amount, base_amount: row.base_amount, delta: row.delta, pct: row.pct,
          }))}
        />
      </section>

      <section aria-labelledby="movers-heading" className="mt-8">
        <SectionHeader id="movers-heading"
          title="Biggest movers"
          description={`Allocation groups with the largest peso changes against FY${meta.baseline_year}. These include automatic appropriations and special purpose funds.`}
        />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <MoversList title="Largest increases" rows={top_movers_up} tone="up" baselineYear={meta.baseline_year} />
          <MoversList title="Largest decreases" rows={top_movers_down} tone="down" baselineYear={meta.baseline_year} />
        </div>
      </section>

      <section aria-labelledby="top-programs-heading" className="mt-8 grid min-w-0 gap-4 lg:grid-cols-2">
        <div className="min-w-0">
          <SectionHeader id="top-programs-heading"
            title="Top programs"
            description="Largest programs and projects in the proposal."
          />
            <ol className="mt-4 rounded-lg border border-line bg-white">
            {top_programs.map((row) => (
              <li
                key={`${row.department_id}-${row.code}`}
                className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3 last:border-0"
              >
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-semibold text-ink">{row.description}</p>
                  <p className="text-xs text-muted tabular-nums">
                    {formatPesoDelta(row.delta)} ({formatPctDelta(row.pct)})
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums text-ink">
                  {formatPesoCompact(row.amount)}
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className="min-w-0">
          <SectionHeader
            title="Top funds"
            description="Largest fund sources in the proposal."
          />
          <ol className="mt-4 rounded-lg border border-line bg-white">
            {top_funds.map((row) => (
              <li
                key={row.code}
                className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3 last:border-0"
              >
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-semibold text-ink">{row.description ?? row.code}</p>
                  <p className="text-xs text-muted tabular-nums">
                    {formatPesoDelta(row.delta)} ({formatPctDelta(row.pct)})
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums text-ink">
                  {formatPesoCompact(row.amount)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <p className="mt-6 text-xs leading-5 text-muted">
        Source file: {meta.source_file.split("/").pop()} · generated {generatedOn}.
        Department rows link to the enacted FY2020 to FY2026 explorer, which is a different document.
      </p>

      <div className="mt-6">
        <SourceAttribution dataset={`National Expenditure Program (NEP), FY${meta.fiscal_year}`} endpoint={`${BUDGET_API_BASE}/nep/2027`} retrievals={[overview.retrieval]} />
      </div>
    </div>
  );
}

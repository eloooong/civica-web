import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader, SectionHeader } from "@/components/ui/PageHeader";
import { NepOverview } from "@/components/budget/NepOverview";
import { ErrorState } from "@/components/ui/States";
import { SourceAttribution } from "@/components/budget/SourceAttribution";
import { BUDGET_API_BASE, BudgetApiError, getNepOverview } from "@/lib/api/budget";
import type { NepDepartmentRow, NepRollupRow } from "@/types/budget";
import { cn, formatCount, formatPesoCompact, formatPesoDelta, formatPesoFull, formatPctDelta } from "@/lib/utils";

export const metadata: Metadata = {
  title: "FY2027 Proposed Budget",
  description:
    "The FY2027 National Expenditure Program: proposed appropriations by department, expense class, and region, compared with the FY2026 enacted budget.",
};

const DEPARTMENT_ID = /^\d{2}$/;

function changeCell(delta: number, pct: number): string {
  return `${formatPesoDelta(delta)} (${formatPctDelta(pct)})`;
}

function RollupTable({ caption, rows }: { caption: string; rows: NepRollupRow[] }) {
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  return (
    <>
    <div
      tabIndex={0}
      role="region"
      aria-label={`${caption}, scrollable table`}
      className="mt-4 hidden min-w-0 max-w-full overflow-x-auto rounded-lg border border-line bg-white sm:block relative"
    >
      <table className="w-full min-w-[560px] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line bg-surface text-xs uppercase tracking-wider text-muted">
            <th scope="col" className="px-4 py-3 font-semibold">Category</th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">FY 2027 proposed</th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">FY 2026 enacted</th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">Change</th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">Share</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.code} className="border-b border-line last:border-0 hover:bg-surface/60">
              <td className="px-4 py-3.5">
                <span className="block font-semibold text-ink">{row.description ?? row.code}</span>
                <span className="block font-mono text-xs text-muted">
                  {row.code}
                  {row.extra ? ` · ${row.extra}` : ""}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-ink tabular-nums">
                {formatPesoFull(row.amount)}
              </td>
              <td className="whitespace-nowrap px-4 py-3.5 text-right text-muted tabular-nums">
                {formatPesoFull(row.base_amount)}
              </td>
              <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-ink tabular-nums">
                {changeCell(row.delta, row.pct)}
              </td>
              <td className="whitespace-nowrap px-4 py-3.5 text-right text-muted tabular-nums">
                {total > 0 ? `${((row.amount / total) * 100).toFixed(1)}%` : "–"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <ul className="mt-4 space-y-3 sm:hidden" aria-label={caption}>
      {rows.map((row) => (
        <li key={row.code} className="rounded-lg border border-line bg-white p-4">
          <h3 className="text-base font-semibold leading-6 text-ink">{row.description ?? row.code}</h3>
          {row.extra && <p className="mt-1 text-sm text-muted">{row.extra}</p>}
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div><dt className="text-muted">FY2027 proposed</dt><dd aria-label={formatPesoFull(row.amount)} title={formatPesoFull(row.amount)} className="mt-1 font-semibold tabular-nums text-ink">{formatPesoCompact(row.amount)}</dd></div>
            <div><dt className="text-muted">FY2026 enacted</dt><dd aria-label={formatPesoFull(row.base_amount)} title={formatPesoFull(row.base_amount)} className="mt-1 font-semibold tabular-nums text-ink">{formatPesoCompact(row.base_amount)}</dd></div>
            <div className="col-span-2"><dt className="text-muted">Proposed change</dt><dd className="mt-1 font-semibold tabular-nums text-ink">{changeCell(row.delta, row.pct)}</dd></div>
            <div className="col-span-2"><dt className="text-muted">Share of this breakdown</dt><dd className="mt-1 tabular-nums text-ink">{total > 0 ? `${((row.amount / total) * 100).toFixed(1)}%` : "Unavailable"}</dd></div>
          </dl>
        </li>
      ))}
    </ul>
    </>
  );
}

function DepartmentTable({ rows, baselineYear }: { rows: NepDepartmentRow[]; baselineYear: number }) {
  return (
    <>
      <div
        tabIndex={0}
        role="region"
        aria-label="FY2027 proposed budget by department with change against FY2026, scrollable table"
        className="mt-4 hidden overflow-x-auto rounded-lg border border-line sm:block relative min-w-0 max-w-full"
      >
        <table className="w-full min-w-[680px] border-collapse bg-white text-left text-sm">
          <caption className="sr-only">
            FY2027 proposed budget by department with change against FY2026
          </caption>
          <thead>
            <tr className="border-b border-line bg-surface text-xs uppercase tracking-wider text-muted">
              <th scope="col" className="px-4 py-3 font-semibold">Department</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">FY 2027 proposed</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">FY 2026 enacted</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Change</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-line last:border-0 hover:bg-surface/60">
                <td className="px-4 py-3.5">
                  {DEPARTMENT_ID.test(row.id) ? (
                    <Link
                      href={`/budget/${row.id}?year=${baselineYear}`}
                      aria-label={`${row.description}: FY ${baselineYear} enacted budget`}
                      className="block font-semibold text-ink hover:text-brand-700 hover:underline"
                    >
                      {row.description}
                    </Link>
                  ) : (
                    <span className="block font-semibold text-ink">{row.description}</span>
                  )}
                  <span className="block text-xs text-muted">
                    {formatCount(row.programs)} programs
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-ink tabular-nums">
                  {formatPesoFull(row.amount)}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-right text-muted tabular-nums">
                  {formatPesoFull(row.base_amount)}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-ink tabular-nums">
                  {changeCell(row.delta, row.pct)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="mt-4 space-y-3 sm:hidden">
        {rows.map((row) => (
          <li key={row.id} className="rounded-lg border border-line bg-white p-4">
            {DEPARTMENT_ID.test(row.id) ? (
              <Link
                href={`/budget/${row.id}?year=${baselineYear}`}
                      aria-label={`${row.description}: FY ${baselineYear} enacted budget`}
                className="block text-sm font-semibold text-ink hover:text-brand-700 hover:underline"
              >
                {row.description}
              </Link>
            ) : (
              <p className="text-sm font-semibold text-ink">{row.description}</p>
            )}
            <p className="mt-0.5 text-xs text-muted">
              {formatCount(row.programs)} programs
            </p>
            <p className="mt-2 text-sm font-bold tabular-nums text-ink">
              {formatPesoFull(row.amount)}{" "}
              <span className="font-normal text-muted">· {changeCell(row.delta, row.pct)}</span>
            </p>
            <p className="mt-1 text-xs tabular-nums text-muted">
              FY2026 enacted {formatPesoFull(row.base_amount)}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
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
        <RollupTable caption="FY2027 proposal by expense class against FY2026 enacted" rows={expense_classes} />
      </section>

      <section aria-labelledby="regions-heading" className="mt-8">
        <SectionHeader id="regions-heading"
          title="By region"
          description="Where the proposal would be spent. Regional tagging comes from the NEP source file."
        />
        <RollupTable caption="FY2027 proposal by region against FY2026 enacted" rows={regions} />
      </section>

      <section aria-labelledby="nep-departments-heading" className="mt-8">
        <SectionHeader id="nep-departments-heading"
          title="By department"
          description={`Departments and other allocation groups, ranked by proposed amount. Department links open the FY${meta.baseline_year} enacted-budget explorer.`}
        />
        <DepartmentTable rows={departments} baselineYear={meta.baseline_year} />
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

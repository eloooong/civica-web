import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { CircleDollarSign, FileText, Gauge, Layers } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader, SectionHeader } from "@/components/ui/PageHeader";
import { SectionNav, BUDGET_SECTIONS } from "@/components/ui/SectionNav";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { ErrorState, EmptyState } from "@/components/ui/States";
import { SourceAttribution } from "@/components/budget/SourceAttribution";
import {
  BUDGET_API_BASE,
  BudgetApiError,
  getBudgetCycle,
  getBudgetCycleDepartment,
} from "@/lib/api/budget";
import type { CycleManifestResponse, CycleStage } from "@/types/budget";
import { cn, formatCount, formatPesoCompact, formatPesoFull, formatShare } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Budget Execution, 2018 to 2026",
  description:
    "How Philippine national budgets moved from proposal to enacted law to obligations and disbursements, FY2018 to FY2026.",
};

const STAGE_LABELS: Record<CycleStage, string> = {
  nep: "Proposed",
  gaa: "Enacted",
  authorized_appropriation: "Authorized",
  adjusted_appropriation: "Adjusted appropriation",
  adjusted_allotment: "Adjusted allotment",
  obligations: "Obligations",
  disbursements: "Disbursements",
};

const EXECUTION_STAGES: CycleStage[] = [
  "gaa",
  "authorized_appropriation",
  "obligations",
  "disbursements",
];

type CycleSearchParams = {
  subject?: string;
  year?: string;
};

function rangeLabel(years: number[] | undefined): string {
  if (!years || years.length === 0) return "None";
  const sorted = [...years].sort((a, b) => a - b);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  return first === last ? String(first) : `${first} to ${last}`;
}

function subjectHref(departmentId: string, year: number | null): string {
  const qs = new URLSearchParams();
  qs.set("subject", departmentId);
  if (year !== null) qs.set("year", String(year));
  return `/budget/cycle?${qs.toString()}`;
}

function stageValue(values: Partial<Record<CycleStage, number>>, stage: CycleStage): number | null {
  const value = values[stage];
  return value === undefined ? null : value;
}

function stageCell(values: Partial<Record<CycleStage, number>>, stage: CycleStage): string {
  const value = stageValue(values, stage);
  return value === null ? "–" : formatPesoFull(Math.round(value));
}

function executionCell(values: Partial<Record<CycleStage, number>>): string {
  const enacted = stageValue(values, "gaa");
  const disbursed = stageValue(values, "disbursements");
  if (enacted === null || disbursed === null || enacted <= 0) return "–";
  return formatShare(disbursed / enacted);
}

function pageShell(title: string, description: string, body: ReactNode) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Budget", href: "/budget" }, { label: "Execution" }]}
      />
      <SectionNav section="Budget" links={BUDGET_SECTIONS} current="/budget/cycle" />
      <div className="mt-4">
        <PageHeader eyebrow="Budget explorer" title={title} description={description} />
      </div>
      <div className="mt-6">{body}</div>
    </div>
  );
}

export default async function BudgetCyclePage({
  searchParams,
}: {
  searchParams: Promise<CycleSearchParams>;
}) {
  const sp = await searchParams;
  const subjectParam = (sp.subject ?? "").trim();

  let manifest: CycleManifestResponse;
  try {
    manifest = await getBudgetCycle();
  } catch (err) {
    return pageShell(
      "Budget execution, 2018 to 2026",
      "How budgets moved from proposal to enacted law to obligations and disbursements.",
      <ErrorState
        title="Unable to load the budget cycle workbook"
        description={
          err instanceof BudgetApiError
            ? `${err.message} (Source: BetterGov.PH Budget API.)`
            : "The BetterGov.PH Budget API may be temporarily unavailable. Please try again."
        }
        retryHref="/budget/cycle"
      />
    );
  }

  const subject = subjectParam
    ? manifest.data.subjects.find(
        (s) => s.canonical_portal_department_id === subjectParam
      )
    : undefined;
  if (subjectParam && !subject) notFound();

  const years = manifest.meta.years;
  const coverageYears = subject?.coverage.disbursements?.length
    ? subject.coverage.disbursements
    : years;
  const defaultYear = Math.max(...coverageYears);
  const parsedYear = Number.parseInt(sp.year ?? "", 10);
  const year = years.includes(parsedYear) ? parsedYear : defaultYear;

  let detail: Awaited<ReturnType<typeof getBudgetCycleDepartment>> | null = null;
  const departmentId = subject?.canonical_portal_department_id ?? null;
  if (subject && departmentId) {
    try {
      detail = await getBudgetCycleDepartment(departmentId);
    } catch (err) {
      if (err instanceof BudgetApiError && err.isNotFound) notFound();
      return pageShell(
        subject.display_name,
        "Program-level budget execution facts from the budget cycle workbook.",
        <ErrorState
          title="Unable to load this subject's facts"
          description={
            err instanceof BudgetApiError
              ? `${err.message} (Source: BetterGov.PH Budget API.)`
              : "The BetterGov.PH Budget API may be temporarily unavailable. Please try again."
          }
          retryHref={subjectHref(departmentId, year)}
        />
      );
    }
  }

  const scopeNote = manifest.data.note;

  if (!subject || !detail) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Budget", href: "/budget" }, { label: "Execution" }]}
        />
        <SectionNav section="Budget" links={BUDGET_SECTIONS} current="/budget/cycle" />
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <PageHeader
            eyebrow="Budget explorer · Execution"
            title="Budget execution, 2018 to 2026"
            description="One program at a time, from proposal to enacted law to authorized, adjusted, obligated, and disbursed amounts."
          />
          <Badge tone="brand">Current new appropriations only</Badge>
        </div>

        <p className="mt-4 max-w-3xl rounded-lg border border-line bg-white p-4 text-sm leading-6 text-muted">
          {scopeNote}
        </p>

        {manifestView(manifest)}

        <div className="mt-8">
          <SourceAttribution endpoint={`${BUDGET_API_BASE}/budget-cycle`} />
        </div>
      </div>
    );
  }

  const programById = new Map(detail.data.programs.map((p) => [p.source_row_id, p]));
  const buckets = new Map<string, Partial<Record<CycleStage, number>>>();
  for (const fact of detail.data.facts) {
    if (fact.fiscal_year !== year || fact.expense_class !== "total") continue;
    const bucket = buckets.get(fact.source_row_id) ?? {};
    bucket[fact.stage] = (bucket[fact.stage] ?? 0) + fact.amount;
    buckets.set(fact.source_row_id, bucket);
  }

  const rows = [...buckets.entries()]
    .map(([rowId, values]) => {
      const program = programById.get(rowId);
      if (!program) return null;
      return {
        key: rowId,
        label: program.source_pap_label,
        agency: program.source_agency_name,
        confidence: program.match_confidence,
        values,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => (b.values.gaa ?? 0) - (a.values.gaa ?? 0));

  const totals: Partial<Record<CycleStage, number>> = {};
  for (const row of rows) {
    for (const stage of EXECUTION_STAGES) {
      const value = stageValue(row.values, stage);
      if (value !== null) totals[stage] = (totals[stage] ?? 0) + value;
    }
  }

  const enactedTotal = stageValue(totals, "gaa");
  const obligationsTotal = stageValue(totals, "obligations");
  const disbursementsTotal = stageValue(totals, "disbursements");
  const rate =
    enactedTotal !== null && disbursementsTotal !== null && enactedTotal > 0
      ? disbursementsTotal / enactedTotal
      : null;

  const shown = rows.slice(0, 20);
  const subjectName = subject.display_name;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Budget", href: "/budget" },
          { label: "Execution", href: "/budget/cycle" },
          { label: subjectName },
        ]}
      />
      <SectionNav section="Budget" links={BUDGET_SECTIONS} current="/budget/cycle" />

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          eyebrow={`Budget execution · ${subject.source_sheet}`}
          title={subjectName}
          description={`How this subject's programs moved through each budget stage in FY ${year}, from the budget cycle workbook.`}
        />
        <Badge tone="brand">FY {year}</Badge>
      </div>

      {/* Fiscal-year filter (shareable via ?year=) */}
      <div className="mt-6 flex flex-wrap items-center gap-2" role="group" aria-label="Fiscal year">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">FY</span>
        {years.map((y) => (
          <Link
            key={y}
            href={subjectHref(departmentId as string, y)}
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
        <Link
          href="/budget/cycle"
          className="ml-auto rounded-md border border-line px-3 py-1.5 text-sm font-semibold text-ink hover:bg-slate-50"
        >
          All subjects
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 items-stretch gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={Layers}
          label={`Enacted · FY ${year}`}
          value={enactedTotal !== null ? formatPesoCompact(Math.round(enactedTotal)) : "–"}
          hint={enactedTotal !== null ? "Stage: enacted, expense class total" : `Not reported for FY ${year}`}
        />
        <StatCard
          icon={Gauge}
          label="Obligations"
          value={obligationsTotal !== null ? formatPesoCompact(Math.round(obligationsTotal)) : "–"}
          hint={
            obligationsTotal !== null
              ? "Contracts and commitments recorded"
              : `Not reported for FY ${year}`
          }
        />
        <StatCard
          icon={CircleDollarSign}
          label="Disbursements"
          value={disbursementsTotal !== null ? formatPesoCompact(Math.round(disbursementsTotal)) : "–"}
          hint={
            disbursementsTotal !== null
              ? "Cash actually paid out"
              : `Not reported for FY ${year}`
          }
        />
        <StatCard
          icon={FileText}
          label="Execution rate"
          value={rate !== null ? formatShare(rate) : "–"}
          hint="Disbursements divided by enacted"
        />
      </div>

      <section aria-labelledby="execution-heading" className="mt-8">
        <SectionHeader
          title={`Programs in FY ${year}`}
          description={
            rows.length > shown.length
              ? `Top ${shown.length} of ${formatCount(rows.length)} programs by enacted amount, expense class total.`
              : `${formatCount(rows.length)} programs, expense class total.`
          }
        />
        <h2 id="execution-heading" className="sr-only">
          Programs by budget stage
        </h2>

        {shown.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title={`No facts for FY ${year}`}
              description="This subject has no workbook rows for the selected year. Try an earlier fiscal year."
              action={
                <Link
                  href={subjectHref(departmentId as string, defaultYear)}
                  className="inline-block rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
                >
                  Go to FY {defaultYear}
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <div
              tabIndex={0}
              role="region"
              aria-label={`${subjectName} programs by budget stage in FY ${year}, scrollable table`}
              className="mt-4 hidden overflow-x-auto rounded-lg border border-line sm:block"
            >
              <table className="w-full min-w-[860px] border-collapse bg-white text-left text-sm">
                <caption className="sr-only">
                  {subjectName} programs by budget stage in FY {year}
                </caption>
                <thead>
                  <tr className="border-b border-line bg-surface text-xs uppercase tracking-wider text-muted">
                    <th scope="col" className="px-4 py-3 font-semibold">Program</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Agency</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Enacted</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Authorized</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Obligations</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Disbursements</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Execution</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((row) => (
                    <tr key={row.key} className="border-b border-line last:border-0 hover:bg-surface/60">
                      <td className="px-4 py-3.5">
                        <span className="block font-semibold text-ink">{row.label}</span>
                        <span className="block text-xs text-muted">
                          {row.confidence ? `Portal match: ${row.confidence}` : "Source row"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-muted">{row.agency}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-ink tabular-nums">
                        {stageCell(row.values, "gaa")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right text-muted tabular-nums">
                        {stageCell(row.values, "authorized_appropriation")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right text-muted tabular-nums">
                        {stageCell(row.values, "obligations")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right text-muted tabular-nums">
                        {stageCell(row.values, "disbursements")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-ink tabular-nums">
                        {executionCell(row.values)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="mt-4 space-y-3 sm:hidden">
              {shown.map((row) => (
                <li key={row.key} className="rounded-lg border border-line bg-white p-4">
                  <p className="text-sm font-semibold text-ink">{row.label}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {row.agency}
                    {row.confidence ? ` · portal match: ${row.confidence}` : ""}
                  </p>
                  <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <dt className="text-muted">Enacted</dt>
                    <dd className="text-right font-semibold tabular-nums text-ink">
                      {stageCell(row.values, "gaa")}
                    </dd>
                    <dt className="text-muted">Authorized</dt>
                    <dd className="text-right tabular-nums text-ink">
                      {stageCell(row.values, "authorized_appropriation")}
                    </dd>
                    <dt className="text-muted">Obligations</dt>
                    <dd className="text-right tabular-nums text-ink">
                      {stageCell(row.values, "obligations")}
                    </dd>
                    <dt className="text-muted">Disbursements</dt>
                    <dd className="text-right tabular-nums text-ink">
                      {stageCell(row.values, "disbursements")}
                    </dd>
                    <dt className="text-muted">Execution</dt>
                    <dd className="text-right font-semibold tabular-nums text-ink">
                      {executionCell(row.values)}
                    </dd>
                  </dl>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <p className="mt-6 max-w-3xl text-xs leading-5 text-muted">{scopeNote}</p>

      <div className="mt-6">
        <SourceAttribution
          endpoint={`${BUDGET_API_BASE}/budget-cycle/departments/${departmentId}`}
        />
      </div>
    </div>
  );
}

function manifestView(manifest: CycleManifestResponse) {
  const { meta, data } = manifest;
  const primary = data.subjects.filter((s) => s.is_primary_subject === 1);
  const sorted = [...data.subjects].sort((a, b) =>
    (a.canonical_portal_department_id ?? a.subject_id).localeCompare(
      b.canonical_portal_department_id ?? b.subject_id
    )
  );

  return (
    <>
      <div className="mt-6 grid grid-cols-2 items-stretch gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={Layers}
          label="Covered subjects"
          value={String(data.subjects.length)}
          hint={`${primary.length} department-level subjects`}
        />
        <StatCard
          icon={FileText}
          label="Fiscal years"
          value={String(meta.years.length)}
          hint={`${meta.years[0]} to ${meta.years[meta.years.length - 1]}`}
        />
        <StatCard
          icon={Gauge}
          label="Stages"
          value={String(meta.stages.length)}
          hint="From proposal to disbursement"
        />
        <StatCard
          icon={CircleDollarSign}
          label="Expense classes"
          value={String(meta.expense_classes.length)}
          hint="PS, MOOE, FinEx, CO, and total"
        />
      </div>

      <section aria-labelledby="pipeline-heading" className="mt-8">
        <SectionHeader
          title="The budget stages"
          description="Each stage is one step in the life of a budget. The workbook records the same programs at every step."
        />
        <h2 id="pipeline-heading" className="sr-only">
          The budget stages
        </h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {meta.stages.map((stage) => (
            <li key={stage} className="rounded-lg border border-line bg-white p-4">
              <p className="text-sm font-bold text-ink">{STAGE_LABELS[stage]}</p>
              <p className="mt-1 font-mono text-xs text-muted">{stage}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="coverage-heading" className="mt-8">
        <SectionHeader
          title="Covered subjects"
          description="Select a subject to see how its programs moved through the stages."
        />
        <h2 id="coverage-heading" className="sr-only">
          Covered subjects
        </h2>
        <div
          tabIndex={0}
          role="region"
          aria-label="Subjects covered by the budget cycle workbook and their year coverage, scrollable table"
          className="mt-4 hidden overflow-x-auto rounded-lg border border-line sm:block"
        >
          <table className="w-full min-w-[680px] border-collapse bg-white text-left text-sm">
            <caption className="sr-only">
              Subjects covered by the budget cycle workbook and their year coverage
            </caption>
            <thead>
              <tr className="border-b border-line bg-surface text-xs uppercase tracking-wider text-muted">
                <th scope="col" className="px-4 py-3 font-semibold">Subject</th>
                <th scope="col" className="px-4 py-3 font-semibold">Source sheet</th>
                <th scope="col" className="px-4 py-3 font-semibold">Enacted years</th>
                <th scope="col" className="px-4 py-3 font-semibold">Obligation years</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((subject) => {
                const deptId = subject.canonical_portal_department_id;
                return (
                  <tr key={subject.subject_id} className="border-b border-line last:border-0 hover:bg-surface/60">
                    <td className="px-4 py-3.5">
                      {deptId ? (
                        <Link
                          href={subjectHref(deptId, null)}
                          className="block font-semibold text-ink hover:text-brand-700 hover:underline"
                        >
                          {subject.display_name}
                        </Link>
                      ) : (
                        <span className="block font-semibold text-ink">{subject.display_name}</span>
                      )}
                      <span className="block font-mono text-xs text-muted">{subject.subject_id}</span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-muted">{subject.source_sheet}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-muted">
                      {rangeLabel(subject.coverage.gaa)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-muted">
                      {rangeLabel(subject.coverage.obligations)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <ul className="mt-4 space-y-3 sm:hidden">
          {sorted.map((subject) => {
            const deptId = subject.canonical_portal_department_id;
            return (
              <li key={subject.subject_id} className="rounded-lg border border-line bg-white p-4">
                {deptId ? (
                  <Link
                    href={subjectHref(deptId, null)}
                    className="block text-sm font-semibold text-ink hover:text-brand-700 hover:underline"
                  >
                    {subject.display_name}
                  </Link>
                ) : (
                  <p className="text-sm font-semibold text-ink">{subject.display_name}</p>
                )}
                <p className="mt-0.5 font-mono text-xs text-muted">{subject.subject_id}</p>
                <p className="mt-2 text-xs text-muted">
                  Enacted {rangeLabel(subject.coverage.gaa)} · obligations{" "}
                  {rangeLabel(subject.coverage.obligations)}
                </p>
                <p className="mt-0.5 font-mono text-xs text-muted">
                  Source sheet {subject.source_sheet}
                </p>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
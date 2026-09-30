import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Boxes, Gavel, List, Percent, PhilippinePeso } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader, SectionHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { ErrorState } from "@/components/ui/States";
import { SourceAttribution } from "@/components/budget/SourceAttribution";
import {
  BUDGET_API_BASE,
  BudgetApiError,
  findFamilyBySlug,
  findFpapBySlug,
  findObjectsForProgram,
  getDepartment,
  getHearingTopic,
  getProgramHierarchy,
  searchHearings,
} from "@/lib/api/budget";
import {
  BUDGET_FISCAL_YEARS,
  isBudgetFiscalYear,
  type HearingSearchHit,
  type HearingTopicDetail,
  type HierarchyRow,
  type ObjectRow,
} from "@/types/budget";
import {
  cn,
  formatCount,
  formatPesoCompact,
  formatPesoFull,
  formatShare,
} from "@/lib/utils";

const DEFAULT_YEAR = 2026;
const MAX_CHAIN_ROWS = 5;

/** Generic budget words dropped before building hearing search terms. */
const HEARING_STOPWORDS = new Set([
  "payments",
  "payment",
  "programs",
  "program",
  "projects",
  "project",
  "various",
  "completed",
  "others",
  "other",
  "national",
  "department",
  "government",
  "management",
  "support",
  "services",
  "service",
  "activities",
  "activity",
  "facility",
  "facilities",
  "expenses",
  "expense",
  "costs",
  "cost",
  "funds",
  "fund",
  "office",
  "regionwide",
  "nationwide",
  "assistance",
  "construction",
  "operations",
  "operation",
  "maintenance",
  "supplies",
  "equipment",
  "personnel",
  "compensation",
  "provision",
  "provisions",
  "strengthening",
]);

type ProgramPageSearchParams = {
  year?: string;
};

function yearHref(departmentId: string, agency: string, slug: string, year: number): string {
  const base = `/budget/${departmentId}/programs/${agency}/${slug}`;
  return year === DEFAULT_YEAR ? base : `${base}?year=${year}`;
}

function departmentHref(departmentId: string, year: number): string {
  return year === DEFAULT_YEAR
    ? `/budget/${departmentId}`
    : `/budget/${departmentId}?year=${year}`;
}

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}

function acronymFrom(description: string): string | undefined {
  const match = description.match(/\(([A-Z]{2,7})\)/);
  return match?.[1];
}

function hearingTerms(name: string): string[] {
  const tokens = name.toLowerCase().split(/[^a-z0-9]+/);
  const terms: string[] = [];
  for (const token of tokens) {
    if (token.length < 3 || HEARING_STOPWORDS.has(token) || terms.includes(token)) continue;
    terms.push(token);
  }
  return terms.slice(0, 6);
}

/**
 * Progressive hearing lookup: try the broadest term set first, then drop
 * terms until something matches, and only then drop the agency filter.
 */
async function findHearingTopics(
  name: string,
  acronym?: string
): Promise<HearingSearchHit[]> {
  const terms = hearingTerms(name);
  if (terms.length === 0) return [];
  const attempts: { q: string; agency?: string }[] = [];
  const seen = new Set<string>();
  const push = (q: string, agency?: string) => {
    const key = `${agency ?? ""}|${q}`;
    if (seen.has(key)) return;
    seen.add(key);
    attempts.push({ q, agency });
  };
  for (const size of [3, 2, 1]) {
    if (terms.length >= size) push(terms.slice(0, size).join(" "), acronym);
  }
  if (acronym && terms.length >= 2) push(terms.slice(0, 2).join(" "));
  for (const attempt of attempts) {
    try {
      const res = await searchHearings(attempt.q, { agency: attempt.agency, limit: 3 });
      if (res.data.length > 0) return res.data;
    } catch {
      // Next attempt uses a narrower term set.
    }
  }
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; agency: string; slug: string }>;
}): Promise<Metadata> {
  const { id, agency, slug } = await params;
  try {
    const family = await findFamilyBySlug(id, agency, slug, DEFAULT_YEAR);
    if (family) {
      return {
        title: `${family.name} · Budget`,
        description: `Appropriation history, administering offices, and object-level detail for ${family.name}, from the enacted General Appropriations Act.`,
      };
    }
  } catch {
    // Fall back to a prettified slug when the source API is unavailable.
  }
  return {
    title: `${titleFromSlug(slug)} · Budget`,
    description:
      "Program appropriation detail from the enacted General Appropriations Act.",
  };
}

function ChainRow({
  label,
  name,
  amount,
  depth,
  code,
}: {
  label: string;
  name: string;
  amount: number;
  depth: number;
  code?: string;
}) {
  const indent = ["pl-4", "pl-8", "pl-12", "pl-16", "pl-20"][Math.min(depth, 4)];
  return (
    <li
      className={cn(
        "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3",
        indent
      )}
    >
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-ink">{name}</p>
        {code && <p className="font-mono text-xs text-muted">{code}</p>}
      </div>
      <p className="whitespace-nowrap text-sm font-semibold tabular-nums text-ink">
        {formatPesoFull(amount)}
      </p>
    </li>
  );
}

function firstFundedYear(row: { years: Record<string, { amount: number }> }): number | null {
  for (const year of BUDGET_FISCAL_YEARS) {
    if ((row.years[String(year)]?.amount ?? 0) > 0) return year;
  }
  return null;
}

export default async function BudgetProgramPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; agency: string; slug: string }>;
  searchParams: Promise<ProgramPageSearchParams>;
}) {
  const { id, agency, slug } = await params;
  const sp = await searchParams;
  const parsedYear = Number.parseInt(sp.year ?? "", 10);
  const year = isBudgetFiscalYear(parsedYear) ? parsedYear : DEFAULT_YEAR;
  const yearKey = String(year);

  let familyRow;
  let fpapRow;
  let departmentDetail;
  try {
    [familyRow, fpapRow, departmentDetail] = await Promise.all([
      findFamilyBySlug(id, agency, slug, year),
      findFpapBySlug(id, agency, slug, year),
      getDepartment(id),
    ]);
  } catch (err) {
    if (err instanceof BudgetApiError && err.isNotFound) notFound();
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Budget", href: "/budget" },
            { label: `Department ${id}`, href: `/budget/${id}` },
            { label: "Program" },
          ]}
        />
        <div className="mt-6">
          <ErrorState
            title="Unable to load program detail"
            description={
              err instanceof BudgetApiError
                ? `${err.message} (Source: BetterGov.PH Budget API.)`
                : "The BetterGov.PH Budget API may be temporarily unavailable. Please try again."
            }
            retryHref={yearHref(id, agency, slug, year)}
          />
        </div>
      </div>
    );
  }

  if (fpapRow === null && familyRow === null) notFound();

  let name: string;
  if (familyRow !== null) name = familyRow.name;
  else name = (fpapRow as HierarchyRow).description;

  const { department, agencies } = departmentDetail.data;
  const agencyRow = agencies.find((a) => a.id === agency);
  const agencyName = agencyRow?.description ?? agency;
  const acronym = acronymFrom(department.description);
  const deptAmount = department.years[yearKey]?.amount ?? 0;

  const amount =
    familyRow !== null
      ? familyRow.years[yearKey]?.amount ?? 0
      : fpapRow !== null
        ? fpapRow.amount
        : 0;
  const lineItems =
    familyRow !== null
      ? familyRow.years[yearKey]?.count ?? 0
      : fpapRow !== null
        ? fpapRow.line_items
        : 0;
  const share = deptAmount > 0 ? amount / deptAmount : 0;

  // Hierarchy and hearings are optional detail; the page renders without them.
  const [hierarchy, hearingHits] = await Promise.all([
    fpapRow !== null
      ? getProgramHierarchy(year, id, fpapRow.id).catch(() => null)
      : Promise.resolve(null),
    findHearingTopics(name, acronym).catch(() => [] as HearingSearchHit[]),
  ]);
  const objectRows: ObjectRow[] =
    hierarchy !== null && fpapRow !== null
      ? await findObjectsForProgram(
          id,
          agency,
          fpapRow.id,
          hierarchy.expenses,
          year
        ).catch(() => [])
      : [];

  // Full deliberation records for each matched hearing topic (optional).
  const hearingRecords = await Promise.all(
    hearingHits.map((hit) =>
      getHearingTopic(hit.hearing.video_id, hit.topic.index)
        .then((res) => res.data)
        .catch(() => null as HearingTopicDetail | null)
    )
  );

  const backHref = departmentHref(id, year);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Budget", href: "/budget" },
          { label: department.description, href: `/budget/${id}` },
          { label: name },
        ]}
      />

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          eyebrow={`${agencyName} · Live data`}
          title={name}
          description={`How this program's enacted appropriation is administered: hierarchy, multi-year history, and object-level detail from the General Appropriations Act.`}
        />
        <Badge tone="brand">FY {year} · Enacted</Badge>
      </div>

      <div className="mt-4">
        <Link
          href={backHref}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-700 hover:underline"
        >
          ← Back to {department.description} programs
        </Link>
      </div>

      {/* Fiscal-year filter (shareable) */}
      <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Fiscal year">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">FY</span>
        {BUDGET_FISCAL_YEARS.map((y) => (
          <Link
            key={y}
            href={yearHref(id, agency, slug, y)}
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
      <div className="mt-6 grid items-stretch gap-4 sm:grid-cols-3">
        <StatCard
          icon={PhilippinePeso}
          label={`FY ${year} appropriation`}
          value={formatPesoFull(amount)}
          hint={
            hierarchy && hierarchy.expenses.length > 0
              ? hierarchy.expenses.map((e) => e.description).join(" · ")
              : "Enacted General Appropriations Act"
          }
        />
        <StatCard
          icon={List}
          label="Line items"
          value={formatCount(lineItems)}
          hint={`Line items funded in FY ${year}`}
        />
        <StatCard
          icon={Percent}
          label="Share of department"
          value={formatShare(share)}
          hint={`of ${formatPesoCompact(deptAmount)} enacted`}
        />
      </div>

      {fpapRow === null && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-ink">
          The full hierarchy breakdown is unavailable for this item. Only the
          appropriation history is shown.
        </div>
      )}

      {/* Who administers this program */}
      {hierarchy !== null && fpapRow !== null && (
        <section aria-labelledby="chain-heading" className="mt-8">
          <SectionHeader
            title="Who administers this program"
            description="The GAA hierarchy for this appropriation: department, agency, operating unit, fund, and expense class. The GAA does not record contractors or project locations."
          />
          <h2 id="chain-heading" className="sr-only">
            Who administers this program
          </h2>
          <ol className="mt-4 divide-y divide-line rounded-lg border border-line bg-white">
            <ChainRow
              label="Department"
              name={department.description}
              amount={deptAmount}
              depth={0}
            />
            <ChainRow
              label="Agency"
              name={agencyName}
              amount={agencyRow?.years[yearKey]?.amount ?? 0}
              depth={1}
              code={agency}
            />
            {hierarchy.operatingUnits.slice(0, MAX_CHAIN_ROWS).map((unit) => (
              <ChainRow
                key={unit.id}
                label="Operating unit"
                name={unit.description}
                amount={unit.amount}
                depth={2}
                code={unit.operunit_code}
              />
            ))}
            {hierarchy.funds.slice(0, MAX_CHAIN_ROWS).map((fund) => (
              <ChainRow
                key={fund.id}
                label="Fund source"
                name={fund.description}
                amount={fund.amount}
                depth={3}
                code={fund.fund_code}
              />
            ))}
            {hierarchy.expenses.slice(0, MAX_CHAIN_ROWS).map((expense) => (
              <ChainRow
                key={expense.id}
                label="Expense class"
                name={expense.description}
                amount={expense.amount}
                depth={4}
                code={expense.expense_code}
              />
            ))}
          </ol>
          {hierarchy.operatingUnits.length > MAX_CHAIN_ROWS && (
            <p className="mt-2 text-xs text-muted">
              Showing {MAX_CHAIN_ROWS} of {hierarchy.operatingUnits.length} operating units.
            </p>
          )}
        </section>
      )}

      {/* Appropriation history */}
      <section aria-labelledby="history-heading" className="mt-8">
        <SectionHeader
          title="Appropriation history"
          description="Enacted General Appropriations Act figures for this program, FY2020–FY2026."
        />
        <h2 id="history-heading" className="sr-only">
          Appropriation history
        </h2>
        {familyRow !== null ? (
          <div className="mt-4 overflow-x-auto rounded-lg border border-line">
            <table className="w-full min-w-[480px] border-collapse bg-white text-left text-sm">
              <caption className="sr-only">
                {name} appropriation history, FY2020 to FY2026
              </caption>
              <thead>
                <tr className="border-b border-line bg-surface text-xs uppercase tracking-wider text-muted">
                  <th scope="col" className="px-4 py-3 font-semibold">Fiscal year</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Line items</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Appropriation</th>
                </tr>
              </thead>
              <tbody>
                {BUDGET_FISCAL_YEARS.map((y) => {
                  const figure = familyRow.years[String(y)];
                  const funded = (figure?.amount ?? 0) > 0;
                  return (
                    <tr
                      key={y}
                      className={cn(
                        "border-b border-line last:border-0",
                        y === year && "bg-brand-50/60"
                      )}
                    >
                      <td className="px-4 py-2.5 font-semibold text-ink">
                        FY {y}
                        {y === year && (
                          <span className="ml-2 text-xs font-normal text-muted">selected</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted">
                        {funded ? formatCount(figure?.count ?? 0) : "0"}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-2.5 text-right tabular-nums",
                          funded ? "font-semibold text-ink" : "font-normal text-muted"
                        )}
                      >
                        {funded ? formatPesoFull(figure?.amount ?? 0) : "Not funded"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 rounded-lg border border-line bg-white px-4 py-3 text-sm text-muted">
            Multi-year history is unavailable for this item.
          </p>
        )}
      </section>

      {/* Object-level detail */}
      {objectRows.length > 0 && (
        <section aria-labelledby="objects-heading" className="mt-8">
          <SectionHeader
            title="What the money buys"
            description={`Spending categories behind the FY ${year} figure, the finest detail the GAA publishes.`}
          />
          <h2 id="objects-heading" className="sr-only">
            Spending categories
          </h2>
          <div className="mt-4 overflow-x-auto rounded-lg border border-line">
            <table className="w-full min-w-[480px] border-collapse bg-white text-left text-sm">
              <caption className="sr-only">Spending categories for {name} in FY {year}</caption>
              <thead>
                <tr className="border-b border-line bg-surface text-xs uppercase tracking-wider text-muted">
                  <th scope="col" className="px-4 py-3 font-semibold">Spending category</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">First funded</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">FY {year}</th>
                </tr>
              </thead>
              <tbody>
                {objectRows.map((row) => {
                  const figure = row.years[yearKey];
                  const firstFunded = firstFundedYear(row);
                  return (
                    <tr key={row.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 font-medium text-ink">{row.description}</td>
                      <td className="px-4 py-3 text-right text-muted">
                        {firstFunded ? `FY ${firstFunded}` : "–"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink">
                        {formatPesoFull(figure?.amount ?? 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Related hearings */}
      {hearingHits.length > 0 && (
        <section aria-labelledby="hearings-heading" className="mt-8">
          <SectionHeader
            title="Related discussion in House budget hearings"
            description="Matched by keyword against the FY2027 House Committee on Appropriations record. These are related topics, not references to this specific program. Summaries are machine-generated from the hearing transcript."
          />
          <h2 id="hearings-heading" className="sr-only">
            Related discussion in House budget hearings
          </h2>
          <ul className="mt-4 space-y-3">
            {hearingHits.map((hit, index) => {
              const record = hearingRecords[index];
              const moments = hit.matching_moments.slice(0, 2);
              const figures = (record?.figures ?? []).slice(0, 4);
              const actions = (record?.actions ?? []).slice(0, 3);
              const positions = (record?.positions ?? []).slice(0, 3);
              return (
                <li
                  key={`${hit.hearing.video_id}-${hit.topic.index}`}
                  className="rounded-lg border border-line bg-white p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Gavel className="h-4 w-4 text-brand-700" aria-hidden="true" />
                    <a
                      href={hit.topic.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-brand-700 hover:underline"
                    >
                      {hit.topic.topic}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                    <Badge>{hit.topic.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {hit.hearing.title} · {hit.hearing.hearing_date} · FY {hit.hearing.fiscal_year} ·{" "}
                    {hit.topic.timestamp}
                  </p>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink/80">
                    {hit.topic.summary}
                  </p>

                  {moments.length > 0 && (
                    <ul className="mt-3 space-y-2 border-l-2 border-brand-200 pl-3">
                      {moments.map((moment) => (
                        <li key={`${moment.seconds}-${moment.url}`}>
                          <blockquote className="text-sm leading-6 text-ink/80">
                            &ldquo;{moment.said}&rdquo;
                          </blockquote>
                          <p className="mt-0.5 text-xs text-muted">
                            {moment.speaker ? `${moment.speaker} · ` : ""}
                            <a
                              href={moment.url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-brand-700 hover:underline"
                            >
                              {moment.timestamp}
                              <span className="sr-only"> (opens in a new tab)</span>
                            </a>
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}

                  {record && (record.question || record.agency_position || record.outcome) && (
                    <details className="mt-3 rounded-md border border-line bg-surface/60 p-3">
                      <summary className="cursor-pointer text-sm font-semibold text-brand-700">
                        Deliberation record
                      </summary>
                      <div className="mt-3 space-y-3 text-sm leading-6">
                        {record.question && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                              Question at issue
                            </p>
                            <p className="mt-1 text-ink/80">{record.question}</p>
                          </div>
                        )}
                        {record.agency_position && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                              Agency position
                            </p>
                            <p className="mt-1 text-ink/80">{record.agency_position}</p>
                          </div>
                        )}
                        {record.outcome && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                              Outcome
                            </p>
                            <p className="mt-1 text-ink/80">{record.outcome}</p>
                          </div>
                        )}
                        {figures.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                              Figures mentioned
                            </p>
                            <ul className="mt-1 space-y-1">
                              {figures.map((figure) => (
                                <li
                                  key={`${figure.url}-${figure.amount_text}`}
                                  className="flex flex-wrap items-baseline gap-x-2"
                                >
                                  <span className="font-semibold tabular-nums text-ink">
                                    {figure.amount_text}
                                  </span>
                                  <span className="text-muted">{figure.what}</span>
                                  {figure.url && (
                                    <a
                                      href={figure.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs font-semibold text-brand-700 hover:underline"
                                    >
                                      {figure.timestamp}
                                      <span className="sr-only"> (opens in a new tab)</span>
                                    </a>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {actions.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                              Commitments and requests
                            </p>
                            <ul className="mt-1 list-disc space-y-1 pl-5">
                              {actions.map((action) => (
                                <li key={`${action.url}-${action.kind}`}>
                                  <span className="text-ink/80">{action.action}</span>{" "}
                                  <span className="text-xs text-muted">
                                    ({action.kind.replace(/_/g, " ")}, {action.who})
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {positions.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                              Positions taken
                            </p>
                            <ul className="mt-1 space-y-1">
                              {positions.map((position) => (
                                <li key={`${position.who}-${position.position.slice(0, 40)}`}>
                                  <span className="font-semibold text-ink">{position.who}:</span>{" "}
                                  <span className="text-ink/80">{position.position}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Scope note */}
      <div className="mt-8 flex items-start gap-2.5 rounded-lg border border-line bg-surface px-4 py-3 text-xs leading-5 text-muted">
        <Boxes className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
        <p>
          The General Appropriations Act records appropriations, not contracts. Contractors,
          project locations, and procurement details are not part of this dataset; those are
          published in PhilGEPS and DBM project schedules. Verify figures against official DBM
          documents before citing them.
        </p>
      </div>

      <div className="mt-8">
        <SourceAttribution
          endpoint={[
            `${BUDGET_API_BASE}/gaa/years/${year}/departments/${id}/children`,
            `${BUDGET_API_BASE}/gaa/departments/${id}/programs`,
            ...(hearingHits.length > 0 ? [`${BUDGET_API_BASE}/hearings/search`] : []),
          ].join(" · ")}
        />
      </div>
    </div>
  );
}

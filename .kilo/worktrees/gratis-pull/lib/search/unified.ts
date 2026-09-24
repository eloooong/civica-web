/**
 * Unified search across Budget, Congress, and Government Data.
 *
 * Architecture (per implementation plan):
 *
 *   User query
 *        ↓
 *   searchAll() — fans out to the three source APIs in parallel
 *        ↓
 *   normalize — each source mapped into the shared SearchResult shape
 *        ↓
 *   rank — deterministic, explainable ordering (see rankResults)
 *        ↓
 *   UI — grouped sections per source; never raw API dumps
 *
 * Server-side only. Each source is fetched independently with
 * Promise.allSettled, so one unavailable API degrades to a per-source
 * notice instead of failing the whole search. Caching comes from the
 * per-source clients (1h revalidation each).
 */
import { searchPrograms } from "@/lib/api/budget";
import { searchDocuments, searchPeople } from "@/lib/api/congress";
import { listDatasets } from "@/lib/api/datasets";
import {
  billDisplayTitle,
  billLabel,
  congressOrdinal,
  formatFiledDate,
  personFullName,
} from "@/lib/congress";
import { formatBytes, formatVersionDate } from "@/lib/datasets";
import { formatPesoCompact } from "@/lib/utils";
import type { SearchResult } from "@/types/search";

export type SearchSource = "budget" | "congress" | "data";

export const SOURCE_LABELS: Record<SearchSource, string> = {
  budget: "Budget",
  congress: "Congress",
  data: "Government Data",
};

const BUDGET_YEAR = 2026;

export interface SourceResults {
  source: SearchSource;
  results: SearchResult[];
  /** Total matches reported by the source (may exceed results.length). */
  total: number;
}

export interface FailedSource {
  source: SearchSource;
  message: string;
}

export interface UnifiedSearch {
  query: string;
  sections: SourceResults[];
  failed: FailedSource[];
  total: number;
}

/**
 * Ranking is intentionally simple and explainable:
 * 1. Within each source, keep the source API's own relevance order.
 * 2. Boost results whose title starts with the query (stable partition).
 * Sections are always ordered Budget → Congress → Data.
 */
function rankResults(results: SearchResult[], query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return results;
  const startsWith: SearchResult[] = [];
  const rest: SearchResult[] = [];
  for (const r of results) {
    if (r.title.toLowerCase().startsWith(q)) startsWith.push(r);
    else rest.push(r);
  }
  return [...startsWith, ...rest];
}

async function searchBudgetSource(query: string, limit: number): Promise<SourceResults> {
  const res = await searchPrograms({ q: query, year: BUDGET_YEAR, limit });
  const results: SearchResult[] = res.data.map((p) => {
    const yearFig = p.years[String(BUDGET_YEAR)];
    const dept = p.department ?? p.department_id;
    return {
      id: `budget-${p.department_id}-${p.fam_key}`,
      type: "budget",
      title: p.name,
      description: `${dept} · FY${BUDGET_YEAR} ${formatPesoCompact(yearFig?.amount ?? 0)} · ${(yearFig?.count ?? 0).toLocaleString("en-PH")} line items`,
      agency: dept,
      metadata: {
        fiscalYear: BUDGET_YEAR,
        amount: yearFig?.amount ?? 0,
        departmentId: p.department_id,
      },
      url: `/budget/${p.department_id}`,
    };
  });
  const total = res.meta.matched ?? res.meta.returned ?? res.data.length;
  return { source: "budget", results: rankResults(results, query), total };
}

async function searchCongressSource(
  query: string,
  billLimit: number,
  personLimit: number
): Promise<SourceResults> {
  const [bills, people] = await Promise.all([
    searchDocuments({ q: query, limit: billLimit }),
    searchPeople(query, { limit: personLimit }),
  ]);
  const results: SearchResult[] = [
    ...bills.data.map(
      (b): SearchResult => ({
        id: `bill-${b.id}`,
        type: "bill",
        title: billDisplayTitle(b),
        description: `${billLabel(b)} · ${congressOrdinal(b.congress)} · Filed ${formatFiledDate(b.date_filed)}`,
        metadata: { congress: b.congress ?? 0, billNumber: b.bill_number ?? 0 },
        url: `/congress/bills/${b.id}`,
      })
    ),
    ...people.data.map(
      (p): SearchResult => ({
        id: `person-${p.id}`,
        type: "person",
        title: personFullName(p),
        description: "Legislator profile · congresses served and authored bills",
        metadata: {},
        url: `/congress/people/${p.id}`,
      })
    ),
  ];
  const total =
    (bills.pagination?.total ?? bills.data.length) + (people.pagination?.total ?? people.data.length);
  return { source: "congress", results: rankResults(results, query), total };
}

async function searchDataSource(query: string, limit: number): Promise<SourceResults> {
  const res = await listDatasets({ search: query, limit });
  const results: SearchResult[] = res.data.map((d) => ({
    id: `dataset-${d.id}`,
    type: "dataset",
    title: d.name,
    description: `${d.publisher?.name ?? "Unknown publisher"} · Updated ${formatVersionDate(d.latest_version_date)} · ${formatBytes(d.size_bytes)}`,
    agency: d.publisher?.name ?? undefined,
    metadata: { datasetId: d.id },
    url: `/data/${d.id}`,
  }));
  return {
    source: "data",
    results: rankResults(results, query),
    total: res.pagination?.total ?? res.data.length,
  };
}

export interface SearchAllOptions {
  budgetLimit?: number;
  billLimit?: number;
  personLimit?: number;
  datasetLimit?: number;
  /** Restrict to one source (used by category tabs). */
  only?: SearchSource;
}

/** Fan out to all (or one) sources; per-source failures degrade gracefully. */
export async function searchAll(query: string, options: SearchAllOptions = {}): Promise<UnifiedSearch> {
  const q = query.trim();
  const { budgetLimit = 5, billLimit = 5, personLimit = 4, datasetLimit = 5, only } = options;

  const tasks: { source: SearchSource; run: () => Promise<SourceResults> }[] = [];
  if (!only || only === "budget") tasks.push({ source: "budget", run: () => searchBudgetSource(q, budgetLimit) });
  if (!only || only === "congress")
    tasks.push({ source: "congress", run: () => searchCongressSource(q, billLimit, personLimit) });
  if (!only || only === "data") tasks.push({ source: "data", run: () => searchDataSource(q, datasetLimit) });

  const settled = await Promise.allSettled(tasks.map((t) => t.run()));
  const sections: SourceResults[] = [];
  const failed: FailedSource[] = [];
  settled.forEach((outcome, i) => {
    const source = tasks[i]!.source;
    if (outcome.status === "fulfilled") {
      sections.push(outcome.value);
    } else {
      failed.push({
        source,
        message:
          outcome.reason instanceof Error ? outcome.reason.message : "Search failed for this source.",
      });
    }
  });

  // Keep canonical section order regardless of settle order.
  const order: SearchSource[] = ["budget", "congress", "data"];
  sections.sort((a, b) => order.indexOf(a.source) - order.indexOf(b.source));

  return { query: q, sections, failed, total: sections.reduce((sum, s) => sum + s.total, 0) };
}

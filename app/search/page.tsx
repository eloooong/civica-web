import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle, Building2, Database, FileText } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader, SectionHeader } from "@/components/ui/PageHeader";
import { SearchBar } from "@/components/search/SearchBar";
import { Badge } from "@/components/ui/Badge";
import { DataCard } from "@/components/ui/DataCard";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { popularSearches } from "@/lib/placeholder";
import { SOURCE_LABELS, searchAll, type SearchSource } from "@/lib/search/unified";
import type { SearchResult } from "@/types/search";

export const metadata: Metadata = {
  title: "Search",
  description: "Search Philippine budgets, bills, legislators, and government datasets in one place.",
};

const tabs = [
  { key: "all", label: "All", only: undefined },
  { key: "budget", label: "Budget", only: "budget" },
  { key: "bill", label: "Congress", only: "congress" },
  { key: "dataset", label: "Government Data", only: "data" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

const typeBadge: Record<SearchResult["type"], string> = {
  budget: "BUDGET",
  bill: "BILL",
  person: "PERSON",
  dataset: "DATASET",
};

const hrefLabel: Record<SearchResult["type"], string> = {
  budget: "Open program",
  bill: "View bill",
  person: "View profile",
  dataset: "View dataset",
};

function ResultList({ results }: { results: SearchResult[] }) {
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {results.map((r) => (
        <li key={r.id}>
          <DataCard
            badge={typeBadge[r.type]}
            title={r.title}
            description={r.description ?? ""}
            href={r.url}
            hrefLabel={hrefLabel[r.type]}
            meta={
              <>
                <Badge tone="brand">{r.type}</Badge>
                {r.agency && <Badge>{r.agency}</Badge>}
              </>
            }
          />
        </li>
      ))}
    </ul>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const activeTab: TabKey = tabs.some((t) => t.key === params.tab) ? (params.tab as TabKey) : "all";
  const only = tabs.find((t) => t.key === activeTab)?.only as SearchSource | undefined;

  const tabHref = (tab: TabKey) => {
    const qs = new URLSearchParams();
    if (query) qs.set("q", query);
    if (tab !== "all") qs.set("tab", tab);
    const s = qs.toString();
    return s ? `/search?${s}` : "/search";
  };

  // Live search only for queries the source APIs accept (min 2 chars).
  const unified =
    query.length >= 2
      ? await searchAll(query, {
          only,
          budgetLimit: activeTab === "all" ? 5 : 20,
          billLimit: activeTab === "all" ? 5 : 15,
          personLimit: activeTab === "all" ? 4 : 10,
          datasetLimit: activeTab === "all" ? 10 : 20,
        })
      : null;

  const allFailed = unified !== null && unified.sections.length === 0;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Search" }]} />
      <div className="mt-4">
        <PageHeader
          eyebrow="Unified search · Live"
          title="Search Civica"
          description="Search budgets, bills, legislators, and datasets in one place, with every result linked to its source."
        />
      </div>

      <div className="mt-6 max-w-2xl">
        <SearchBar key={query} defaultValue={query} />
      </div>

      {/* Category navigation — plain links (with aria-current), not ARIA tabs:
          these navigate to distinct URLs rather than switching in-page tabpanels. */}
      <nav aria-label="Search categories" className="mt-6 border-b border-line">
        <ul className="flex flex-wrap gap-1">
          {tabs.map((tab) => {
            const selected = tab.key === activeTab;
            return (
              <li key={tab.key}>
                <Link
                  href={tabHref(tab.key)}
                  aria-current={selected ? "page" : undefined}
                  className={
                    selected
                      ? "inline-block rounded-t-md border border-b-white border-line bg-white px-4 py-2.5 text-sm font-semibold text-brand-800"
                      : "inline-block rounded-t-md px-4 py-2.5 text-sm font-medium text-muted hover:bg-slate-50 hover:text-ink"
                  }
                >
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <section aria-labelledby="results-heading" className="py-8">
        {!query ? (
          <>
            <SectionHeader
              title="Start exploring"
              description="Enter a query above, or try a popular search. Every link below runs a live search."
            />
            <h2 id="results-heading" className="sr-only">
              Popular searches
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              {[
                { heading: "Budget", items: popularSearches.filter((p) => p.category === "Budget") },
                { heading: "Congress", items: popularSearches.filter((p) => p.category === "Congress") },
                { heading: "Government Data", items: popularSearches.filter((p) => p.category === "Data") },
              ].map((group) => (
                <div key={group.heading} className="rounded-lg border border-line bg-surface p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {group.heading}
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {group.items.map((item) => (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          className="flex min-h-11 items-center rounded-sm text-sm font-medium text-brand-700 hover:underline"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </>
        ) : query.length < 2 ? (
          <>
            <h2 id="results-heading" className="sr-only">
              Search results
            </h2>
            <EmptyState
              title="Keep typing"
              description="Search needs at least 2 characters. The source APIs don't accept shorter queries."
            />
          </>
        ) : allFailed ? (
          <>
            <h2 id="results-heading" className="sr-only">
              Search results
            </h2>
            <ErrorState
              title="Search is unavailable right now"
              description="None of the three data sources could be reached. Please try again in a moment."
              retryHref={`/search?q=${encodeURIComponent(query)}`}
            />
          </>
        ) : (
          unified && (
            <>
              <SectionHeader
                title={`Results for “${query}”`}
                description={`${unified.total.toLocaleString("en-PH")} total match${unified.total === 1 ? "" : "es"} · ${activeTab === "all" ? "All sources" : tabs.find((t) => t.key === activeTab)?.label} · ranked with title matches first`}
              />
              <h2 id="results-heading" className="sr-only">
                Search results
              </h2>

              {unified.failed.length > 0 && (
                <div
                  role="status"
                  className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-ink"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
                  <p>
                    {unified.failed.map((f) => SOURCE_LABELS[f.source]).join(" and ")} result
                    {unified.failed.length === 1 ? " is" : "s are"} unavailable right now. Showing
                    the sources that responded.
                  </p>
                </div>
              )}

              {unified.total === 0 ? (
                <div className="mt-6">
                  <EmptyState
                    title="No matches anywhere"
                    description={`Nothing in budgets, bills, legislators, or datasets matches “${query}”. Try fewer or simpler words.`}
                    action={
                      <Link
                        href="/search"
                        className="inline-block rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
                      >
                        Clear search
                      </Link>
                    }
                  />
                </div>
              ) : activeTab === "all" ? (
                <div className="mt-6 space-y-8">
                  {unified.sections.map((section) => (
                    <div key={section.source}>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="text-base font-bold text-ink">
                          {SOURCE_LABELS[section.source]}{" "}
                          <span className="text-sm font-medium text-muted">
                            · {section.total.toLocaleString("en-PH")} match{section.total === 1 ? "" : "es"}
                          </span>
                        </h3>
                        <Link
                          href={tabHref(
                            section.source === "budget" ? "budget" : section.source === "congress" ? "bill" : "dataset"
                          )}
                          className="rounded-sm text-sm font-semibold text-brand-700 hover:underline"
                        >
                          View all {SOURCE_LABELS[section.source].toLowerCase()} results →
                        </Link>
                      </div>
                      <div className="mt-3">
                        <ResultList results={section.results} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 space-y-8">
                  {unified.sections.map((section) => (
                    <div key={section.source}>
                      <p className="text-sm text-muted" role="status">
                        {section.total.toLocaleString("en-PH")} match{section.total === 1 ? "" : "es"} · showing{" "}
                        {section.results.length}
                      </p>
                      <div className="mt-3">
                        <ResultList results={section.results} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <aside
                aria-label="Search sources"
                className="mt-10 rounded-lg border border-line bg-surface px-4 py-3 text-xs leading-5 text-muted"
              >
                <p>
                  <span className="font-semibold text-ink">Sources:</span> BetterGov.PH Budget API
                  (GAA programs) · Open Congress API (bills, legislators) · Open Data Portal
                  (datasets). Results link to the full record on Civica, which attributes the
                  source endpoint.
                </p>
              </aside>
            </>
          )
        )}

        {/* Explorer shortcuts */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-line bg-surface p-5">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
              <Building2 className="h-4 w-4" aria-hidden="true" /> Budget
            </p>
            <p className="mt-2 text-sm leading-6 text-ink/80">
              Browse departments, agencies, and programs in the enacted budget.
            </p>
            <Link href="/budget" className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline">
              Open budget explorer →
            </Link>
          </div>
          <div className="rounded-lg border border-line bg-surface p-5">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
              <FileText className="h-4 w-4" aria-hidden="true" /> Congress
            </p>
            <p className="mt-2 text-sm leading-6 text-ink/80">
              Browse bills and legislator profiles across congresses.
            </p>
            <Link href="/congress" className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline">
              Open bill explorer →
            </Link>
          </div>
          <div className="rounded-lg border border-line bg-surface p-5">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
              <Database className="h-4 w-4" aria-hidden="true" /> Government Data
            </p>
            <p className="mt-2 text-sm leading-6 text-ink/80">
              Browse datasets, publishers, and downloadable files.
            </p>
            <Link href="/data" className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline">
              Open Government Data explorer →
            </Link>
          </div>
        </div>

      </section>
    </div>
  );
}

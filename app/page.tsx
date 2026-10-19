import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronDown } from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";
import { HeroBackdrop } from "@/components/home/HeroBackdrop";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { BUDGET_API_BASE, BUDGET_DOCS_URL, getNationalTotals } from "@/lib/api/budget";
import { CONGRESS_API_BASE, CONGRESS_DOCS_URL } from "@/lib/api/congress";
import { DATA_API_BASE, DATA_DOCS_URL } from "@/lib/api/datasets";
import { formatRetrievalTime } from "@/lib/freshness";
import { formatPesoCompact } from "@/lib/utils";
import type { SourceRetrieval } from "@/lib/api/source-cache";

interface HomeStat {
  amount: number | null;
  hint: string;
  retrieval?: SourceRetrieval;
}

async function getBudgetStat(): Promise<HomeStat> {
  try {
    const national = await getNationalTotals();
    const row = national.data.find((entry) => entry.year === 2026 && entry.amount > 0);
    if (row) {
      return {
        amount: row.amount,
        hint: "Enacted General Appropriations Act",
        retrieval: national.retrieval,
      };
    }
  } catch {
    // An unavailable source must not turn an illustrative amount into a headline figure.
  }
  return {
    amount: null,
    hint: "Current source figure unavailable",
  };
}

const heroSuggestions = [
  { label: "Flood control", href: "/search?q=flood%20control" },
  { label: "Education", href: "/search?q=education" },
  { label: "Health", href: "/search?q=health" },
];

const collections = [
  {
    title: "Budget",
    description: "Explore allocations by year, department, and program.",
    href: "/budget",
  },
  {
    title: "Congress",
    description: "Find bills, legislative records, and legislators.",
    href: "/congress",
  },
  {
    title: "Government Data",
    description: "Browse datasets from government agencies.",
    href: "/data",
  },
];

const sources = [
  {
    name: "BetterGov.PH Budget",
    scope: "GAA FY2020–2026",
    record: "Department of Budget and Management",
    endpoint: BUDGET_API_BASE,
    docs: BUDGET_DOCS_URL,
  },
  {
    name: "Open Congress",
    scope: "Bills and legislators",
    record: "Congress of the Philippines",
    endpoint: CONGRESS_API_BASE,
    docs: CONGRESS_DOCS_URL,
  },
  {
    name: "Open Data Portal",
    scope: "Dataset catalog",
    record: "Philippine Statistics Authority and agency publishers",
    endpoint: DATA_API_BASE,
    docs: DATA_DOCS_URL,
  },
];

export default async function HomePage() {
  const budgetStat = await getBudgetStat();
  const retrievedAt = budgetStat.retrieval
    ? formatRetrievalTime(budgetStat.retrieval.retrievedAt) : null;

  return (
    <>
      <section aria-labelledby="home-heading" className="relative bg-brand-900 text-white">
        <HeroBackdrop />
        <div className="relative mx-auto w-full max-w-3xl px-4 py-10 text-center sm:px-6 sm:py-12">
          <Reveal delay={0.04}>
            <h1 id="home-heading" className="text-[2rem] font-bold leading-[1.12] tracking-[-0.025em] sm:text-5xl">
              Public records.<br />A clearer picture.
            </h1>
          </Reveal>
          <Reveal as="p" delay={0.1} className="mx-auto mt-4 max-w-xl text-base leading-7 text-brand-100">
            Search Philippine budgets, bills, and government datasets.
          </Reveal>
          <Reveal delay={0.16} className="mx-auto mt-6 max-w-xl text-left">
            <SearchBar size="lg" placeholder="Search records" hideLabel />
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 text-sm text-brand-100">
              <span>Try:</span>
              {heroSuggestions.map((suggestion) => (
                <Link
                  key={suggestion.label}
                  href={suggestion.href}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm underline decoration-white/40 underline-offset-4 transition-colors duration-150 hover:text-white hover:decoration-white focus-visible:outline-white motion-reduce:transition-none"
                >
                  {suggestion.label}
                </Link>
              ))}
            </div>
            <p className="mt-1 text-center text-xs leading-6 text-brand-100">Free to use. No account needed.</p>
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="collections-heading" className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
          <nav aria-labelledby="collections-heading">
            <h2 id="collections-heading" className="text-lg font-semibold text-ink">Browse a collection</h2>
            <RevealGroup as="ul" className="mt-4 grid overflow-hidden rounded-xl border border-line bg-surface/50 sm:grid-cols-3">
              {collections.map((collection, index) => (
                <RevealItem as="li" key={collection.href} delay={index * 0.06} className="border-line [&+li]:border-t sm:[&+li]:border-l sm:[&+li]:border-t-0">
                  <Link
                    href={collection.href}
                    className="group flex h-full min-h-24 items-start gap-4 p-5 transition-colors duration-150 hover:bg-brand-50 focus-visible:bg-brand-50 focus-visible:outline-offset-[-3px] focus-visible:outline-brand-700 motion-reduce:transition-none sm:p-6"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-lg font-semibold text-ink group-hover:text-brand-700">{collection.title}</span>
                      <span className="mt-1 block text-sm leading-6 text-muted">{collection.description}</span>
                    </span>
                    <ArrowRight aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-brand-700 transition-transform duration-200 ease-institutional group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transform-none motion-reduce:transition-none" />
                  </Link>
                </RevealItem>
              ))}
            </RevealGroup>
          </nav>

          <details open className="group mt-10 border-t border-line text-sm text-muted sm:mt-12">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 rounded-sm py-5 text-lg font-semibold text-ink hover:text-brand-700 [&::-webkit-details-marker]:hidden">
              Sources and coverage
              <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" />
            </summary>
            <div className="pb-2">
              <p className="max-w-2xl leading-6">
                Civica is an independent demonstration interface, not an official government website. Individual records include source and retrieval details where available. Verify important figures with the source agencies.
              </p>
              <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-10">
                <div>
                  <section aria-label="Budget snapshot" className="rounded-lg border border-brand-100 bg-brand-50 p-5">
                    <h3 className="font-semibold text-ink">FY2026 enacted budget</h3>
                    <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums text-brand-800">
                      {budgetStat.amount === null ? "Unavailable" : formatPesoCompact(budgetStat.amount)}
                    </p>
                    <p className="mt-3 leading-6">{budgetStat.hint}</p>
                    <p className="mt-4 border-t border-brand-100 pt-3 text-xs leading-5">
                      Source: BetterGov.PH Budget
                      {retrievedAt && budgetStat.retrieval ? (
                        <span className="mt-1 block">Retrieved <time dateTime={budgetStat.retrieval.retrievedAt}>{retrievedAt}</time></span>
                      ) : <span className="mt-1 block">Retrieval time unavailable</span>}
                    </p>
                  </section>
                  <p className="mt-4 text-xs leading-5">
                    Responses are cached and become eligible for refresh after one hour. Failed refreshes may leave older responses visible. Retrieval time is separate from the publisher&apos;s update date.
                  </p>
                </div>
                <ul aria-label="Source directory" className="min-w-0 divide-y divide-line border-y border-line">
                  {sources.map((source) => (
                    <li key={source.name} className="py-5 first:pt-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <h3 className="font-semibold text-ink">{source.name}</h3>
                        <p className="text-xs leading-5">{source.scope}</p>
                      </div>
                      <p className="mt-1 leading-6">Records from {source.record}.</p>
                      <Link href={source.docs} target="_blank" rel="noreferrer" className="mt-1 inline-flex min-h-11 items-center gap-1 rounded-sm font-medium text-brand-700 hover:underline">
                        Source documentation
                        <span className="sr-only"> for {source.name} (opens in new tab)</span>
                        <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                      </Link>
                      <p className="break-all font-mono text-xs leading-5">{source.endpoint}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </details>
        </div>
      </section>
    </>
  );
}

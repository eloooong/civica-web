import Link from "next/link";
import { ArrowRight, ArrowUpRight, Database, PhilippinePeso, ScrollText } from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";
import { DataStatus } from "@/components/ui/DataStatus";
import { ExploreCard } from "@/components/ui/ExploreCard";
import { SectionHeader } from "@/components/ui/PageHeader";
import { HeroBackdrop } from "@/components/home/HeroBackdrop";
import { PLACEHOLDER_BUDGET_TOTAL, popularSearches } from "@/lib/placeholder";
import { formatPesoCompact } from "@/lib/utils";
import { BUDGET_API_BASE, BUDGET_DOCS_URL } from "@/lib/api/budget";
import { CONGRESS_API_BASE, CONGRESS_DOCS_URL } from "@/lib/api/congress";
import { DATA_API_BASE, DATA_DOCS_URL } from "@/lib/api/datasets";

const stats = [
  {
    value: formatPesoCompact(PLACEHOLDER_BUDGET_TOTAL),
    label: "FY2026 national budget",
    hint: "GAA · illustrative",
  },
  { value: "7", label: "Fiscal years", hint: "FY2020–2026 enacted budgets" },
  { value: "3", label: "Collections", hint: "Budget, Congress, open data" },
];

const heroSuggestionLabels = ["DPWH", "Department of Education", "Agriculture"];
const heroSuggestions = heroSuggestionLabels
  .map((label) => popularSearches.find((p) => p.label === label))
  .filter((p): p is NonNullable<typeof p> => p !== undefined);

const groups = [
  {
    heading: "Budget",
    icon: PhilippinePeso,
    items: popularSearches.filter((p) => p.category === "Budget"),
  },
  { heading: "Congress", icon: ScrollText, items: popularSearches.filter((p) => p.category === "Congress") },
  { heading: "Datasets", icon: Database, items: popularSearches.filter((p) => p.category === "Data") },
];

const sources = [
  {
    name: "BetterGov.PH Budget API",
    scope: "GAA FY2020–2026",
    record: "Department of Budget and Management",
    endpoint: BUDGET_API_BASE,
    docs: BUDGET_DOCS_URL,
  },
  {
    name: "Open Congress API",
    scope: "Bills and legislators",
    record: "Congress of the Philippines",
    endpoint: CONGRESS_API_BASE,
    docs: CONGRESS_DOCS_URL,
  },
  {
    name: "Open Data Portal API",
    scope: "Dataset catalog",
    record: "Philippine Statistics Authority and agency publishers",
    endpoint: DATA_API_BASE,
    docs: DATA_DOCS_URL,
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero">
        <HeroBackdrop />
        <div className="relative mx-auto w-full max-w-7xl px-4 pb-14 pt-16 sm:px-6 sm:pb-20 sm:pt-24">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-brand-100">
            <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-amber-300" />
            Civic transparency · Budget · Congress · Open data
          </p>
          <h1 className="mt-6 max-w-5xl text-5xl font-extrabold leading-[1.02] tracking-tight text-white sm:text-7xl">
            Philippine Government Data, Made Easier to Understand.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-brand-100 sm:text-lg sm:leading-8">
            Explore budgets, legislation, and government datasets in one accessible place.
            Free to use, no account needed.
          </p>
          <div className="mt-7 max-w-2xl">
            <SearchBar size="lg" />
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-brand-200">
              <span>Try searching:</span>
              {heroSuggestions.map((s) => (
                <Link
                  key={s.label}
                  href={s.href}
                  className="rounded-full border border-white/25 bg-white/10 px-2.5 py-1 font-medium text-brand-100 transition-colors hover:border-white/50 hover:bg-white/20 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  {s.label}
                </Link>
              ))}
            </div>
            <DataStatus className="mt-3 text-brand-200" />
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section aria-label="Coverage at a glance" className="bg-brand-900">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-6">
            {stats.map((s) => (
              <div key={s.label} className="flex min-w-0 flex-col">
                <dt className="order-2 mt-1 text-[11px] font-semibold uppercase tracking-wider text-brand-200 sm:text-xs">
                  {s.label}
                </dt>
                <dd className="order-1 text-4xl font-extrabold tabular-nums tracking-tight text-white sm:text-5xl">
                  {s.value}
                </dd>
                <dd className="order-3 mt-0.5 text-xs text-brand-200">{s.hint}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div aria-hidden="true" className="relative flex h-1 w-full">
          <span className="w-1/2 bg-brand-600" />
          <span className="w-1/3 bg-accent-600" />
          <span className="w-1/6 bg-amber-300" />
        </div>
      </section>

      {/* Explore */}
      <section aria-label="Explore collections" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <SectionHeader
          large
          title="Explore"
          description="Start from three collections of public data."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <ExploreCard
            icon={PhilippinePeso}
            title="Budget"
            description="Explore public spending and national budget data."
            href="/budget"
            meta="GAA FY2020–2026"
          />
          <ExploreCard
            icon={ScrollText}
            title="Congress"
            description="Explore bills and legislative records."
            href="/congress"
            meta="20th Congress"
          />
          <ExploreCard
            icon={Database}
            title="Government Data"
            description="Discover datasets published by government agencies."
            href="/data"
            meta="Agency datasets"
          />
        </div>
      </section>

      {/* Popular searches */}
      <section aria-label="Popular searches" className="border-t border-line bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
          <SectionHeader
            large
            title="Popular searches"
            description="Examples that run as live queries across all three sources."
            action={
              <Link
                href="/search"
                className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink transition-colors hover:border-brand-200 hover:text-brand-700"
              >
                Open search
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            }
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {groups.map((group) => (
              <div key={group.heading} className="flex h-full flex-col rounded-xl border border-line bg-surface p-5">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  <group.icon className="h-4 w-4 text-brand-700" aria-hidden="true" />
                  {group.heading}
                  <span className="ml-auto rounded-full bg-white px-2 py-0.5 font-bold text-muted ring-1 ring-line">
                    {group.items.length}
                  </span>
                </h3>
                <ul className="mt-3 space-y-1">
                  {group.items.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="block rounded-sm py-1.5 text-sm font-medium text-brand-700 hover:underline"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sources */}
      <section aria-label="Data sources" className="border-t border-line bg-surface">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
          <SectionHeader
            large
            title="Sourced, not scraped"
            description="Every record links back to the public API it came from, with a retrieval timestamp."
          />
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {sources.map((s) => (
              <li key={s.name} className="flex h-full flex-col rounded-xl border border-line bg-white p-5">
                <p className="text-sm font-bold text-ink">{s.name}</p>
                <p className="mt-0.5 text-xs text-muted">{s.scope}</p>
                <p className="mt-1 text-xs font-medium leading-5 text-ink/70">
                  Records originate from {s.record}
                </p>
                <p className="mt-3 break-all rounded-md bg-surface px-2 py-1.5 font-mono text-xs text-muted">{s.endpoint}</p>
                <Link
                  href={s.docs}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex w-fit items-center gap-1 rounded-sm text-sm font-semibold text-brand-700 hover:underline"
                >
                  Read the docs
                  <span className="sr-only"> (opens in new tab)</span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

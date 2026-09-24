import Link from "next/link";
import { ArrowRight, ArrowUpRight, Database, Landmark, ScrollText } from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";
import { ExploreCard } from "@/components/ui/ExploreCard";
import { SectionHeader } from "@/components/ui/PageHeader";
import { HeroBackdrop } from "@/components/home/HeroBackdrop";
import { popularSearches } from "@/lib/placeholder";
import { BUDGET_API_BASE, BUDGET_DOCS_URL } from "@/lib/api/budget";
import { CONGRESS_API_BASE, CONGRESS_DOCS_URL } from "@/lib/api/congress";
import { DATA_API_BASE, DATA_DOCS_URL } from "@/lib/api/datasets";

const stats = [
  { value: "3", label: "Collections", hint: "Budget, Congress, open data" },
  { value: "7", label: "Fiscal years", hint: "FY2020–2026 enacted budgets" },
  { value: "1", label: "Unified search", hint: "One query across all three" },
];

const groups = [
  { heading: "Budget", icon: Landmark, items: popularSearches.filter((p) => p.category === "Budget") },
  { heading: "Congress", icon: ScrollText, items: popularSearches.filter((p) => p.category === "Congress") },
  { heading: "Datasets", icon: Database, items: popularSearches.filter((p) => p.category === "Data") },
];

const sources = [
  {
    name: "BetterGov.PH Budget API",
    scope: "GAA FY2020–2026",
    endpoint: BUDGET_API_BASE,
    docs: BUDGET_DOCS_URL,
  },
  {
    name: "Open Congress API",
    scope: "Bills and legislators",
    endpoint: CONGRESS_API_BASE,
    docs: CONGRESS_DOCS_URL,
  },
  {
    name: "Open Data Portal API",
    scope: "Dataset catalog",
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
            <SearchBar size="lg" placeholder="Search government data…" />
            <div className="mt-2 flex flex-col gap-1 text-xs text-brand-200 sm:flex-row sm:items-center sm:justify-between">
              <p>Try searching: “DPWH”, “education”, or “agriculture”.</p>
              <p className="text-[11px] font-semibold uppercase tracking-widest">
                Live search arrives in Phase 5
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section aria-label="Coverage at a glance" className="bg-brand-900">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <dl className="grid grid-cols-3 gap-4 sm:gap-6">
            {stats.map((s) => (
              <div key={s.label} className="flex min-w-0 flex-col">
                <dt className="order-2 mt-1 text-[11px] font-semibold uppercase tracking-wider text-brand-200 sm:text-xs">
                  {s.label}
                </dt>
                <dd className="order-1 text-4xl font-extrabold tabular-nums tracking-tight text-white sm:text-5xl">
                  {s.value}
                </dd>
                <dd className="order-3 mt-0.5 hidden text-xs text-brand-200 sm:block">{s.hint}</dd>
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
            icon={Landmark}
            title="Budget"
            description="Explore public spending and national budget data."
            href="/budget"
            meta="FY 2026 · Illustrative"
          />
          <ExploreCard
            icon={ScrollText}
            title="Congress"
            description="Explore bills and legislative records."
            href="/congress"
            meta="20th Congress · Illustrative"
          />
          <ExploreCard
            icon={Database}
            title="Government Data"
            description="Discover datasets published by government agencies."
            href="/data"
            meta="Catalog preview · Illustrative"
          />
        </div>
      </section>

      {/* Popular searches */}
      <section aria-label="Popular searches" className="border-t border-line bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
          <SectionHeader
            large
            title="Popular searches"
            description="Realistic examples that run as live queries once the APIs connect."
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
                <p className="mt-3 break-all rounded-md bg-surface px-2 py-1.5 font-mono text-xs text-muted">{s.endpoint}</p>
                <Link
                  href={s.docs}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex w-fit items-center gap-1 rounded-sm text-sm font-semibold text-brand-700 hover:underline"
                >
                  Read the docs
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-xs leading-5 text-brand-900">
            Note: all figures and records here are illustrative placeholders for the
            Phase 1 interface. Every record names its source starting in Phase 2.
          </p>
        </div>
      </section>
    </>
  );
}

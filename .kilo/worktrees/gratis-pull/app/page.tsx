import Link from "next/link";
import { ArrowRight, Database, Landmark, ScrollText } from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";
import { ExploreCard } from "@/components/ui/ExploreCard";
import { SectionHeader } from "@/components/ui/PageHeader";
import { popularSearches } from "@/lib/placeholder";

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-line bg-surface">
        <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-12 sm:px-6 sm:pb-16 sm:pt-16">
          <p className="inline-flex items-center rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-muted">
            <span aria-hidden="true" className="mr-1.5 inline-block h-2 w-2 rounded-full bg-brand-700" />
            Civic transparency · Budget · Congress · Open data
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl">
            Philippine Government Data,
            <br />
            Made Easier to Understand.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
            Explore budgets, legislation, and government datasets — in one
            accessible place built for the public.
          </p>
          <div className="mt-6 max-w-2xl">
            <SearchBar size="lg" placeholder="Search government data…" />
            <p className="mt-2 text-xs text-muted">
              Try “DPWH”, “education”, or “agriculture”. Live search arrives in Phase 5.
            </p>
          </div>
        </div>
      </section>

      {/* Explore */}
      <section aria-labelledby="explore-heading" className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <SectionHeader
          title="Explore"
          description="Three collections. One starting point for understanding public data."
        />
        <h2 id="explore-heading" className="sr-only">
          Explore collections
        </h2>
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
      <section aria-labelledby="popular-heading" className="border-t border-line bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <SectionHeader
            title="Popular searches"
            description="Realistic examples. These become live queries once APIs are connected."
            action={
              <Link
                href="/search"
                className="inline-flex items-center gap-1 rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink hover:bg-slate-50"
              >
                Open search
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            }
          />
          <h2 id="popular-heading" className="sr-only">
            Popular searches
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {[
              { heading: "Budget", items: popularSearches.filter((p) => p.category === "Budget") },
              { heading: "Congress", items: popularSearches.filter((p) => p.category === "Congress") },
              { heading: "Datasets", items: popularSearches.filter((p) => p.category === "Data") },
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
                        className="rounded-sm text-sm font-medium text-brand-700 hover:underline"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-6 rounded-md border border-line bg-surface px-4 py-3 text-xs leading-5 text-muted">
            Note: all figures and records on this page are illustrative placeholders for the
            Phase 1 interface. Sources (BetterGov Budget API, Open Congress API, Open Data
            Portal API) will be attributed on every record starting in Phase 2.
          </p>
        </div>
      </section>
    </>
  );
}

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Database, PhilippinePeso, ScrollText } from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";
import { DataStatus } from "@/components/ui/DataStatus";
import { ExploreCard } from "@/components/ui/ExploreCard";
import { SectionHeader } from "@/components/ui/PageHeader";
import { HeroBackdrop } from "@/components/home/HeroBackdrop";
import { CountUp, type CountFormat } from "@/components/motion/count-up";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { PLACEHOLDER_BUDGET_TOTAL, popularSearches } from "@/lib/placeholder";
import { BUDGET_API_BASE, BUDGET_DOCS_URL, getNationalTotals } from "@/lib/api/budget";
import { CONGRESS_API_BASE, CONGRESS_DOCS_URL } from "@/lib/api/congress";
import { DATA_API_BASE, DATA_DOCS_URL } from "@/lib/api/datasets";

interface HomeStat {
  amount: number;
  format: CountFormat;
  label: string;
  hint: string;
}

async function getBudgetStat(): Promise<HomeStat> {
  try {
    const national = await getNationalTotals();
    const row = national.data.find((entry) => entry.year === 2026 && entry.amount > 0);
    if (row) {
      return {
        amount: row.amount,
        format: "peso-compact",
        label: "FY2026 national budget",
        hint: "General Appropriations Act · live",
      };
    }
  } catch {
    // Upstream unreachable; fall through to the labeled illustrative figure.
  }
  return {
    amount: PLACEHOLDER_BUDGET_TOTAL,
    format: "peso-compact",
    label: "FY2026 national budget",
    hint: "General Appropriations Act · illustrative",
  };
}

const heroSuggestions = [
  { label: "Flood control", href: "/search?q=flood%20control" },
  { label: "Public schools", href: "/search?q=public%20schools" },
  { label: "Scholarship programs", href: "/search?q=scholarship%20programs" },
];

const groups = [
  {
    heading: "Budget",
    icon: PhilippinePeso,
    items: popularSearches.filter((p) => p.category === "Budget"),
  },
  { heading: "Congress", icon: ScrollText, items: popularSearches.filter((p) => p.category === "Congress") },
  { heading: "Government Data", icon: Database, items: popularSearches.filter((p) => p.category === "Data") },
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

export default async function HomePage() {
  const budgetStat = await getBudgetStat();
  const stats: HomeStat[] = [
    budgetStat,
    { amount: 7, format: "count", label: "Fiscal years", hint: "FY2020–2026 enacted budgets" },
    { amount: 3, format: "count", label: "Collections", hint: "Budget, Congress, Government Data" },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero">
        <HeroBackdrop />
        <div className="relative mx-auto w-full max-w-7xl px-4 pb-20 pt-14 sm:px-6 sm:pb-28 sm:pt-24">
          <Reveal delay={0.05}>
            <h1 className="max-w-5xl text-[2.125rem] font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl sm:leading-[1.04] lg:text-7xl">
              Philippine Government Data, Made Easier to Understand.
            </h1>
          </Reveal>
          <Reveal delay={0.17}>
            <p className="mt-4 max-w-2xl text-base leading-7 text-brand-100 sm:text-lg sm:leading-8">
              Explore budgets, legislation, and government datasets in one accessible place built
              for the public. Free to use, no account needed.
            </p>
          </Reveal>
          <Reveal delay={0.23}>
            <div className="mt-7 max-w-2xl">
              <SearchBar size="lg" />
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-brand-100">
                <span>Try searching:</span>
                {heroSuggestions.map((s) => (
                  <Link
                    key={s.label}
                    href={s.href}
                    className="inline-flex min-h-11 items-center rounded-full border border-white/25 bg-white/10 px-3 font-medium text-brand-100 transition-colors duration-200 ease-institutional hover:border-white/50 hover:bg-white/20 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    {s.label}
                  </Link>
                ))}
              </div>
              <DataStatus className="mt-3 text-brand-100" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Stats band */}
      <section aria-label="Coverage at a glance" className="bg-brand-900">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <RevealGroup as="dl" className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-6">
            {stats.map((s, i) => (
              <RevealItem key={s.label} index={i} className="flex min-w-0 flex-col">
                <dt className="order-2 mt-1 text-[11px] font-semibold uppercase tracking-wider text-brand-200 sm:text-xs">
                  {s.label}
                </dt>
                <dd className="order-1 text-4xl font-extrabold tabular-nums tracking-tight text-white sm:text-5xl">
                  <CountUp value={s.amount} format={s.format} />
                </dd>
                <dd className="order-3 mt-0.5 text-xs text-brand-200">{s.hint}</dd>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
        <div aria-hidden="true" className="relative flex h-1 w-full overflow-hidden">
          <span className="w-1/2 bg-brand-600" />
          <span className="w-1/3 bg-accent-600" />
          <span className="w-1/6 bg-amber-300" />
          <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-linear-to-r from-transparent via-white/60 to-transparent animate-rule-sweep" />
        </div>
      </section>

      {/* Explore */}
      <section aria-label="Explore collections" className="border-b border-line bg-surface">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
          <Reveal>
            <div aria-hidden="true" className="flex h-1 w-24 overflow-hidden">
              <span className="w-1/2 bg-brand-600" />
              <span className="w-1/3 bg-accent-600" />
              <span className="w-1/6 bg-amber-300" />
            </div>
          </Reveal>
          <Reveal delay={0.06} className="mt-4">
            <SectionHeader
              large
              eyebrow="Start here"
              title="Explore"
              description="Three collections of public records, each one traceable to the API it came from."
            />
          </Reveal>
          <RevealGroup className="mt-7 grid gap-4 md:grid-cols-3">
            <RevealItem index={0}>
              <ExploreCard
                icon={PhilippinePeso}
                title="Budget"
                description="Explore public spending and national budget data."
                href="/budget"
                meta="GAA FY2020–2026"
              />
            </RevealItem>
            <RevealItem index={1}>
              <ExploreCard
                icon={ScrollText}
                title="Congress"
                description="Explore bills and legislative records."
                href="/congress"
                meta="20th Congress"
              />
            </RevealItem>
            <RevealItem index={2}>
              <ExploreCard
                icon={Database}
                title="Government Data"
                description="Discover datasets published by government agencies."
                href="/data"
                meta="Agency datasets"
              />
            </RevealItem>
          </RevealGroup>
        </div>
      </section>

      {/* Popular searches */}
      <section aria-label="Popular searches" className="border-b border-line bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
          <Reveal>
            <SectionHeader
              title="Popular searches"
              description="Examples that run as live queries across all three sources."
              action={
                <Link
                  href="/search"
                  className="inline-flex min-h-11 items-center gap-1 rounded-md border border-line px-3.5 text-sm font-semibold text-ink transition-colors duration-200 ease-institutional hover:border-brand-200 hover:text-brand-700"
                >
                  Open search
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              }
            />
          </Reveal>
          <RevealGroup className="mt-6 grid gap-4 md:grid-cols-3">
            {groups.map((group, i) => (
              <RevealItem
                key={group.heading}
                index={i}
                className="rounded-lg border border-line bg-surface p-5"
              >
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  <group.icon className="h-4 w-4 shrink-0 text-brand-700" aria-hidden="true" />
                  <span className="min-w-0 flex-1">{group.heading}</span>
                  <span className="rounded-full bg-white px-2 py-0.5 font-bold text-muted tabular-nums ring-1 ring-line">
                    {group.items.length}
                  </span>
                </h3>
                <ul className="mt-2">
                  {group.items.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="flex min-h-11 items-center rounded-sm text-sm font-medium text-brand-700 transition-colors duration-150 ease-institutional hover:text-brand-800"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Sources */}
      <section aria-label="Data sources" className="bg-surface">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
          <Reveal>
            <SectionHeader
              title="Sourced, not scraped"
              description="Every record links back to the public API it came from, with a retrieval timestamp."
            />
          </Reveal>
          <RevealGroup as="ul" className="mt-6 grid gap-4 md:grid-cols-3">
            {sources.map((s, i) => (
              <RevealItem
                as="li"
                key={s.name}
                index={i}
                className="flex flex-col rounded-lg border border-line bg-white p-5"
              >
                <p className="text-sm font-bold text-ink">{s.name}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
                  {s.scope}
                </p>
                <p className="mt-2 text-xs leading-5 text-muted">
                  Records originate from {s.record}.
                </p>
                <p className="mt-3 break-all rounded-md bg-surface px-2.5 py-2 font-mono text-[11px] leading-4 text-muted">
                  {s.endpoint}
                </p>
                <Link
                  href={s.docs}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-auto inline-flex min-h-11 w-fit items-center gap-1 rounded-sm pt-3 text-sm font-semibold text-brand-700 transition-colors duration-150 ease-institutional hover:text-brand-800"
                >
                  Read the docs
                  <span className="sr-only"> for {s.name} (opens in new tab)</span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>
          <Reveal delay={0.1} className="mt-6 max-w-3xl">
            <p className="rounded-lg border border-line bg-white px-4 py-3 text-xs leading-5 text-muted">
              Civica is an independent demonstration interface, not an official government
              website. Figures are fetched from the public APIs above and cached for up to one
              hour. When a source is unreachable, a clearly labeled illustrative figure is shown
              instead. Verify important numbers with the source agencies.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}

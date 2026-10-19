import Link from "next/link";
import type { Metadata } from "next";
import { Building2, Database, HardDrive, Tags } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader, SectionHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { OverviewDisclosure } from "@/components/ui/OverviewDisclosure";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Pagination } from "@/components/ui/Pagination";
import { DatasetCard } from "@/components/data/DatasetCard";
import { SourceAttribution } from "@/components/ui/SourceAttribution";
import {
  DATA_API_BASE,
  DATA_DOCS_URL,
  DATA_SOURCE_NAME,
  DataApiError,
  getDataStats,
  listCategories,
  listDatasets,
  listPublishers,
} from "@/lib/api/datasets";
import { formatBytes } from "@/lib/datasets";
import type { DatasetSort, SortDir } from "@/types/dataset";

export const metadata: Metadata = {
  title: "Government Data",
  description:
    "Discover datasets published by Philippine government agencies, powered by the Open Data Portal.",
};

const DATASETS_PER_PAGE = 12;
const SORTS: { value: string; label: string }[] = [
  { value: "latest_version_date:desc", label: "Recently updated" },
  { value: "name:asc", label: "Name (A–Z)" },
  { value: "size_bytes:desc", label: "Largest first" },
];

type DataSearchParams = {
  q?: string;
  category?: string;
  publisher?: string;
  sort?: string;
  page?: string;
};

function parseSort(raw: string | undefined): { sort: DatasetSort; dir: SortDir } {
  const [sort, dir] = (raw ?? "").split(":");
  if (sort === "name") return { sort: "name", dir: dir === "desc" ? "desc" : "asc" };
  if (sort === "size_bytes") return { sort: "size_bytes", dir: dir === "asc" ? "asc" : "desc" };
  return { sort: "latest_version_date", dir: "desc" };
}

function pageHref(base: Omit<DataSearchParams, "page">, page: number): string {
  const qs = new URLSearchParams();
  if (base.q) qs.set("q", base.q);
  if (base.category) qs.set("category", base.category);
  if (base.publisher) qs.set("publisher", base.publisher);
  if (base.sort) qs.set("sort", base.sort);
  if (page > 1) qs.set("page", String(page));
  const s = qs.toString();
  return s ? `/data?${s}` : "/data";
}

export default async function DataPage({ searchParams }: { searchParams: Promise<DataSearchParams> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const categoryRaw = Number.parseInt(sp.category ?? "", 10);
  const publisherRaw = Number.parseInt(sp.publisher ?? "", 10);
  const categoryId = Number.isInteger(categoryRaw) && categoryRaw > 0 ? categoryRaw : undefined;
  const publisherId = Number.isInteger(publisherRaw) && publisherRaw > 0 ? publisherRaw : undefined;
  const { sort, dir } = parseSort(sp.sort);
  const parsedPage = Number.parseInt(sp.page ?? "", 10);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const offset = (page - 1) * DATASETS_PER_PAGE;

  let stats;
  let categories;
  let publishers;
  let result;
  let allDatasets;
  try {
    [stats, categories, publishers, result, allDatasets] = await Promise.all([
      getDataStats(),
      listCategories(),
      listPublishers(),
      listDatasets({ search: q || undefined, categoryId, publisherId, sort, dir, limit: DATASETS_PER_PAGE, offset }),
      // One full fetch (cached) for honest per-category counts — the
      // /categories counts are stale (all zero) in the source API.
      listDatasets({ limit: 100 }),
    ]);
  } catch (err) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Government Data" }]} />
        <div className="mt-4">
          <PageHeader
            eyebrow="Data explorer"
            title="Government Data"
            description="Discover datasets published by Philippine government agencies."
          />
        </div>
        <div className="mt-6">
          <ErrorState
            title="Unable to load the data catalog"
            description={
              err instanceof DataApiError
                ? `${err.message} (Source: Open Data Portal.)`
                : "The government datasets source may be temporarily unavailable. Please try again."
            }
            retryHref="/data"
          />
        </div>
      </div>
    );
  }

  const datasets = result.data;
  const total = result.pagination?.total ?? datasets.length;
  const counts = new Map<number, number>();
  for (const d of allDatasets.data) {
    if (d.category_id !== null) counts.set(d.category_id, (counts.get(d.category_id) ?? 0) + 1);
  }
  const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));
  const sortedPublishers = [...publishers].sort((a, b) => a.name.localeCompare(b.name));
  const baseParams = {
    q: q || undefined,
    category: sp.category || undefined,
    publisher: sp.publisher || undefined,
    sort: sp.sort || undefined,
  };
  const hasFilters = !!(q || categoryId || publisherId);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Government Data" }]} />
      <div className="mt-4">
          <PageHeader
            eyebrow="Data explorer · Source records"
            title="Government Data"
            description="Discover datasets published by Philippine government agencies: budgets, elections, procurement, and more."
          />
      </div>

      <OverviewDisclosure title="Catalog overview and topics">
        {/* Catalog stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard icon={Database} label="Datasets" value={stats.total_datasets.toLocaleString("en-PH")} valueNumber={stats.total_datasets} hint="In the catalog" />
          <StatCard icon={HardDrive} label="Files" value={stats.total_resources.toLocaleString("en-PH")} valueNumber={stats.total_resources} hint={`${formatBytes(stats.total_size_bytes)} total`} />
          <StatCard icon={Building2} label="Publishers" value={stats.total_publishers.toLocaleString("en-PH")} valueNumber={stats.total_publishers} hint="Agencies + contributors" />
          <StatCard icon={Tags} label="Categories" value={stats.total_categories.toLocaleString("en-PH")} valueNumber={stats.total_categories} hint="Browse by topic below" />
        </div>

        {/* Categories */}
        <section aria-labelledby="cats-heading" className="mt-10">
          <SectionHeader title="Categories" description="Browse the catalog by topic." />
          <h2 id="cats-heading" className="sr-only">
            Dataset categories
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {sortedCategories.map((c) => {
              const count = counts.get(c.id) ?? 0;
              const active = categoryId === c.id;
              return (
                <li key={c.id}>
                  <Link
                    href={active ? "/data" : `/data?category=${c.id}`}
                    aria-current={active ? "true" : undefined}
                    aria-label={`${c.name}, ${count} datasets${active ? " (active filter, select to clear)" : ""}`}
                    className={
                      active
                        ? "block rounded-lg border border-brand-700 bg-brand-50 px-4 py-3.5"
                        : "block rounded-lg border border-line bg-white px-4 py-3.5 transition-colors duration-200 ease-institutional hover:border-brand-200 hover:bg-brand-50/40"
                    }
                  >
                    <span className="block text-sm font-semibold text-ink">{c.name}</span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {count} dataset{count === 1 ? "" : "s"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </OverviewDisclosure>

      {/* Search + filters */}
      <section aria-labelledby="datasets-heading" className="mt-6">
        <SectionHeader
          title="Browse datasets"
          description="Find a dataset by keyword, category, or publisher."
        />
        <h2 id="datasets-heading" className="sr-only">
          Browse datasets
        </h2>
        <form
          key={JSON.stringify(baseParams)}
          method="get"
          role="search"
          aria-label="Filter datasets"
          className="mt-4 grid gap-3 rounded-lg border border-line bg-white p-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto]"
        >
          <div className="min-w-0 sm:col-span-2 xl:col-span-1">
            <label htmlFor="ds-q" className="block text-xs font-semibold text-muted">
              Search datasets
            </label>
            <input
              id="ds-q"
              name="q"
              type="search"
              autoComplete="off"
              defaultValue={q}
              placeholder="e.g. elections, procurement, flood…"
              className="mt-1 min-h-11 w-full min-w-0 rounded-md border border-line bg-white px-3 py-2 text-base text-ink placeholder:text-muted focus:border-brand-600"
            />
          </div>
          <div className="min-w-0">
            <label htmlFor="ds-category" className="block text-xs font-semibold text-muted">
              Category
            </label>
            <select
              id="ds-category"
              name="category"
              defaultValue={categoryId !== undefined ? String(categoryId) : ""}
              className="mt-1 min-h-11 w-full min-w-0 rounded-md border border-line bg-white px-3 py-2 text-base text-ink"
            >
              <option value="">All categories</option>
              {sortedCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0">
            <label htmlFor="ds-publisher" className="block text-xs font-semibold text-muted">
              Publisher
            </label>
            <select
              id="ds-publisher"
              name="publisher"
              defaultValue={publisherId !== undefined ? String(publisherId) : ""}
              className="mt-1 min-h-11 w-full min-w-0 rounded-md border border-line bg-white px-3 py-2 text-base text-ink"
            >
              <option value="">All publishers</option>
              {sortedPublishers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0">
            <label htmlFor="ds-sort" className="block text-xs font-semibold text-muted">
              Sort by
            </label>
            <select
              id="ds-sort"
              name="sort"
              defaultValue={sp.sort ?? "latest_version_date:desc"}
              className="mt-1 min-h-11 w-full min-w-0 rounded-md border border-line bg-white px-3 py-2 text-base text-ink"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <button
              type="submit"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 sm:flex-none"
            >
              Apply
            </button>
            {hasFilters && (
              <Link
                href="/data"
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-slate-50 sm:flex-none"
              >
                Clear
              </Link>
            )}
          </div>
        </form>
        {hasFilters && (
          <p className="mt-3 text-xs text-muted">
            Filters active.{" "}
            <Link href="/data" className="font-semibold text-brand-700 hover:underline">
              Clear all filters
            </Link>
          </p>
        )}

        {datasets.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No datasets match your filters"
              description="Try a different keyword, category, or publisher."
              action={
                <Link
                  href="/data"
                  className="inline-block rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
                >
                  Clear filters
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <ul className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {datasets.map((d) => (
                <li key={d.id}>
                  <DatasetCard dataset={d} />
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Pagination page={page} total={total} limit={DATASETS_PER_PAGE} hrefFor={(p) => pageHref(baseParams, p)} />
            </div>
          </>
        )}
      </section>

      <div className="mt-8">
        <SourceAttribution
          retrievals={[result.retrieval]}
          source={DATA_SOURCE_NAME}
          docsUrl={DATA_DOCS_URL}
          endpoint={`${DATA_API_BASE}/datasets`}
          dataset="Community-run catalog of publicly available Philippine datasets"
        />
      </div>
    </div>
  );
}

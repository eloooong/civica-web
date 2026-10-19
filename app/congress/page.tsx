import Link from "next/link";
import type { Metadata } from "next";
import { FileText, Landmark, ScrollText, Users } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader, SectionHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { BillCard } from "@/components/congress/BillCard";
import { Pagination } from "@/components/congress/Pagination";
import { SourceAttribution } from "@/components/ui/SourceAttribution";
import {
  CONGRESS_API_BASE,
  CONGRESS_DOCS_URL,
  CONGRESS_SOURCE_NAME,
  CongressApiError,
  getCongressStats,
  listDocuments,
  searchDocuments,
  searchPeople,
} from "@/lib/api/congress";
import { congressOrdinal, personFullName } from "@/lib/congress";

export const metadata: Metadata = {
  title: "Congress Explorer",
  description:
    "Search Philippine House and Senate bills and find legislators, with records from Open Congress.",
};

const BILLS_PER_PAGE = 12;

type CongressSearchParams = {
  q?: string;
  congress?: string;
  type?: string;
  page?: string;
  person?: string;
};

function billsHref(base: Omit<CongressSearchParams, "page" | "person">, page: number): string {
  const qs = new URLSearchParams();
  if (base.q) qs.set("q", base.q);
  if (base.congress) qs.set("congress", base.congress);
  if (base.type) qs.set("type", base.type);
  if (page > 1) qs.set("page", String(page));
  const s = qs.toString();
  return s ? `/congress?${s}` : "/congress";
}

export default async function CongressPage({
  searchParams,
}: {
  searchParams: Promise<CongressSearchParams>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const personQuery = (sp.person ?? "").trim();
  const congressNum = Number.parseInt(sp.congress ?? "", 10);
  const requestedCongress = Number.isInteger(congressNum) && congressNum >= 1 && congressNum <= 99 ? congressNum : undefined;
  const type = sp.type === "HB" || sp.type === "SB" ? sp.type : undefined;
  const parsedPage = Number.parseInt(sp.page ?? "", 10);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const offset = (page - 1) * BILLS_PER_PAGE;

  let stats;
  let bills;
  let congress: number | undefined;
  let latestCongress: number | undefined;
  let people: Awaited<ReturnType<typeof searchPeople>> | null = null;
  try {
    stats = await getCongressStats();
    latestCongress = [...stats.bills_by_congress].sort((a, b) => b.congress - a.congress)[0]?.congress;
    // Direct topic searches retain their all-congress scope. New browsing
    // visits start with the latest session published in the catalog.
    congress = requestedCongress ?? (sp.congress === "all" || sp.congress === "" || q ? undefined : latestCongress);
    const billsPromise = q
      ? searchDocuments({ q, congress, subtype: type, limit: BILLS_PER_PAGE, offset })
      : listDocuments({ congress, type, limit: BILLS_PER_PAGE, offset });
    const [b, p] = await Promise.all([
      billsPromise,
      personQuery ? searchPeople(personQuery, { limit: 8 }) : Promise.resolve(null),
    ]);
    bills = b;
    people = p;
  } catch (err) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Congress" }]} />
        <div className="mt-4">
          <PageHeader
            eyebrow="Congress explorer"
            title="Congress"
            description="Search bills, legislators, and legislative records."
          />
        </div>
        <div className="mt-6">
          <ErrorState
            title="Unable to load congressional data"
            description={
              err instanceof CongressApiError
                ? `${err.message} (Source: Open Congress records.)`
                : "The congressional records source may be temporarily unavailable. Please try again."
            }
            retryHref="/congress"
          />
        </div>
      </div>
    );
  }

  const total = bills.pagination?.total ?? bills.data.length;
  const congressOptions = [...stats.bills_by_congress].sort((a, b) => b.congress - a.congress);
  const baseParams = { q: q || undefined, congress: congress !== undefined ? String(congress) : "all", type: type || undefined };
  const hasFilters = !!(q || type || congress !== latestCongress);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Congress" }]} />
      <div className="mt-4">
        <PageHeader
          eyebrow="Congress explorer · Source records"
          title="Congress"
          description="Search House and Senate bills across congressional sessions, and find the legislators behind them."
        />
      </div>

      {/* Database stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={ScrollText} label="Bills indexed" value={stats.total_bills.toLocaleString("en-PH")} valueNumber={stats.total_bills} hint="House + Senate, all congresses" />
        <StatCard icon={FileText} label="House bills" value={stats.total_house_bills.toLocaleString("en-PH")} valueNumber={stats.total_house_bills} hint={`${stats.total_senate_bills.toLocaleString("en-PH")} Senate bills`} />
        <StatCard icon={Users} label="Legislators" value={stats.total_people.toLocaleString("en-PH")} valueNumber={stats.total_people} hint="Senators + Representatives" />
        <StatCard icon={Landmark} label="Congresses" value={String(stats.total_congresses)} valueNumber={stats.total_congresses} hint="8th Congress to present" />
      </div>

      {/* Bill search + filters (shareable GET form) */}
      <section aria-labelledby="bills-heading" className="mt-10">
        <SectionHeader
          title="Browse bills"
          description="New visits start with the latest Congress in this catalog. Choose All congresses to include earlier sessions, or search by topic."
        />
        <h2 id="bills-heading" className="sr-only">
          Browse bills
        </h2>
        <form
          key={JSON.stringify(baseParams)}
          method="get"
          role="search"
          aria-label="Filter bills"
          className="mt-4 grid gap-3 rounded-lg border border-line bg-white p-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_240px_180px_auto]"
        >
          <div className="min-w-0 sm:col-span-2 xl:col-span-1">
            <label htmlFor="bill-q" className="block text-xs font-semibold text-muted">
              Search bills
            </label>
            <input
              id="bill-q"
              name="q"
              type="search"
              autoComplete="off"
              defaultValue={q}
              placeholder="e.g. education, flood control, 4Ps…"
              className="mt-1 min-h-11 w-full min-w-0 rounded-md border border-line bg-white px-3 py-2 text-base text-ink placeholder:text-muted focus:border-brand-600"
            />
          </div>
          <div className="min-w-0">
            <label htmlFor="bill-congress" className="block text-xs font-semibold text-muted">
              Congress
            </label>
            <select
              id="bill-congress"
              name="congress"
              defaultValue={congress !== undefined ? String(congress) : "all"}
              className="mt-1 min-h-11 w-full min-w-0 rounded-md border border-line bg-white px-3 py-2 text-base text-ink"
            >
              <option value="all">All congresses</option>
              {congressOptions.map((c) => (
                <option key={c.congress} value={c.congress}>
                  {congressOrdinal(c.congress)} ({c.total.toLocaleString("en-PH")})
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0">
            <label htmlFor="bill-type" className="block text-xs font-semibold text-muted">
              Chamber
            </label>
            <select
              id="bill-type"
              name="type"
              defaultValue={sp.type ?? ""}
              className="mt-1 min-h-11 w-full min-w-0 rounded-md border border-line bg-white px-3 py-2 text-base text-ink"
            >
              <option value="">House + Senate</option>
              <option value="HB">House bills</option>
              <option value="SB">Senate bills</option>
            </select>
          </div>
          <div className="flex flex-wrap items-end gap-2 sm:col-span-2 xl:col-span-1">
            <button
              type="submit"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 sm:flex-none"
            >
              Search
            </button>
            {hasFilters && (
              <Link
                href="/congress"
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-slate-50 sm:flex-none"
              >
                Reset filters
              </Link>
            )}
          </div>
        </form>

        {bills.data.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No bills match your filters"
              description="Try a different keyword, congress, or chamber. Search matches bill titles and descriptions."
              action={
                <Link
                  href="/congress"
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
              {bills.data.map((bill) => (
                <li key={bill.id}>
                  <BillCard bill={bill} />
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Pagination page={page} total={total} limit={BILLS_PER_PAGE} hrefFor={(p) => billsHref(baseParams, p)} />
            </div>
          </>
        )}
      </section>

      {/* Legislator finder */}
      <section aria-labelledby="people-heading" className="mt-10">
        <SectionHeader
          title="Find a legislator"
          description="Search senators and representatives by name to open their profile and authored bills."
        />
        <h2 id="people-heading" className="sr-only">
          Find a legislator
        </h2>
        <form
          method="get"
          role="search"
          aria-label="Find a legislator"
          className="mt-4 flex flex-col gap-3 rounded-lg border border-line bg-white p-4 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label htmlFor="person-q" className="block text-xs font-semibold text-muted">
              Legislator name
            </label>
            <input
              id="person-q"
              name="person"
              type="search"
              autoComplete="off"
              defaultValue={personQuery}
              placeholder="e.g. Dela Cruz, Santos…"
              className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand-600"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 sm:w-auto"
          >
            Find
          </button>
        </form>

        {personQuery && (
          <div className="mt-4">
            {people && people.data.length > 0 ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {people.data.map((person) => (
                  <li key={person.id} className="rounded-lg border border-line bg-white px-4 py-3.5">
                    <Link
                      href={`/congress/people/${person.id}`}
                      className="rounded-sm text-[15px] font-bold text-ink hover:text-brand-700 hover:underline"
                    >
                      {personFullName(person)}
                    </Link>
                    <span className="mt-0.5 block text-xs text-muted">
                      {people.pagination
                        ? `${people.pagination.total.toLocaleString("en-PH")} matching legislator${people.pagination.total === 1 ? "" : "s"} (showing ${people.data.length})`
                        : "Legislator profile →"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="No legislators found"
                description={`Nothing matches “${personQuery}”. Check the spelling or try a last name only.`}
              />
            )}
          </div>
        )}
      </section>

      <div className="mt-8">
        <SourceAttribution
          retrievals={[bills.retrieval]}
          source={CONGRESS_SOURCE_NAME}
          docsUrl={CONGRESS_DOCS_URL}
          endpoint={`${CONGRESS_API_BASE}/documents`}
          dataset="Philippine legislative documents (manually encoded; inaccuracies possible. Verify before citing)"
        />
      </div>
    </div>
  );
}

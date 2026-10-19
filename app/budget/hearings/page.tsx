import type { Metadata } from "next";
import Link from "next/link";
import { Gavel, ScrollText } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader, SectionHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Pagination } from "@/components/ui/Pagination";
import { SourceAttribution } from "@/components/budget/SourceAttribution";
import { BUDGET_API_BASE, BudgetApiError, listHearings } from "@/lib/api/budget";
import type { HearingListRow } from "@/types/budget";
import { formatCount } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Budget Hearings",
  description:
    "House Committee on Appropriations budget hearings for the FY2027 proposed budget: what was asked, what was said, and what each agency committed to, timestamped into the hearing video.",
};

const PAGE_SIZE = 12;

const DATASET_LABEL = "House Committee on Appropriations budget hearings, FY2027";

/**
 * Upstream titles all lead with the committee name, and the briefing form also
 * repeats the agency in trailing parentheses, both of which the agency column
 * already carries. The full string stays in the title attribute and on the
 * hearing page.
 */
function shortHearingTitle(title: string): string {
  return title
    .replace(/^COMMITTEE ON APPROPRIATIONS\s*(BUDGET)?\s*[-–—:]?\s*/i, "")
    .replace(/\s*\([^)]*\)\s*$/, "")
    .trim();
}

function formatHearingDate(iso: string | null | undefined): string {
  if (!iso) return "Date unavailable";
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** `length_text` is populated on one row only, so duration is derived instead. */
function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "–";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

export default async function HearingsPage({
  searchParams,
}: {
  searchParams: Promise<{ agency?: string; q?: string; record?: string; page?: string }>;
}) {
  const params = await searchParams;
  const agencyParam = params.agency ?? "";
  const query = (params.q ?? "").trim();
  const recordOnly = params.record === "with";

  let hearings: HearingListRow[];
  let hearingResponse: Awaited<ReturnType<typeof listHearings>>;
  try {
    hearingResponse = await listHearings();
    hearings = hearingResponse.data;
  } catch (err) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Budget", href: "/budget" },
            { label: "Hearings" },
          ]}
        />
        <div className="mt-4">
          <PageHeader
            eyebrow="Budget hearings"
            title="House budget hearings"
            description="What the Committee on Appropriations asked each agency, and what came of it."
          />
        </div>
        <div className="mt-6">
          <ErrorState
            title="Unable to load hearings"
            description={
              err instanceof BudgetApiError
                ? `${err.message} (Source: BetterGov.PH budget records.)`
                : "The BetterGov.PH budget source may be temporarily unavailable. Please try again."
            }
            retryHref="/budget/hearings"
          />
        </div>
      </div>
    );
  }

  /**
   * The list endpoint reports limit, offset, and returned but no whole-result
   * total, so the season is fetched once and filtered here. Filtering in the
   * page keeps every facet instant and costs no extra upstream request.
   */
  const agencies = Array.from(
    new Set(hearings.map((row) => row.agency).filter((agency): agency is string => Boolean(agency)))
  ).sort((a, b) => a.localeCompare(b));

  const lowered = query.toLowerCase();
  const filtered = hearings.filter(
    (row) =>
      (!agencyParam || row.agency === agencyParam) &&
      (!recordOnly || row.has_record) &&
      (!lowered || row.title.toLowerCase().includes(lowered))
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const parsedPage = Number.parseInt(params.page ?? "", 10);
  const page = Math.min(Math.max(Number.isNaN(parsedPage) ? 1 : parsedPage, 1), totalPages);
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function hrefFor(target: {
    page?: number;
    agency?: string;
    q?: string;
    record?: string;
  }): string {
    const qs = new URLSearchParams();
    const nextPage = target.page ?? 1;
    const nextAgency = target.agency ?? agencyParam;
    const nextQuery = target.q ?? query;
    const nextRecord = target.record ?? (recordOnly ? "with" : "");
    if (nextAgency) qs.set("agency", nextAgency);
    if (nextQuery) qs.set("q", nextQuery);
    if (nextRecord) qs.set("record", nextRecord);
    if (nextPage > 1) qs.set("page", String(nextPage));
    const search = qs.toString();
    return search ? `/budget/hearings?${search}` : "/budget/hearings";
  }

  const filtersActive = Boolean(agencyParam || query || recordOnly);
  const withRecord = hearings.filter((row) => row.has_record).length;
  const topicTotal = hearings.reduce((sum, row) => sum + (row.topic_count ?? 0), 0);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Budget", href: "/budget" },
          { label: "Hearings" },
        ]}
      />

      <div className="mt-4">
        <PageHeader
          eyebrow="Budget hearings · Source records"
          title="House budget hearings"
          description={`Every Committee on Appropriations hearing on the FY2027 proposed budget, with the topic record the Committee built from each stream: the question at issue, what was said, the figures as spoken, and where each item landed. ${formatCount(hearings.length)} hearings, ${formatCount(topicTotal)} topics.`}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 items-stretch gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-white p-4 sm:p-5">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
            <Gavel className="h-4 w-4" aria-hidden="true" />
            Hearings
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-ink sm:text-3xl">
            {formatCount(hearings.length)}
          </p>
          <p className="mt-1 min-h-5 text-xs leading-5 text-muted">FY2027 appropriations season</p>
        </div>
        <div className="rounded-lg border border-line bg-white p-4 sm:p-5">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
            <ScrollText className="h-4 w-4" aria-hidden="true" />
            Agencies heard
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-ink sm:text-3xl">
            {formatCount(agencies.length)}
          </p>
          <p className="mt-1 min-h-5 text-xs leading-5 text-muted">
            Some hearings cover more than one agency
          </p>
        </div>
        <div className="rounded-lg border border-line bg-white p-4 sm:p-5">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
            <Gavel className="h-4 w-4" aria-hidden="true" />
            Topics recorded
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-ink sm:text-3xl">
            {formatCount(topicTotal)}
          </p>
          <p className="mt-1 min-h-5 text-xs leading-5 text-muted">
            {formatCount(withRecord)} of {formatCount(hearings.length)} hearings have a record
          </p>
        </div>
      </div>

      <section aria-labelledby="hearings-list-heading" className="mt-8">
        <SectionHeader
          title="All hearings"
          description="Newest first, as the source publishes them."
        />
        <h2 id="hearings-list-heading" className="sr-only">
          All budget hearings
        </h2>

        <form
          method="get"
          role="search"
          aria-label="Filter hearings"
          className="mt-4 flex flex-col gap-3 rounded-lg border border-line bg-white p-4 lg:flex-row lg:items-end"
        >
          <div className="flex-1">
            <label htmlFor="hearing-agency" className="block text-xs font-semibold text-muted">
              Agency
            </label>
            <select
              id="hearing-agency"
              name="agency"
              defaultValue={agencyParam}
              className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink"
            >
              <option value="">All agencies</option>
              {agencies.map((agency) => (
                <option key={agency} value={agency}>
                  {agency}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-[2]">
            <label htmlFor="hearing-q" className="block text-xs font-semibold text-muted">
              Search titles
            </label>
            <input
              id="hearing-q"
              name="q"
              type="search"
              defaultValue={query}
              placeholder="e.g. judiciary, flood control…"
              className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-muted"
            />
          </div>
          <div className="lg:w-52">
            <label htmlFor="hearing-record" className="block text-xs font-semibold text-muted">
              Topic record
            </label>
            <select
              id="hearing-record"
              name="record"
              defaultValue={recordOnly ? "with" : ""}
              className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink"
            >
              <option value="">All hearings</option>
              <option value="with">With a topic record</option>
            </select>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              className="w-full rounded-md bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 sm:w-auto"
            >
              Filter
            </button>
            {filtersActive && (
              <Link
                href="/budget/hearings"
                className="rounded-md border border-line px-4 py-2.5 text-center text-sm font-semibold text-ink hover:bg-slate-50 sm:w-auto"
              >
                Clear
              </Link>
            )}
          </div>
        </form>

        <p className="mt-3 text-xs text-muted" role="status" aria-live="polite">
          Showing {filtered.length} of {hearings.length} hearings
          {filtersActive ? " · filtered" : ""}
        </p>

        {rows.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No hearings match these filters"
              description="Nothing in the FY2027 season matches that agency, keyword, or record filter."
              action={
                <Link
                  href="/budget/hearings"
                  className="inline-block rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
                >
                  Clear filters
                </Link>
              }
            />
          </div>
        ) : (
          <>
            {/* Phones: one card per hearing. Titles run past 80 characters,
                so they cannot share a row with four numeric columns. */}
            <ul className="mt-3 space-y-3 sm:hidden">
              {rows.map((row) => (
                <li key={row.video_id} className="rounded-lg border border-line bg-white p-4">
                  <Link
                    href={`/budget/hearings/${encodeURIComponent(row.video_id)}`}
                    className="block text-sm font-semibold text-ink hover:text-brand-700"
                  >
                    {shortHearingTitle(row.title)}
                  </Link>
                  <p className="mt-1 text-xs text-muted">
                    {row.agency ?? "Agency not stated"} · {formatHearingDate(row.hearing_date)} ·{" "}
                    {formatDuration(row.duration_seconds)}
                  </p>
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="tabular-nums text-muted">
                      {row.has_record
                        ? `${formatCount(row.topic_count ?? 0)} topics`
                        : "No topic record"}
                    </span>
                    {row.status === "no_captions" && <Badge tone="accent">No captions</Badge>}
                  </p>
                </li>
              ))}
            </ul>

            <div
              tabIndex={0}
              role="region"
              aria-label="House budget hearings, scrollable table"
              className="mt-3 hidden overflow-x-auto rounded-lg border border-line sm:block"
            >
              <table className="w-full min-w-[620px] border-collapse bg-white text-left text-sm">
                <caption className="sr-only">
                  House Committee on Appropriations budget hearings for the FY2027 proposed budget
                </caption>
                <thead>
                  <tr className="border-b border-line bg-surface text-xs uppercase tracking-wider text-muted">
                    <th scope="col" className="px-4 py-3 font-semibold">Hearing</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Agency</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Date</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Length</th>
                    <th scope="col" className="px-4 py-3 text-right font-semibold">Topics</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.video_id} className="border-b border-line last:border-0 hover:bg-surface/60">
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/budget/hearings/${encodeURIComponent(row.video_id)}`}
                          className="font-semibold text-ink hover:text-brand-700 hover:underline"
                          title={row.title}
                        >
                          {shortHearingTitle(row.title)}
                        </Link>
                        {row.status === "no_captions" && (
                          <span className="mt-1 block">
                            <Badge tone="accent">No captions</Badge>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-muted">{row.agency ?? "–"}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-muted">
                        {formatHearingDate(row.hearing_date)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right tabular-nums text-muted">
                        {formatDuration(row.duration_seconds)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right tabular-nums text-muted">
                        {row.has_record ? formatCount(row.topic_count ?? 0) : "–"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <Pagination
                page={page}
                total={filtered.length}
                limit={PAGE_SIZE}
                hrefFor={(target) => hrefFor({ page: target })}
              />
            </div>
          </>
        )}
      </section>

      <div className="mt-8 flex items-start gap-2.5 rounded-lg border border-line bg-surface px-4 py-3 text-xs leading-5 text-muted">
        <Gavel className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
        <p>
          Transcripts and topic records are machine-generated from the hearing audio, so speaker
          names and figures are best effort. Every topic, moment, and section links back to the
          hearing video at that timestamp. Verify anything you intend to quote.
        </p>
      </div>

      <div className="mt-8">
        <SourceAttribution
          retrievals={[hearingResponse.retrieval]}
          dataset={DATASET_LABEL}
          endpoint={`${BUDGET_API_BASE}/hearings`}
        />
      </div>
    </div>
  );
}

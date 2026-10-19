import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, FileText, Gavel, List, Video } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader, SectionHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { ErrorState } from "@/components/ui/States";
import { SourceAttribution } from "@/components/budget/SourceAttribution";
import { HearingRecord } from "@/components/budget/HearingRecord";
import {
  BUDGET_API_BASE,
  BudgetApiError,
  getHearing,
  getHearingTopics,
} from "@/lib/api/budget";
import type { HearingTopicDetail } from "@/types/budget";
import { formatCount } from "@/lib/utils";

const DATASET_LABEL = "House Committee on Appropriations budget hearings, FY2027";

/**
 * Upstream titles lead with the committee name, and the briefing form repeats
 * the agency in trailing parentheses. The full string is still shown on the
 * page under the heading; this is the readable form.
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
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** `length_text` is populated on one row only, so duration is derived instead. */
function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return "Unavailable";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours === 0) return `${minutes} minutes`;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ videoId: string }>;
}): Promise<Metadata> {
  const { videoId } = await params;
  try {
    const hearing = (await getHearing(videoId)).data;
    const topics = hearing.topic_count ?? hearing.topics.length;
    return {
      title: shortHearingTitle(hearing.title),
      description: `House Committee on Appropriations hearing on ${hearing.agency ?? "the agency's"} FY2027 proposed budget: ${formatCount(topics)} topics with the question at issue, what was said, the figures as spoken, and where each item landed.`,
    };
  } catch {
    // The page renders its own error state, so metadata falls back to a title.
    return { title: "Budget hearing" };
  }
}

export default async function HearingPage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = await params;

  let hearing;
  let topics: HearingTopicDetail[];
  let detail;
  let topicRecords;
  try {
    // Two requests: the metadata plus topic index, and the full topic records
    // in one call with the moment-by-moment thread omitted. The thread is
    // served on demand by the transcript route instead.
    [detail, topicRecords] = await Promise.all([
      getHearing(videoId),
      getHearingTopics(videoId),
    ]);
    hearing = detail.data;
    topics = topicRecords.data;
  } catch (err) {
    if (err instanceof BudgetApiError && err.isNotFound) notFound();
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Budget", href: "/budget" },
            { label: "Hearings", href: "/budget/hearings" },
            { label: "Hearing" },
          ]}
        />
        <div className="mt-4">
          <PageHeader
            eyebrow="Budget hearing"
            title="Hearing unavailable"
            description="This hearing could not be loaded from the BetterGov.PH budget records."
          />
        </div>
        <div className="mt-6">
          <ErrorState
            title="Unable to load this hearing"
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

  const title = shortHearingTitle(hearing.title);
  const agency = hearing.agency ?? "Agency not stated";
  const topicCount = topics.length;
  const firstSeconds = topics[0]?.first_seconds ?? 0;
  const encodedId = encodeURIComponent(videoId);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Budget", href: "/budget" },
          { label: "Hearings", href: "/budget/hearings" },
          { label: title },
        ]}
      />

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          size="compact"
          eyebrow={`${agency} · FY ${hearing.fiscal_year}`}
          title={title}
          description={`${formatHearingDate(hearing.hearing_date)} · ${formatDuration(hearing.duration_seconds)}. What the Committee on Appropriations asked, what the agency said, and where each item landed. Every moment links back to the hearing video.`}
        />
        <Badge tone="brand">{formatCount(topicCount)} topics</Badge>
      </div>

      <p className="mt-3 text-xs text-muted">
        Source title: <span className="font-mono text-[11px]">{hearing.title}</span>
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/budget/hearings"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-700 hover:underline"
        >
          ← All hearings
        </Link>
      </div>

      {/* Where the record can be read or watched, in one place. */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/budget/hearings/${encodedId}/transcript?t=${firstSeconds}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-brand-200 hover:text-brand-700"
        >
          <FileText className="h-4 w-4" aria-hidden="true" />
          Read the transcript
        </Link>
        <Link
          href={`/budget/hearings/${encodedId}/timeline`}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-brand-200 hover:text-brand-700"
        >
          <List className="h-4 w-4" aria-hidden="true" />
          Full proceedings timeline
        </Link>
        {hearing.youtube_url && (
          <a
            href={hearing.youtube_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-brand-200 hover:text-brand-700"
          >
            <Video className="h-4 w-4" aria-hidden="true" />
            Watch the hearing
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
        {hearing.page_url && (
          <a
            href={hearing.page_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-brand-200 hover:text-brand-700"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Source page
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 items-stretch gap-3 sm:grid-cols-3">
        <StatCard
          icon={Gavel}
          label="Topics recorded"
          value={String(topicCount)}
          valueNumber={topicCount}
          hint={hearing.has_record ? "Deliberation record available" : "No topic record"}
        />
        <StatCard
          icon={Video}
          label="Length"
          value={formatDuration(hearing.duration_seconds)}
          hint={
            hearing.has_transcript
              ? `Transcript from ${hearing.transcript_source ?? "the source"}`
              : "No transcript for this hearing"
          }
        />
        <StatCard
          icon={List}
          label="Status"
          value={hearing.status === "no_captions" ? "No captions" : "Captions available"}
          hint={`Record method: ${hearing.record_method ?? "not recorded"}`}
        />
      </div>

      <div className="mt-8 flex items-start gap-2.5 rounded-lg border border-line bg-surface px-4 py-3 text-xs leading-5 text-muted">
        <Gavel className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
        <p>
          This record is machine-generated from the hearing audio: speaker names, figures, and
          summaries are best effort and names are inferred from context. Treat it as an index into
          the video, and verify anything you intend to quote. Timestamps open the source at that
          moment.
        </p>
      </div>

      <section aria-labelledby="topics-heading" className="mt-8">
        <SectionHeader
          title="Topics"
          description={
            topicCount > 0
              ? "Each topic is what the Committee raised, in the order it came up. Open a record for the question at issue, the figures as spoken, and the outcome."
              : "The source publishes no topic record for this hearing."
          }
        />
        <h2 id="topics-heading" className="sr-only">
          Topics discussed
        </h2>

        {topicCount === 0 ? (
          <p className="mt-4 rounded-lg border border-line bg-white px-4 py-3 text-sm text-muted">
            The transcript for this hearing has no topic record. The{" "}
            <Link
              href={`/budget/hearings/${encodedId}/transcript`}
              className="font-semibold text-brand-700 hover:underline"
            >
              raw transcript
            </Link>{" "}
            is still available.
          </p>
        ) : (
          <ol className="mt-4 space-y-3">
            {topics.map((topic) => (
              <li
                key={topic.index}
                id={`topic-${topic.index}`}
                className="scroll-mt-24 rounded-lg border border-line bg-white p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{topic.status}</Badge>
                  {topic.url && (
                    <a
                      href={topic.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold tabular-nums text-brand-700 hover:underline"
                    >
                      {topic.timestamp}
                      <span className="sr-only"> watch from this point (opens in a new tab)</span>
                    </a>
                  )}
                  <Link
                    href={`/budget/hearings/${encodedId}/transcript?t=${topic.first_seconds}`}
                    className="text-xs font-semibold text-brand-700 hover:underline"
                  >
                    Transcript from here
                  </Link>
                  {topic.moment_count > 0 && (
                    <span className="text-xs tabular-nums text-muted">
                      {formatCount(topic.moment_count)} moments
                    </span>
                  )}
                </div>
                <h3 className="mt-2 text-base font-bold text-ink">{topic.topic}</h3>
                {topic.summary && (
                  <p className="mt-1.5 text-sm leading-6 text-ink/80">{topic.summary}</p>
                )}
                {topic.outcome && (
                  <p className="mt-2 border-l-2 border-brand-200 pl-3 text-sm leading-6 text-ink/80">
                    <span className="font-semibold text-ink">Outcome: </span>
                    {topic.outcome}
                  </p>
                )}
                {/* Any part of the record counts. The question, position, and
                    positions above are the ones the source reliably fills, so
                    gating on those alone would hide a record that carries only
                    figures and an outcome. */}
                {(topic.question ||
                  topic.agency_position ||
                  topic.outcome ||
                  topic.positions.length > 0 ||
                  topic.figures.length > 0 ||
                  topic.actions.length > 0) && (
                  <HearingRecord
                    record={topic}
                    transcriptHref={`/budget/hearings/${encodedId}/transcript?t=${topic.first_seconds}`}
                    timelineHref={`/budget/hearings/${encodedId}/timeline`}
                  />
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className="mt-8">
        <SourceAttribution
          retrievals={[detail.retrieval, topicRecords.retrieval]}
          dataset={DATASET_LABEL}
          endpoint={`${BUDGET_API_BASE}/hearings/${videoId} · ${BUDGET_API_BASE}/hearings/${videoId}/topics`}
        />
      </div>
    </div>
  );
}

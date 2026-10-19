import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { SourceAttribution } from "@/components/budget/SourceAttribution";
import { BUDGET_API_BASE, BudgetApiError, getHearingTranscript } from "@/lib/api/budget";
import { formatCount } from "@/lib/utils";

const DATASET_LABEL = "House Committee on Appropriations budget hearings, FY2027";

/** Upstream default window: 20 minutes from `from`, capped at 1000 segments. */
const WINDOW_SECONDS = 1200;

export const metadata: Metadata = {
  title: "Hearing Transcript",
  description:
    "Machine transcript of a House Committee on Appropriations budget hearing, read from any point, with every line timestamped into the hearing video.",
};

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

export default async function HearingTranscriptPage({
  params,
  searchParams,
}: {
  params: Promise<{ videoId: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const [{ videoId }, sp] = await Promise.all([params, searchParams]);
  const requested = Number.parseInt(sp.t ?? "", 10);
  const from = Number.isNaN(requested) ? 0 : Math.max(0, requested);

  let transcript;
  try {
    transcript = await getHearingTranscript(videoId, from);
  } catch (err) {
    if (err instanceof BudgetApiError && err.isNotFound) notFound();
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Budget", href: "/budget" },
            { label: "Hearings", href: "/budget/hearings" },
            { label: "Transcript" },
          ]}
        />
        <div className="mt-4">
          <PageHeader
            eyebrow="Budget hearing"
            title="Transcript unavailable"
            description="This hearing's transcript could not be loaded."
          />
        </div>
        <div className="mt-6">
          <ErrorState
            title="Unable to load the transcript"
            description={
              err instanceof BudgetApiError
                ? `${err.message} (Source: BetterGov.PH budget records.)`
                : "The BetterGov.PH budget source may be temporarily unavailable. Please try again."
            }
            retryHref={`/budget/hearings/${encodeURIComponent(videoId)}`}
          />
        </div>
      </div>
    );
  }

  const segments = transcript.data ?? [];
  const encodedId = encodeURIComponent(videoId);
  const windowEnd = from + WINDOW_SECONDS;

  function hrefAt(seconds: number): string {
    return `/budget/hearings/${encodedId}/transcript?t=${Math.max(0, Math.floor(seconds))}`;
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Budget", href: "/budget" },
          { label: "Hearings", href: "/budget/hearings" },
          { label: "Transcript" },
        ]}
      />

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          size="compact"
          eyebrow="Budget hearing transcript"
          title={transcript.meta.title}
          description={`Machine transcript from ${formatClock(from)} to ${formatClock(windowEnd)}, ${formatCount(segments.length)} lines. Every timestamp opens the source at that moment.`}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/budget/hearings/${encodedId}`}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-700 hover:underline"
        >
          ← Back to the topic record
        </Link>
        <Link
          href={`/budget/hearings/${encodedId}/timeline`}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-700 hover:underline"
        >
          Full proceedings timeline
        </Link>
      </div>

      {/* Jump form. A GET form, so a position in a seven hour hearing is a
          link a reader can send to someone else. */}
      <form
        method="get"
        role="search"
        aria-label="Jump to a point in the transcript"
        className="mt-6 flex flex-col gap-3 rounded-lg border border-line bg-white p-4 sm:flex-row sm:items-end"
      >
        <div className="sm:w-48">
          <label htmlFor="transcript-from" className="block text-xs font-semibold text-muted">
            Start at (seconds)
          </label>
          <input
            id="transcript-from"
            name="t"
            type="number"
            min={0}
            step={60}
            defaultValue={from}
            className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 sm:w-auto"
        >
          Read from there
        </button>
        <div className="flex flex-col gap-2 sm:flex-row">
          {from > 0 && (
            <Link
              href={hrefAt(Math.max(0, from - WINDOW_SECONDS))}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-slate-50"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Previous {WINDOW_SECONDS / 60} minutes
            </Link>
          )}
          <Link
            href={hrefAt(windowEnd)}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-slate-50"
          >
            Next {WINDOW_SECONDS / 60} minutes
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </form>

      <p className="mt-3 text-xs text-muted" role="status" aria-live="polite">
        {formatCount(segments.length)} lines from {formatClock(from)}
        {transcript.meta.truncated ? " (window truncated by the source)" : ""}
      </p>

      {segments.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No transcript in that window"
            description={`The source returned no lines between ${formatClock(from)} and ${formatClock(windowEnd)}. Try an earlier point in the hearing.`}
            action={
              <Link
                href={hrefAt(0)}
                className="inline-block rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
              >
                Back to the start
              </Link>
            }
          />
        </div>
      ) : (
        <ol className="mt-4 space-y-3">
          {segments.map((segment, index) => (
            <li
              key={`${segment.seconds}-${index}`}
              className="rounded-lg border border-line bg-white p-4"
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <a
                  href={segment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-xs font-semibold tabular-nums text-brand-700 hover:underline"
                >
                  {segment.timestamp}
                  <span className="sr-only"> open the source at this moment (opens in a new tab)</span>
                </a>
                {segment.speaker && (
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {segment.speaker}
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-sm leading-6 text-ink/85">{segment.text}</p>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-8 flex items-start gap-2.5 rounded-lg border border-line bg-surface px-4 py-3 text-xs leading-5 text-muted">
        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
        <p>
          {transcript.meta.note} {transcript.meta.diarized ? "Speakers are diarized." : "Speakers are not diarized."}{" "}
          Machine transcripts are imperfect, so names and figures are as heard. Verify against the
          video before quoting.
        </p>
      </div>

      <div className="mt-8">
        <SourceAttribution
          retrievals={[transcript.retrieval]}
          dataset={DATASET_LABEL}
          endpoint={`${BUDGET_API_BASE}/hearings/${videoId}/transcript?from=${from}`}
        />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Gavel, Users } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader, SectionHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { ErrorState } from "@/components/ui/States";
import { SourceAttribution } from "@/components/budget/SourceAttribution";
import { BUDGET_API_BASE, BudgetApiError, getHearingTimeline } from "@/lib/api/budget";
import type { HearingTimelineSection } from "@/types/budget";
import { formatCount } from "@/lib/utils";

const DATASET_LABEL = "House Committee on Appropriations budget hearings, FY2027";

/** Human label for a section kind, which the source publishes in lower case. */
const KIND_LABELS: Record<string, string> = {
  interpellation: "Interpellation",
  motion: "Motion",
  procedural: "Procedural",
  suspension: "Suspension",
  other: "Other",
};

function kindLabel(kind: string): string {
  return KIND_LABELS[kind] ?? kind;
}

export const metadata: Metadata = {
  title: "Hearing Timeline",
  description:
    "The proceedings of a House Committee on Appropriations budget hearing in order, section by section, with the figures and actions each section produced.",
};

export default async function HearingTimelinePage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const { videoId } = await params;

  let timeline;
  try {
    // The whole response is kept: hearing metadata and the confidence note
    // live in meta, the sections in data.
    timeline = await getHearingTimeline(videoId);
  } catch (err) {
    if (err instanceof BudgetApiError && err.isNotFound) notFound();
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Budget", href: "/budget" },
            { label: "Hearings", href: "/budget/hearings" },
            { label: "Timeline" },
          ]}
        />
        <div className="mt-4">
          <PageHeader
            eyebrow="Budget hearing"
            title="Timeline unavailable"
            description="This hearing's proceedings timeline could not be loaded."
          />
        </div>
        <div className="mt-6">
          <ErrorState
            title="Unable to load the timeline"
            description={
              err instanceof BudgetApiError
                ? `${err.message} (Source: BetterGov.PH Budget API.)`
                : "The BetterGov.PH Budget API may be temporarily unavailable. Please try again."
            }
            retryHref={`/budget/hearings/${encodeURIComponent(videoId)}`}
          />
        </div>
      </div>
    );
  }

  const sections = timeline.data.sections;
  const exchanges = sections.reduce(
    (sum, section) => sum + (section.exchanges?.length ?? 0),
    0
  );
  const figures = sections.reduce(
    (sum, section) => sum + (section.figures?.length ?? 0),
    0
  );
  const actions = sections.reduce(
    (sum, section) => sum + (section.actions?.length ?? 0),
    0
  );
  const speakers = (timeline.data.speakers ?? []).filter(
    (speaker) => speaker.name || speaker.label
  );
  const encodedId = encodeURIComponent(videoId);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Budget", href: "/budget" },
          { label: "Hearings", href: "/budget/hearings" },
          { label: "Timeline" },
        ]}
      />

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          size="compact"
          eyebrow={`${timeline.meta.agency ?? "Committee hearing"} · FY 2027`}
          title="Proceedings timeline"
          description={`The whole hearing in order: ${formatCount(sections.length)} sections from ${timeline.meta.hearing_date}, each with what was asked, the figures as spoken, and what the Committee did next.`}
        />
        <Badge tone="brand">{formatCount(sections.length)} sections</Badge>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/budget/hearings/${encodedId}`}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-700 hover:underline"
        >
          ← Back to the topic record
        </Link>
        <Link
          href={`/budget/hearings/${encodedId}/transcript`}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-700 hover:underline"
        >
          Read the transcript
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 items-stretch gap-3 sm:grid-cols-4">
        <TimelineStat label="Sections" value={formatCount(sections.length)} hint="Contiguous, in order" />
        <TimelineStat label="Questions" value={formatCount(exchanges)} hint="Asked and answered" />
        <TimelineStat label="Figures" value={formatCount(figures)} hint="As spoken, best effort" />
        <TimelineStat label="Actions" value={formatCount(actions)} hint="Rulings, motions, requests" />
      </div>

      {timeline.data.overview && (
        <section aria-labelledby="overview-heading" className="mt-8">
          <SectionHeader title="Overview" description="The source's own summary of the hearing." />
          <h2 id="overview-heading" className="sr-only">
            Overview of the hearing
          </h2>
          <p className="mt-4 rounded-lg border border-line bg-white px-4 py-3 text-sm leading-6 text-ink/80">
            {timeline.data.overview}
          </p>
        </section>
      )}

      {speakers.length > 0 && (
        <section aria-labelledby="speakers-heading" className="mt-8">
          <SectionHeader
            title="Speakers named"
            description="Names the source inferred from the transcript, with the confidence of each match."
          />
          <h2 id="speakers-heading" className="sr-only">
            Speakers named in the hearing
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {speakers.map((speaker, index) => (
              <li
                key={`${speaker.name ?? speaker.label}-${index}`}
                className="rounded-lg border border-line bg-white p-3"
              >
                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Users className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                  {speaker.name ?? speaker.label}
                </p>
                {speaker.role && <p className="mt-1 text-xs text-muted">{speaker.role}</p>}
                {speaker.side && (
                  <p className="mt-1 text-xs text-muted">
                    Side: {speaker.side}
                    {speaker.confidence ? ` · ${speaker.confidence} confidence` : ""}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="sections-heading" className="mt-8">
        <SectionHeader
          title="Sections"
          description="Every section in order. Open one for the exchanges, figures, and actions it produced."
        />
        <h2 id="sections-heading" className="sr-only">
          Sections of the hearing
        </h2>

        {/* Index first: the whole hearing on one screen, before any detail. */}
        <div
          tabIndex={0}
          role="region"
          aria-label="Sections of this hearing, scrollable table"
          className="mt-4 overflow-x-auto rounded-lg border border-line"
        >
          <table className="w-full min-w-[420px] border-collapse bg-white text-left text-sm">
            <caption className="sr-only">
              Sections of this hearing in order, with time and kind
            </caption>
            <thead>
              <tr className="border-b border-line bg-surface text-xs uppercase tracking-wider text-muted">
                <th scope="col" className="px-4 py-2.5 font-semibold">Time</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">Kind</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">What happened</th>
                <th scope="col" className="px-4 py-2.5 text-right font-semibold">Detail</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((section) => (
                <tr
                  key={section.index}
                  className="border-b border-line last:border-0 hover:bg-surface/60"
                >
                  <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-muted">
                    {section.start}
                  </td>
                  <td className="px-4 py-2.5 text-muted">{kindLabel(section.kind)}</td>
                  <td className="px-4 py-2.5">
                    <a
                      href={`#section-${section.index}`}
                      className="font-semibold text-ink hover:text-brand-700 hover:underline"
                    >
                      {section.title ?? `Section ${section.index + 1}`}
                    </a>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right text-xs text-muted">
                    <a href={`#section-${section.index}`} className="font-semibold text-brand-700 hover:underline">
                      Open
                      <span className="sr-only"> section {section.index + 1}</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ol className="mt-4 space-y-3">
          {sections.map((section) => (
            <SectionItem
              key={section.index}
              section={section}
              transcriptHref={`/budget/hearings/${encodedId}/transcript?t=${section.start_seconds}`}
            />
          ))}
        </ol>
      </section>

      <div className="mt-8 flex items-start gap-2.5 rounded-lg border border-line bg-surface px-4 py-3 text-xs leading-5 text-muted">
        <Gavel className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
        <p>
          {timeline.meta.confidence_note} Generated {timeline.meta.generated_at} from a{" "}
          {timeline.meta.transcript_source} transcript.{" "}
          {timeline.meta.diarized
            ? "Speakers are diarized."
            : "Speakers are not diarized."}{" "}
          Every timestamp opens the source at that moment.
        </p>
      </div>

      <div className="mt-8">
        <SourceAttribution
          dataset={DATASET_LABEL}
          endpoint={`${BUDGET_API_BASE}/hearings/${videoId}/timeline`}
        />
      </div>
    </div>
  );
}

function TimelineStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-ink">{value}</p>
      <p className="mt-1 min-h-5 text-xs leading-5 text-muted">{hint}</p>
    </div>
  );
}

/**
 * One section, collapsed. A seven hour hearing runs to dozens of sections and
 * each carries several exchanges, so the detail sits behind a disclosure and
 * the page stays scannable without any client state.
 */
function SectionItem({
  section,
  transcriptHref,
}: {
  section: HearingTimelineSection;
  transcriptHref: string;
}) {
  const exchanges = section.exchanges ?? [];
  const figures = section.figures ?? [];
  const actions = section.actions ?? [];

  return (
    <li
      id={`section-${section.index}`}
      className="scroll-mt-24 rounded-lg border border-line bg-white p-4"
    >
      <details>
        <summary className="cursor-pointer list-none">
          <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-mono text-xs tabular-nums text-muted">
              {section.start} to {section.end}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-700">
              {kindLabel(section.kind)}
            </span>
            <span className="text-sm font-semibold text-ink">
              {section.title ?? `Section ${section.index + 1}`}
            </span>
          </span>
        </summary>

        <div className="mt-3 space-y-3 text-sm leading-6">
          {section.summary && <p className="text-ink/80">{section.summary}</p>}

          {section.participants && section.participants.length > 0 && (
            <p className="text-xs text-muted">
              <span className="font-semibold uppercase tracking-wider">Participants: </span>
              {section.participants.join(" · ")}
            </p>
          )}
          {section.topics && section.topics.length > 0 && (
            <p className="text-xs text-muted">
              <span className="font-semibold uppercase tracking-wider">Topics: </span>
              {section.topics.join(" · ")}
            </p>
          )}

          {exchanges.length > 0 && (
            <ul className="space-y-3 border-l-2 border-brand-200 pl-3">
              {exchanges.map((exchange, i) => (
                <li key={`${exchange.seconds}-${i}`}>
                  <p className="text-xs font-semibold text-ink">
                    {exchange.asked_by ?? "A member"}
                    {exchange.answered_by ? ` asked, ${exchange.answered_by} answered` : " asked"}
                  </p>
                  <p className="mt-1 text-ink/80">{exchange.question}</p>
                  {exchange.answer && (
                    <p className="mt-1 text-ink/80">
                      <span className="font-semibold text-ink">Answer: </span>
                      {exchange.answer}
                    </p>
                  )}
                  {exchange.outcome && (
                    <p className="mt-1 text-ink/80">
                      <span className="font-semibold text-ink">Outcome: </span>
                      {exchange.outcome}
                    </p>
                  )}
                  <a
                    href={exchange.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-xs font-semibold tabular-nums text-brand-700 hover:underline"
                  >
                    {exchange.timestamp}
                    <span className="sr-only"> watch this exchange (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          )}

          {figures.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                Figures mentioned
              </p>
              <ul className="mt-1 space-y-1">
                {figures.map((figure) => (
                  <li key={`${figure.url}-${figure.amount_text}`} className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-semibold tabular-nums text-ink">{figure.amount_text}</span>
                    <span className="text-muted">{figure.what}</span>
                    {figure.url && (
                      <a
                        href={figure.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold tabular-nums text-brand-700 hover:underline"
                      >
                        {figure.timestamp}
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {actions.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Actions</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {actions.map((action) => (
                  <li key={`${action.url}-${action.kind}`}>
                    <span className="text-ink/80">{action.action}</span>{" "}
                    <span className="text-xs text-muted">
                      ({action.kind.replace(/_/g, " ")}, {action.who})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-1 text-xs">
            <a
              href={section.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline"
            >
              {section.start} on the source
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <Link
              href={transcriptHref}
              className="font-semibold text-brand-700 hover:underline"
            >
              Transcript from {section.start}
            </Link>
          </div>
        </div>
      </details>
    </li>
  );
}

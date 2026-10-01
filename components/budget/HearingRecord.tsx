import Link from "next/link";
import type { HearingTopicDetail } from "@/types/budget";

/**
 * The deliberation record for one hearing topic: the question at issue, the
 * agency's answer, the figures as spoken, the commitments made, and where it
 * landed. Every part is optional because the record is machine-built and thin
 * on some topics.
 *
 * Rendered inside a disclosure: on a topic-dense page it is reference detail,
 * not the thing the reader came for.
 *
 * The links out are passed in rather than built here: the component is shared
 * across routes and holds no video id, so the caller supplies the transcript
 * and timeline destinations. Both are optional, since a topic on a hearing
 * without a timeline or a transcript still has a record worth reading.
 */
export function HearingRecord({
  record,
  summaryLabel = "Deliberation record",
  transcriptHref,
  timelineHref,
}: {
  record: Pick<
    HearingTopicDetail,
    | "question"
    | "agency_position"
    | "outcome"
    | "figures"
    | "actions"
    | "positions"
    | "timeline_sections"
  >;
  summaryLabel?: string;
  transcriptHref?: string;
  timelineHref?: string;
}) {
  const figures = record.figures ?? [];
  const actions = record.actions ?? [];
  const positions = record.positions ?? [];
  const sections = record.timeline_sections ?? [];

  return (
    <details className="mt-3 rounded-md border border-line bg-surface/60 p-3">
      <summary className="cursor-pointer text-sm font-semibold text-brand-700">
        {summaryLabel}
      </summary>
      <div className="mt-3 space-y-3 text-sm leading-6">
        {record.question && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Question at issue
            </p>
            <p className="mt-1 text-ink/80">{record.question}</p>
          </div>
        )}
        {record.agency_position && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Agency position
            </p>
            <p className="mt-1 text-ink/80">{record.agency_position}</p>
          </div>
        )}
        {record.outcome && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Outcome</p>
            <p className="mt-1 text-ink/80">{record.outcome}</p>
          </div>
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
                  {/* Shown as the source recorded it. The field mixes confident
                      names with hedges such as "a committee member", and
                      normalizing it would mean guessing who spoke. */}
                  {figure.speaker && (
                    <span className="text-xs text-muted">{figure.speaker}</span>
                  )}
                  {figure.url && (
                    <a
                      href={figure.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-brand-700 hover:underline"
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
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Commitments and requests
            </p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {actions.map((action, i) => (
                <li key={`${action.url}-${action.kind}-${i}`}>
                  <span className="text-ink/80">{action.action}</span>{" "}
                  <span className="text-xs text-muted">
                    ({action.kind.replace(/_/g, " ")}, {action.who})
                  </span>{" "}
                  {/* An action is a moment in the hearing, so it carries the
                      same source link a figure does. Guarded on the url: the
                      type marks it optional, and a dead anchor is worse than
                      plain text. */}
                  {action.url && action.timestamp && (
                    <a
                      href={action.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold tabular-nums text-brand-700 hover:underline"
                    >
                      {action.timestamp}
                      <span className="sr-only"> watch the source at this moment (opens in a new tab)</span>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {positions.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Positions taken
            </p>
            <ul className="mt-1 space-y-1">
              {positions.map((position, i) => (
                <li key={`${position.who}:${position.position.slice(0, 40)}-${i}`}>
                  <span className="font-semibold text-ink">{position.who}:</span>{" "}
                  <span className="text-ink/80">{position.position}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Where this record can be read in full. The caller builds the
            transcript href at this topic's own start, so the label does not
            repeat a timestamp the link already carries. A topic names the
            sections of the timeline it covers and the timeline anchors each
            section by index, so the record traces to the stretch of the hearing
            it came from. The link opens the first of them; the rest are named
            for a screen reader rather than listed, since a topic can cover
            eight sections and a row of eight links reads as clutter. */}
        {(transcriptHref || (timelineHref && sections.length > 0)) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs">
            {transcriptHref && (
              <Link href={transcriptHref} className="font-semibold text-brand-700 hover:underline">
                Transcript from this point
              </Link>
            )}
            {timelineHref && sections.length > 0 && (
              <Link
                href={`${timelineHref}#section-${sections[0]}`}
                className="font-semibold text-brand-700 hover:underline"
              >
                {sections.length === 1
                  ? "1 section in the timeline"
                  : `${sections.length} sections in the timeline`}
                <span className="sr-only">
                  {" "}
                  (sections {sections.map((index) => index + 1).join(", ")})
                </span>
              </Link>
            )}
          </div>
        )}
      </div>
    </details>
  );
}

export default HearingRecord;

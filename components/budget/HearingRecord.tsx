import type { HearingTopicDetail } from "@/types/budget";

/**
 * The deliberation record for one hearing topic: the question at issue, the
 * agency's answer, the figures as spoken, the commitments made, and where it
 * landed. Every part is optional because the record is machine-built and thin
 * on some topics.
 *
 * Rendered inside a disclosure: on a topic-dense page it is reference detail,
 * not the thing the reader came for.
 */
export function HearingRecord({
  record,
  summaryLabel = "Deliberation record",
}: {
  record: Pick<
    HearingTopicDetail,
    "question" | "agency_position" | "outcome" | "figures" | "actions" | "positions"
  >;
  summaryLabel?: string;
}) {
  const figures = record.figures ?? [];
  const actions = record.actions ?? [];
  const positions = record.positions ?? [];

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
                  </span>
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
              {positions.map((position) => (
                <li key={`${position.who}:${position.position.slice(0, 40)}`}>
                  <span className="font-semibold text-ink">{position.who}:</span>{" "}
                  <span className="text-ink/80">{position.position}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </details>
  );
}

export default HearingRecord;

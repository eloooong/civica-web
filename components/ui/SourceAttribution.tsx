import { ExternalLink } from "lucide-react";
import type { SourceRetrieval } from "@/lib/api/source-cache";
import { formatRetrievalTime, isRetrievalStale } from "@/lib/freshness";

/**
 * Source transparency block. Render under every government-data section so
 * users never have to wonder where a record came from.
 */
export function SourceAttribution({
  source,
  docsUrl,
  endpoint,
  dataset,
  retrievals = [],
}: {
  source: string;
  docsUrl: string;
  endpoint: string;
  dataset: string;
  retrievals?: readonly (SourceRetrieval | null | undefined)[];
}) {
  const byEndpoint = new Map<string, SourceRetrieval>();
  for (const entry of retrievals) {
    if (!entry || formatRetrievalTime(entry.retrievedAt) === null) continue;
    const previous = byEndpoint.get(entry.endpoint);
    if (!previous || Date.parse(entry.retrievedAt) < Date.parse(previous.retrievedAt)) {
      byEndpoint.set(entry.endpoint, entry);
    }
  }
  const requests = [...byEndpoint.values()].sort((a, b) => Date.parse(a.retrievedAt) - Date.parse(b.retrievedAt));
  const oldest = requests[0];
  const stale = requests.some((request) => isRetrievalStale(request));
  const displayedEndpoint = requests.length === 1 ? oldest.endpoint : endpoint;
  return (
    <aside
      aria-label="Data source"
      className="rounded-lg border border-line bg-surface px-4 py-3 text-sm leading-6 text-muted"
    >
      <dl className="flex flex-wrap gap-x-6 gap-y-1">
        <div className="flex gap-1.5">
          <dt className="font-semibold text-ink">Source</dt>
          <dd>{source}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="font-semibold text-ink">Dataset</dt>
          <dd>{dataset}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="font-semibold text-ink">{requests.length > 1 ? "Oldest listed retrieval" : "Retrieved"}</dt>
          <dd>
            {oldest ? <time dateTime={oldest.retrievedAt}>{formatRetrievalTime(oldest.retrievedAt)}</time> : "Retrieval time unavailable"}
          </dd>
        </div>
      </dl>
      {stale && <p className="mt-2 font-semibold text-amber-800">A listed cached response is older than its refresh interval.</p>}
      <details open className="mt-1">
        <summary className="min-h-11 w-fit cursor-pointer rounded-sm py-2.5 font-semibold text-brand-700">Source details and retrieval times</summary>
        {oldest ? (
          <p className="mt-2">
            Times refer to the listed source requests, not the publisher&apos;s last update.
            Cached responses are eligible for refresh on request after {Math.round(oldest.cacheSeconds / 60)} minutes;
            a failed refresh may leave older data visible.
          </p>
        ) : (
          <p className="mt-2">No retrieval timestamp was recorded for this response. Check the source for its publication date.</p>
        )}
        {requests.length > 1 && (
          <ul aria-label="Source request times" className="mt-3 space-y-2 pb-2">
            {requests.map((request) => (
              <li key={request.endpoint}>
                <time dateTime={request.retrievedAt}>{formatRetrievalTime(request.retrievedAt)}</time>
                <code className="mt-0.5 block break-all text-xs">{request.endpoint}</code>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-1.5 break-all">
          Endpoint: <code className="rounded bg-white px-1 py-0.5 font-mono text-xs">{displayedEndpoint}</code>{" "}
          <a href={docsUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1 whitespace-nowrap rounded-sm font-semibold text-brand-700 hover:underline">
            Source documentation <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        </p>
      </details>
    </aside>
  );
}

import { ExternalLink } from "lucide-react";

/**
 * Source transparency block. Render under every government-data section so
 * users never have to wonder where a record came from.
 */
export function SourceAttribution({
  source,
  docsUrl,
  endpoint,
  dataset,
  retrievedAt,
}: {
  source: string;
  docsUrl: string;
  endpoint: string;
  dataset: string;
  retrievedAt?: string;
}) {
  const retrieved = retrievedAt ?? new Date().toISOString().slice(0, 10);
  return (
    <aside
      aria-label="Data source"
      className="rounded-lg border border-line bg-surface px-4 py-3 text-xs leading-5 text-muted"
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
          <dt className="font-semibold text-ink">Retrieved</dt>
          <dd>
            <time dateTime={retrieved}>{retrieved}</time> · cached up to 1 hour
          </dd>
        </div>
      </dl>
      <p className="mt-1.5 break-all">
        Endpoint: <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px]">{endpoint}</code>{" "}
        <a
          href={docsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-0.5 whitespace-nowrap font-semibold text-brand-700 hover:underline"
        >
          API docs
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      </p>
    </aside>
  );
}

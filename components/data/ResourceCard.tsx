import { Download, ExternalLink, FileText, Table2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { DatasetResource, ResourcePreview } from "@/types/dataset";
import { formatBytes, resourceFormatLabel } from "@/lib/datasets";

/**
 * One downloadable file with metadata, download/source links, and an
 * optional first-rows preview. Pure presentational.
 */
export function ResourceCard({
  resource,
  preview,
}: {
  resource: DatasetResource;
  preview: ResourcePreview | null;
}) {
  return (
    <article className="rounded-lg border border-line bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold leading-6 text-ink">{resource.name}</h3>
          {resource.description && (
            <p className="mt-1 text-sm leading-6 text-muted">{resource.description}</p>
          )}
        </div>
        <Badge tone="brand">{resourceFormatLabel(resource.mime_type, resource.name, resource.download_url)}</Badge>
      </div>

      <p className="mt-2 text-xs text-muted">
        {formatBytes(resource.size_bytes)}
        {resource.mime_type ? ` · ${resource.mime_type}` : ""}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {resource.download_url ? (
          <a
            href={resource.download_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-800"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download
          </a>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-line px-3.5 py-2 text-sm font-medium text-muted">
            <Download className="h-4 w-4" aria-hidden="true" />
            No download link
          </span>
        )}
        {resource.source_url && (
          <a
            href={resource.source_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-line px-3.5 py-2 text-sm font-semibold text-ink hover:bg-slate-50"
          >
            Source page
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        )}
      </div>

      {preview ? (
        <div className="mt-4">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
            <Table2 className="h-3.5 w-3.5" aria-hidden="true" />
            Preview · first {preview.rows.length} rows
          </p>
          <div
            tabIndex={0}
            role="region"
            aria-label={`First rows of ${resource.name}, scrollable table`}
            className="mt-2 overflow-x-auto rounded-md border border-line"
          >
            <table className="w-full border-collapse bg-white text-left text-xs">
              <caption className="sr-only">First rows of {resource.name}</caption>
              <thead>
                <tr className="border-b border-line bg-surface">
                  {preview.columns.map((col, i) => (
                    <th key={i} scope="col" className="whitespace-nowrap px-3 py-2 font-semibold text-ink">
                      {col || `Column ${i + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, i) => (
                  <tr key={i} className="border-b border-line last:border-0 odd:bg-white even:bg-surface/50">
                    {preview.columns.map((_, j) => (
                      <td key={j} className="max-w-56 truncate px-3 py-1.5 text-ink/80">
                        {row[j] ?? ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.truncated && (
            <p className="mt-1.5 text-xs text-muted">
              Showing the first {preview.rows.length} rows. Download the file for the full data.
            </p>
          )}
        </div>
      ) : (
        <p className="mt-4 inline-flex items-start gap-1.5 text-xs leading-5 text-muted">
          <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          In-browser preview is only available for small text files. Download the file to explore
          the full data.
        </p>
      )}
    </article>
  );
}

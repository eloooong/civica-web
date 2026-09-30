import Link from "next/link";
import { ArrowRight, Database } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { Dataset } from "@/types/dataset";
import { formatBytes, formatVersionDate, parseTags } from "@/lib/datasets";

/**
 * Dataset summary card. Pure presentational — receives server-fetched data
 * via props and never calls the API itself.
 */
export function DatasetCard({ dataset }: { dataset: Dataset }) {
  const tags = parseTags(dataset.tags).slice(0, 3);
  return (
    <article className="group relative flex h-full flex-col rounded-lg border border-line bg-white p-5 transition-[transform,border-color,box-shadow] duration-200 ease-institutional hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md">
      <div className="flex flex-wrap gap-1.5">
        {dataset.category && <Badge tone="brand">{dataset.category.name}</Badge>}
        <Badge>
          <Database className="mr-1 h-3 w-3" aria-hidden="true" />
          {(dataset.resource_count ?? 0) > 0
            ? `${dataset.resource_count} file${dataset.resource_count === 1 ? "" : "s"}`
            : "Catalog record"}
        </Badge>
      </div>
      <h3 className="mt-3 line-clamp-3 text-[15px] font-bold leading-6 text-ink transition-colors duration-200 ease-institutional group-hover:text-brand-800">
        {dataset.name}
      </h3>
      {dataset.description && (
        <p className="mt-1.5 line-clamp-3 flex-1 text-sm leading-6 text-muted">
          {dataset.description}
        </p>
      )}
      <div className="mt-3 flex flex-col gap-1 text-xs text-muted">
        {dataset.publisher && (
          <span>
            Publisher: <span className="font-medium text-ink/80">{dataset.publisher.name}</span>
          </span>
        )}
        <span>
          Updated {formatVersionDate(dataset.latest_version_date)} · {formatBytes(dataset.size_bytes)}
        </span>
      </div>
      {tags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
        </div>
      )}
      {/* The overlay makes the whole card a target, which is what the hover
          treatment on the card implies. */}
      <Link
        href={`/data/${dataset.id}`}
        className="mt-4 inline-flex w-fit items-center gap-1 rounded-sm text-sm font-semibold text-brand-700 after:absolute after:inset-0 after:content-['']"
        aria-label={`View dataset: ${dataset.name}`}
      >
        View dataset
        <ArrowRight
          className="h-4 w-4 transition-transform duration-200 ease-institutional group-hover:translate-x-1"
          aria-hidden="true"
        />
      </Link>
    </article>
  );
}

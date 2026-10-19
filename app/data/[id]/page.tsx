import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Building2, ExternalLink, Scale } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader, SectionHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { ErrorState } from "@/components/ui/States";
import { ResourceCard } from "@/components/data/ResourceCard";
import { SourceAttribution } from "@/components/ui/SourceAttribution";
import {
  DATA_API_BASE,
  DATA_DOCS_URL,
  DATA_SOURCE_NAME,
  DataApiError,
  getDataset,
  getResourcePreview,
  listResources,
} from "@/lib/api/datasets";
import { formatBytes, formatVersionDate, parseTags } from "@/lib/datasets";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const numeric = Number.parseInt(id, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) return { title: "Dataset" };
  try {
    const dataset = await getDataset(numeric);
    return {
      title: dataset.name,
      description: dataset.description?.slice(0, 160) ?? `Dataset record for ${dataset.name}.`,
    };
  } catch {
    return { title: "Dataset" };
  }
}

export default async function DatasetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numeric = Number.parseInt(id, 10);
  if (!Number.isInteger(numeric) || numeric <= 0) notFound();

  let dataset;
  let resources;
  try {
    [dataset, resources] = await Promise.all([getDataset(numeric), listResources(numeric)]);
  } catch (err) {
    if (err instanceof DataApiError && err.isNotFound) notFound();
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Government Data", href: "/data" }, { label: "Dataset" }]}
        />
        <div className="mt-6">
          <ErrorState
            title="Unable to load this dataset"
            description={
              err instanceof DataApiError
                ? `${err.message} (Source: Open Data Portal.)`
                : "The government datasets source may be temporarily unavailable. Please try again."
            }
            retryHref={`/data/${id}`}
          />
        </div>
      </div>
    );
  }

  const tags = parseTags(dataset.tags);
  const previews = await Promise.all(resources.data.map((r) => getResourcePreview(r)));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Government Data", href: "/data" }, { label: dataset.name }]}
      />

      <div className="mt-4">
        <PageHeader size="compact" eyebrow="Dataset record · Source records" title={dataset.name} />
        <div className="mt-4 flex flex-wrap gap-1.5">
          {dataset.category && <Badge tone="brand">{dataset.category.name}</Badge>}
          {dataset.license && (
            <Badge>
              <Scale className="mr-1 h-3 w-3" aria-hidden="true" />
              {dataset.license}
            </Badge>
          )}
          <Badge>
            {resources.data.length} file{resources.data.length === 1 ? "" : "s"} ·{" "}
            {formatBytes(dataset.size_bytes)}
          </Badge>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          {/* About */}
          <section aria-labelledby="about-heading" className="rounded-lg border border-line bg-white p-5">
            <h2 id="about-heading" className="text-base font-bold text-ink">
              About this dataset
            </h2>
            {dataset.description ? (
              <p className="mt-2 text-sm leading-7 text-ink/80">{dataset.description}</p>
            ) : (
              <p className="mt-2 text-sm leading-7 text-muted">
                No description provided by the publisher.
              </p>
            )}
            {tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Tags">
                {tags.map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </div>
            )}
            <dl className="mt-4 grid gap-2 border-t border-line pt-4 text-sm sm:grid-cols-2">
              <div className="flex gap-1.5">
                <dt className="font-semibold text-ink">Publisher</dt>
                <dd className="text-ink/80">{dataset.publisher?.name ?? "Unknown"}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="font-semibold text-ink">Last updated</dt>
                <dd className="text-ink/80">{formatVersionDate(dataset.latest_version_date)}</dd>
              </div>
            </dl>
          </section>

          {/* Resources */}
          <section aria-labelledby="resources-heading" className="mt-6">
            <SectionHeader
              title="Files and resources"
              description={`${resources.data.length} downloadable file${resources.data.length === 1 ? "" : "s"} published with this dataset.`}
            />
            <h2 id="resources-heading" className="sr-only">
              Files and resources
            </h2>
            {resources.data.length === 0 ? (
              <p className="mt-4 rounded-lg border border-dashed border-line bg-surface px-6 py-8 text-center text-sm text-muted">
                No downloadable files are listed for this dataset yet.
              </p>
            ) : (
              <ul className="mt-4 space-y-4">
                {resources.data.map((resource, i) => (
                  <li key={resource.id}>
                    <ResourceCard resource={resource} preview={previews[i] ?? null} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Attribution sidebar */}
        <aside aria-label="Publisher and license" className="h-fit space-y-4">
          <div className="rounded-lg border border-line bg-white p-5">
            <h2 className="inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-muted">
              <Building2 className="h-4 w-4" aria-hidden="true" />
              Publisher
            </h2>
            <p className="mt-2 text-sm font-semibold text-ink">{dataset.publisher?.name ?? "Unknown"}</p>
          </div>
          <div className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted">License & credit</h2>
            {dataset.attribution && dataset.attribution.length > 0 ? (
              <ul className="mt-2 space-y-3 text-xs leading-5 text-muted">
                {dataset.attribution.map((a, i) => (
                  <li key={i} className="border-t border-line pt-2 first:border-0 first:pt-0">
                    {a.attribution_text && <p className="text-ink/80">{a.attribution_text}</p>}
                    <p className="mt-1 flex flex-wrap gap-x-3">
                      {a.license && (
                        <span>
                          License:{" "}
                          {a.license_url ? (
                            <a href={a.license_url} target="_blank" rel="noreferrer" className="font-semibold text-brand-700 hover:underline">
                              {a.license}
                            </a>
                          ) : (
                            a.license
                          )}
                        </span>
                      )}
                      {a.source_url && (
                        <a
                          href={a.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-0.5 font-semibold text-brand-700 hover:underline"
                        >
                          Original source
                          <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </a>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs leading-5 text-muted">
                {dataset.license ? `Licensed under ${dataset.license}.` : "No license information provided."}{" "}
                {dataset.license_url && (
                  <a href={dataset.license_url} target="_blank" rel="noreferrer" className="font-semibold text-brand-700 hover:underline">
                    License details
                  </a>
                )}
              </p>
            )}
          </div>
          <p className="rounded-lg border border-line bg-surface px-4 py-3 text-xs leading-5 text-muted">
            Credit the publisher when reusing this data, and verify against the original
            source before citing.{" "}
            <Link href="/data" className="font-semibold text-brand-700 hover:underline">
              Back to explorer
            </Link>
          </p>
        </aside>
      </div>

      <div className="mt-8">
        <SourceAttribution
          retrievals={[dataset.retrieval, resources.retrieval]}
          source={DATA_SOURCE_NAME}
          docsUrl={DATA_DOCS_URL}
          endpoint={`${DATA_API_BASE}/datasets/${numeric}`}
          dataset="Community-run catalog of publicly available Philippine datasets"
        />
      </div>
    </div>
  );
}

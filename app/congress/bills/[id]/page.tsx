import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, ExternalLink, FileDown, Landmark, Users } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { ErrorState } from "@/components/ui/States";
import { SourceAttribution } from "@/components/ui/SourceAttribution";
import {
  CONGRESS_API_BASE,
  CONGRESS_DOCS_URL,
  CONGRESS_SOURCE_NAME,
  CongressApiError,
  getDocument,
} from "@/lib/api/congress";
import {
  billDisplayTitle,
  billLabel,
  congressOrdinal,
  formatFiledDate,
  personFullName,
} from "@/lib/congress";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const bill = await getDocument(id);
    return {
      title: `${billLabel(bill)}: ${billDisplayTitle(bill).slice(0, 80)}`,
      description: `Legislative record for ${billLabel(bill)}, ${congressOrdinal(bill.congress)}.`,
    };
  } catch {
    return { title: "Bill Detail" };
  }
}

export default async function BillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let bill;
  try {
    bill = await getDocument(id);
  } catch (err) {
    if (err instanceof CongressApiError && err.isNotFound) notFound();
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Congress", href: "/congress" }, { label: "Bill" }]}
        />
        <div className="mt-6">
          <ErrorState
            title="Unable to load this bill"
            description={
              err instanceof CongressApiError
                ? `${err.message} (Source: Open Congress records.)`
                : "The congressional records source may be temporarily unavailable. Please try again."
            }
            retryHref={`/congress/bills/${id}`}
          />
        </div>
      </div>
    );
  }

  const authors = bill.authors ?? [];
  const abstract = bill.congress_website_abstract ?? bill.long_title;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Congress", href: "/congress" },
          { label: billLabel(bill) },
        ]}
      />

      <div className="mt-4">
        <PageHeader size="compact" eyebrow={`${billLabel(bill)} · Legislative record`} title={billDisplayTitle(bill)} />
        <div className="mt-4 flex flex-wrap gap-1.5">
          <Badge tone="brand">{bill.subtype === "SB" ? "Senate Bill" : "House Bill"}</Badge>
          {bill.congress !== null && <Badge>{congressOrdinal(bill.congress)}</Badge>}
          {bill.scope && <Badge>{bill.scope}</Badge>}
          {bill.name && <Badge>{bill.name}</Badge>}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          {/* Facts */}
          <section aria-labelledby="facts-heading" className="rounded-lg border border-line bg-white p-5">
            <h2 id="facts-heading" className="text-sm font-bold uppercase tracking-wider text-muted">
              Legislative information
            </h2>
            <dl className="mt-3 divide-y divide-line text-sm">
              <div className="flex flex-col gap-1 py-2.5 sm:flex-row sm:gap-4">
                <dt className="inline-flex w-36 shrink-0 items-center gap-1.5 font-semibold text-ink">
                  <CalendarDays className="h-4 w-4 text-muted" aria-hidden="true" />
                  Date filed
                </dt>
                <dd className="text-ink/80">{formatFiledDate(bill.date_filed)}</dd>
              </div>
              <div className="flex flex-col gap-1 py-2.5 sm:flex-row sm:gap-4">
                <dt className="inline-flex w-36 shrink-0 items-center gap-1.5 font-semibold text-ink">
                  <Landmark className="h-4 w-4 text-muted" aria-hidden="true" />
                  Congress
                </dt>
                <dd className="text-ink/80">{congressOrdinal(bill.congress)}</dd>
              </div>
              <div className="flex flex-col gap-1 py-2.5 sm:flex-row sm:gap-4">
                <dt className="inline-flex w-36 shrink-0 items-center gap-1.5 font-semibold text-ink">
                  <Users className="h-4 w-4 text-muted" aria-hidden="true" />
                  Authors
                </dt>
                <dd className="text-ink/80">
                  {authors.length === 0 ? (
                    "Author information unavailable for this record."
                  ) : (
                    <ul className="flex flex-wrap gap-x-1">
                      {authors.map((a, i) => (
                        <li key={a.id}>
                          <Link
                            href={`/congress/people/${a.id}`}
                            className="rounded-sm font-medium text-brand-700 hover:underline"
                          >
                            {personFullName(a)}
                          </Link>
                          {i < authors.length - 1 ? <span aria-hidden="true">, </span> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </dd>
              </div>
              {bill.subjects.length > 0 && (
                <div className="flex flex-col gap-1 py-2.5 sm:flex-row sm:gap-4">
                  <dt className="w-36 shrink-0 font-semibold text-ink">Subjects</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {bill.subjects.map((s) => (
                      <Badge key={s}>{s}</Badge>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
            <p className="mt-3 rounded-md bg-surface px-3 py-2 text-xs leading-5 text-muted">
              The congressional record does not publish bill statuses or legislative stages, so
              this page shows no progress timeline. Only the facts above come from the source record.
            </p>
          </section>

          {/* Abstract */}
          {abstract && (
            <section aria-labelledby="abstract-heading" className="mt-6 rounded-lg border border-line bg-white p-5">
              <h2 id="abstract-heading" className="text-base font-bold text-ink">
                Abstract
              </h2>
              <p className="mt-2 text-sm leading-7 text-ink/80">{abstract}</p>
            </section>
          )}
        </div>

        {/* Source links */}
        <aside aria-label="Official sources" className="h-fit rounded-lg border border-line bg-white p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Official sources</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {bill.senate_website_permalink && (
              <li>
                <a
                  href={bill.senate_website_permalink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-sm font-semibold text-brand-700 hover:underline"
                >
                  Senate record
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </li>
            )}
            {bill.download_url_sources.map((url) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-sm font-semibold text-brand-700 hover:underline"
                >
                  <FileDown className="h-3.5 w-3.5" aria-hidden="true" />
                  Source document
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </li>
            ))}
            {!bill.senate_website_permalink && bill.download_url_sources.length === 0 && (
              <li className="text-muted">No external source links in this record.</li>
            )}
          </ul>
          <p className="mt-4 border-t border-line pt-3 text-xs leading-5 text-muted">
            Data is manually encoded and may contain inaccuracies. Verify against official
            congressional records before citing.{" "}
            <a
              href="https://github.com/bettergovph/open-congress-data/issues"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-brand-700 hover:underline"
            >
              Report an error
            </a>
            .
          </p>
        </aside>
      </div>

      <div className="mt-8">
        <SourceAttribution
          source={CONGRESS_SOURCE_NAME}
          docsUrl={CONGRESS_DOCS_URL}
          endpoint={`${CONGRESS_API_BASE}/documents/${id}`}
          dataset="Philippine legislative documents (manually encoded; inaccuracies possible. Verify before citing)"
        />
      </div>
    </div>
  );
}

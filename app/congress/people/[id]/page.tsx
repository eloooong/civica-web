import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Building2, FileText, Landmark } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { SectionHeader } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { BillCard } from "@/components/congress/BillCard";
import { Pagination } from "@/components/congress/Pagination";
import { SourceAttribution } from "@/components/ui/SourceAttribution";
import {
  CONGRESS_API_BASE,
  CONGRESS_DOCS_URL,
  CONGRESS_SOURCE_NAME,
  CongressApiError,
  getPerson,
  getPersonDocuments,
  getPersonGroups,
} from "@/lib/api/congress";
import { congressOrdinal, personFullName } from "@/lib/congress";

const BILLS_PER_PAGE = 12;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const person = await getPerson(id);
    return {
      title: personFullName(person),
      description: `Legislative profile and authored bills for ${personFullName(person)}.`,
    };
  } catch {
    return { title: "Legislator Profile" };
  }
}

export default async function PersonDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ billsPage?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const parsed = Number.parseInt(sp.billsPage ?? "", 10);
  const billsPage = Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
  const offset = (billsPage - 1) * BILLS_PER_PAGE;

  let person;
  let groups;
  let authored;
  try {
    [person, groups, authored] = await Promise.all([
      getPerson(id),
      getPersonGroups(id),
      getPersonDocuments(id, { limit: BILLS_PER_PAGE, offset }),
    ]);
  } catch (err) {
    if (err instanceof CongressApiError && err.isNotFound) notFound();
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Congress", href: "/congress" }, { label: "Legislator" }]}
        />
        <div className="mt-6">
          <ErrorState
            title="Unable to load this legislator"
            description={
              err instanceof CongressApiError
                ? `${err.message} (Source: Open Congress records.)`
                : "The congressional records source may be temporarily unavailable. Please try again."
            }
            retryHref={`/congress/people/${id}`}
          />
        </div>
      </div>
    );
  }

  const name = personFullName(person);
  const served = [...(person.congresses_served ?? [])].sort(
    (a, b) => b.congress_number - a.congress_number
  );
  const latest = served[0];
  const authoredTotal = authored.pagination?.total ?? authored.data.length;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Congress", href: "/congress" }, { label: name }]}
      />

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <PageHeader size="compact" eyebrow="Legislator profile · Live data" title={name} />
        {latest && <Badge tone="brand">{latest.position} · {latest.congress_ordinal} Congress</Badge>}
      </div>

      {/* Summary stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={FileText}
          label="Bills authored"
          value={authoredTotal.toLocaleString("en-PH")}
          hint="Across all congresses served"
        />
        <StatCard
          icon={Landmark}
          label="Congresses served"
          value={String(served.length)}
          hint={served.length > 0 ? `Latest: ${served[0]!.congress_ordinal} Congress` : "No service records"}
        />
        <StatCard
          icon={Building2}
          label="Chambers"
          value={String(new Set(groups.map((g) => g.subtype ?? g.name)).size || (groups.length > 0 ? 1 : 0))}
          hint={groups.length > 0 ? groups.map((g) => g.name).slice(0, 2).join(" · ") : "No chamber records"}
        />
      </div>

      {/* Service record */}
      <section aria-labelledby="service-heading" className="mt-10">
        <SectionHeader title="Service record" description="Congresses served and chamber memberships, as recorded by the source." />
        <h2 id="service-heading" className="sr-only">
          Service record
        </h2>
        {served.length === 0 && groups.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No service record available"
              description="The source has no congress membership data for this legislator yet."
            />
          </div>
        ) : (
          <div
            tabIndex={0}
            role="region"
            aria-label={`Congresses served by ${name}, scrollable table`}
            className="mt-4 overflow-x-auto rounded-lg border border-line"
          >
            <table className="w-full min-w-[480px] border-collapse bg-white text-left text-sm">
              <caption className="sr-only">Congresses served by {name}</caption>
              <thead>
                <tr className="border-b border-line bg-surface text-xs uppercase tracking-wider text-muted">
                  <th scope="col" className="px-4 py-3 font-semibold">Congress</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Position</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Chamber</th>
                </tr>
              </thead>
              <tbody>
                {served.map((s) => {
                  const chamber = groups.find((g) => g.congress === s.congress_number);
                  return (
                    <tr key={s.congress_number} className="border-b border-line last:border-0 hover:bg-surface/60">
                      <td className="px-4 py-3.5 font-semibold text-ink">{congressOrdinal(s.congress_number)}</td>
                      <td className="px-4 py-3.5 text-ink/80">{s.position}</td>
                      <td className="px-4 py-3.5 text-muted">{chamber ? chamber.name : "–"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Authored bills */}
      <section aria-labelledby="authored-heading" className="mt-10">
        <SectionHeader
          title="Authored bills"
          description={`${authoredTotal.toLocaleString("en-PH")} bill${authoredTotal === 1 ? "" : "s"} attributed to ${name} in the source database.`}
        />
        <h2 id="authored-heading" className="sr-only">
          Authored bills
        </h2>
        {authored.data.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No authored bills found"
              description="The source has no bills attributed to this legislator."
            />
          </div>
        ) : (
          <>
            <ul className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {authored.data.map((bill) => (
                <li key={bill.id}>
                  <BillCard bill={bill} />
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Pagination
                page={billsPage}
                total={authoredTotal}
                limit={BILLS_PER_PAGE}
                hrefFor={(p) => (p > 1 ? `/congress/people/${id}?billsPage=${p}` : `/congress/people/${id}`)}
              />
            </div>
          </>
        )}
      </section>

      <p className="mt-6 text-xs leading-5 text-muted">
        Back to{" "}
        <Link href="/congress" className="font-semibold text-brand-700 hover:underline">
          Congress explorer
        </Link>
        . Data is manually encoded and may contain inaccuracies. Verify against official
        congressional records before citing.
      </p>

      <div className="mt-4">
        <SourceAttribution
          source={CONGRESS_SOURCE_NAME}
          docsUrl={CONGRESS_DOCS_URL}
          endpoint={`${CONGRESS_API_BASE}/people/${id}`}
          dataset="Philippine legislators and authorship records (manually encoded; inaccuracies possible. Verify before citing)"
        />
      </div>
    </div>
  );
}

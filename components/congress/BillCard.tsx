import Link from "next/link";
import { ArrowRight, CalendarDays, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { BillDocument } from "@/types/congress";
import { billDisplayTitle, billLabel, congressOrdinal, formatFiledDate, personFullName } from "@/lib/congress";

/**
 * Bill summary card. Pure presentational — receives server-fetched data via
 * props and never calls the API itself.
 */
export function BillCard({ bill }: { bill: BillDocument }) {
  const authors = bill.authors ?? [];
  return (
    <article className="flex h-full flex-col rounded-lg border border-line bg-white p-5">
      <div className="flex flex-wrap gap-1.5">
        <Badge tone="brand">{billLabel(bill)}</Badge>
        {bill.congress !== null && <Badge>{congressOrdinal(bill.congress)}</Badge>}
        {bill.scope && <Badge>{bill.scope}</Badge>}
      </div>
      <h3 className="mt-3 line-clamp-4 text-[15px] font-bold leading-6 text-ink">
        {billDisplayTitle(bill)}
      </h3>
      <div className="mt-2 flex flex-col gap-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
          Filed: {formatFiledDate(bill.date_filed)}
        </span>
        {authors.length > 0 && (
          <span className="inline-flex items-start gap-1.5">
            <Users className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              {authors.length} author{authors.length === 1 ? "" : "s"}:{" "}
              {authors
                .slice(0, 3)
                .map((a) => personFullName(a))
                .join(", ")}
              {authors.length > 3 ? ` +${authors.length - 3} more` : ""}
            </span>
          </span>
        )}
      </div>
      <Link
        href={`/congress/bills/${bill.id}`}
        className="mt-4 inline-flex w-fit items-center gap-1 rounded-sm text-sm font-semibold text-brand-700 hover:underline"
        aria-label={`View bill ${billLabel(bill)}`}
      >
        View bill
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </article>
  );
}

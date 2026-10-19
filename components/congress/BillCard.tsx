import Link from "next/link";
import { ArrowRight, CalendarDays, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { BillDocument } from "@/types/congress";
import { billDisplayTitle, billLabel, billTitle, congressOrdinal, formatFiledDate, personFullName } from "@/lib/congress";

/**
 * Bill summary card. Pure presentational — receives server-fetched data via
 * props and never calls the API itself.
 */
export function BillCard({ bill }: { bill: BillDocument }) {
  const authors = bill.authors ?? [];
  const title = billTitle(bill);
  const abstract = bill.congress_website_abstract?.trim();
  const subjects = [...new Set(bill.subjects.map((subject) => subject.trim()).filter(Boolean))];
  return (
    <article className="group relative flex h-full flex-col rounded-lg border border-line bg-white p-5 transition-[transform,border-color,box-shadow] duration-200 ease-institutional hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md">
      <div className="flex flex-wrap gap-1.5">
        <Badge tone="brand">{billLabel(bill)}</Badge>
        {bill.congress !== null && <Badge>{congressOrdinal(bill.congress)}</Badge>}
        {bill.scope && <Badge>{bill.scope}</Badge>}
      </div>
      <h3 className="mt-3 line-clamp-4 break-words text-base font-semibold leading-6 text-ink transition-colors duration-200 ease-institutional group-hover:text-brand-800">
        {billDisplayTitle(bill)}
      </h3>
      {!title && (
        <p className="mt-2 text-sm leading-6 text-muted">
          {bill.date_filed
            ? "The source has not supplied a descriptive title."
            : "The source has not supplied a descriptive title or filing date."}
        </p>
      )}
      {abstract && abstract !== title && (
        <div className="mt-3 text-sm leading-6 text-muted">
          <p className="text-xs font-semibold">Source abstract</p>
          <p className="mt-1 line-clamp-3">{abstract}</p>
        </div>
      )}
      {subjects.length > 0 && (
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">
          <span className="font-semibold">Subjects: </span>{subjects.slice(0, 3).join(" · ")}
          {subjects.length > 3 ? ` (+${subjects.length - 3} more)` : ""}
        </p>
      )}
      <div className="mt-2 flex flex-col gap-1 text-xs text-muted">
        {bill.date_filed ? (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            Filed {formatFiledDate(bill.date_filed)}
          </span>
        ) : title ? (
          <span>Filing date not supplied by the source</span>
        ) : null}
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
      {/* The overlay makes the whole card a target, which is what the hover
          treatment on the card implies. */}
      <Link
        href={`/congress/bills/${bill.id}`}
        className="mt-auto inline-flex min-h-11 w-fit items-center gap-1 rounded-sm pt-4 text-sm font-semibold text-brand-700 after:absolute after:inset-0 after:content-['']"
        aria-label={`View bill ${billLabel(bill)}: ${title ?? "title unavailable"}`}
      >
        View bill
        <ArrowRight
          className="h-4 w-4 transition-transform duration-200 ease-institutional group-hover:translate-x-1"
          aria-hidden="true"
        />
      </Link>
    </article>
  );
}

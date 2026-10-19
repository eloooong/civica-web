import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { BillDocument } from "@/types/congress";
import { billDisplayTitle, billLabel, billTitle, congressOrdinal, formatFiledDate, personFullName } from "@/lib/congress";

/** A readable record row; official titles are preserved verbatim. */
export function BillCard({ bill }: { bill: BillDocument }) {
  const authors = bill.authors ?? [];
  const title = billTitle(bill);
  const abstract = bill.congress_website_abstract?.trim();
  const subjects = [...new Set(bill.subjects.map((subject) => subject.trim()).filter(Boolean))];
  return (
    <article className="group relative grid gap-3 rounded-md px-2 py-5 transition-colors hover:bg-surface sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-8 sm:px-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <Badge tone="brand">{billLabel(bill)}</Badge>
          {bill.congress !== null && <span>{congressOrdinal(bill.congress)}</span>}
          {bill.scope && <span className="text-xs">{bill.scope}</span>}
        </div>
        <h3 className="mt-2 line-clamp-4 max-w-[85ch] break-words text-base font-medium leading-7 text-ink group-hover:text-brand-800 sm:line-clamp-3 sm:text-lg">
          {billDisplayTitle(bill)}
        </h3>
        {!title && <p className="mt-2 text-sm leading-6 text-muted">The source has not supplied a descriptive title.</p>}
        {abstract && abstract !== title && (
          <p className="mt-2 line-clamp-3 max-w-[80ch] text-sm leading-6 text-muted">
            <span className="font-semibold">Source abstract: </span>{abstract}
          </p>
        )}
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm leading-6 text-muted">
          <span>{bill.date_filed ? `Filed ${formatFiledDate(bill.date_filed)}` : "Filing date not supplied"}</span>
          {authors.length > 0 && <span>{authors.slice(0, 3).map(personFullName).join(", ")}{authors.length > 3 ? ` +${authors.length - 3} more` : ""}</span>}
        </p>
        {subjects.length > 0 && (
          <p className="mt-1 text-sm leading-6 text-muted">Subjects: {subjects.slice(0, 3).join(" · ")}{subjects.length > 3 ? ` (+${subjects.length - 3} more)` : ""}</p>
        )}
      </div>
      <Link
        href={`/congress/bills/${bill.id}`}
        className="inline-flex min-h-11 w-fit items-center gap-2 self-center rounded-sm text-sm font-semibold text-brand-700 after:absolute after:inset-0 hover:underline"
        aria-label={`View bill ${billLabel(bill)}: ${title ?? "title unavailable"}`}
      >
        View bill <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </article>
  );
}

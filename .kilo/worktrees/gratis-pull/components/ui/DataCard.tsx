import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export function DataCard({
  badge,
  title,
  description,
  meta,
  href,
  hrefLabel = "View details",
}: {
  badge: string;
  title: string;
  description: string;
  meta?: ReactNode;
  href: string;
  hrefLabel?: string;
}) {
  return (
    <article className="flex flex-col rounded-lg border border-line bg-white p-5">
      <Badge tone="neutral">{badge}</Badge>
      <h3 className="mt-3 text-base font-bold leading-6 text-ink">{title}</h3>
      <p className="mt-1.5 flex-1 text-sm leading-6 text-muted">{description}</p>
      {meta && <div className="mt-3 flex flex-wrap gap-1.5">{meta}</div>}
      <Link
        href={href}
        className="mt-4 inline-flex w-fit items-center gap-1 rounded-sm text-sm font-semibold text-brand-700 hover:underline"
        aria-label={`${hrefLabel}: ${title}`}
      >
        {hrefLabel}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </article>
  );
}

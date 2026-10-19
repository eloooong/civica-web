import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

export function DataCard({ badge, title, description, href, hrefLabel = "View details" }: {
  badge: string;
  title: string;
  description: string;
  href: string;
  hrefLabel?: string;
}) {
  return (
    <article className="group relative grid gap-3 rounded-md px-2 py-5 transition-colors hover:bg-surface sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-8 sm:px-4">
      <div className="min-w-0">
        <Badge>{badge}</Badge>
        <h3 className="mt-2 line-clamp-4 max-w-[85ch] break-words text-base font-medium leading-7 text-ink group-hover:text-brand-800 sm:line-clamp-3 sm:text-lg">{title}</h3>
        {description && <p className="mt-2 max-w-[80ch] text-sm leading-6 text-muted">{description}</p>}
      </div>
      <Link href={href} className="inline-flex min-h-11 w-fit items-center gap-2 self-center rounded-sm text-sm font-semibold text-brand-700 after:absolute after:inset-0 hover:underline" aria-label={`${hrefLabel}: ${title}`}>
        {hrefLabel}<ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </article>
  );
}

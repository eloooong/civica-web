import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

export function ExploreCard({
  icon: Icon,
  title,
  description,
  href,
  meta,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  meta: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-lg border border-line bg-white p-6 transition-colors hover:border-brand-200 hover:bg-brand-50/40 focus-visible:outline-brand-700"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-md border border-line bg-surface text-brand-700">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="mt-4 text-lg font-bold tracking-tight text-ink">{title}</span>
      <span className="mt-1.5 flex-1 text-sm leading-6 text-muted">{description}</span>
      <span className="mt-4 flex items-center justify-between">
        <span className="text-xs font-medium text-muted">{meta}</span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 group-hover:underline">
          Explore
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </span>
    </Link>
  );
}

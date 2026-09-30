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
      className="group flex h-full flex-col rounded-xl border border-line bg-white p-6 shadow-sm transition-[transform,border-color,box-shadow] duration-200 ease-institutional hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 sm:p-7"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-md border border-line bg-surface text-brand-700 transition-[background-color,border-color] duration-200 ease-institutional group-hover:border-brand-200 group-hover:bg-brand-50">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <span className="mt-5 text-xl font-bold tracking-tight text-ink sm:text-2xl">{title}</span>
      <span className="mt-2 flex-1 text-sm leading-6 text-muted sm:text-base sm:leading-7">
        {description}
      </span>
      <span className="mt-5 flex items-center justify-between gap-2 border-t border-line pt-4">
        <span className="text-xs font-medium text-muted">{meta}</span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 group-hover:underline">
          Explore
          <ArrowRight
            className="h-4 w-4 transition-transform duration-200 ease-institutional group-hover:translate-x-1"
            aria-hidden="true"
          />
        </span>
      </span>
    </Link>
  );
}

import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";

/** Fallback for URLs that match no route (route-level not-found.tsx handles known segments). */
export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Not found" }]} />
      <div className="mt-4">
        <PageHeader
          eyebrow="Civica"
          title="Page not found"
          description="This URL doesn't match anything on Civica. It may be mistyped. Try searching instead."
        />
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/"
          className="inline-block rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
        >
          Back to home
        </Link>
        <Link
          href="/search"
          className="inline-block rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:bg-slate-50"
        >
          Search Civica
        </Link>
      </div>
    </div>
  );
}

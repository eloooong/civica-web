import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";

export default function CompareDepartmentsNotFound() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Budget", href: "/budget" }, { label: "Not found" }]}
      />
      <div className="mt-4">
        <PageHeader
          eyebrow="Budget explorer"
          title="Comparison not found"
          description="No comparison lives at that address. Pick a pair from the budget explorer."
        />
      </div>
      <div className="mt-6">
        <Link
          href="/budget/compare"
          className="inline-block rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
        >
          Compare two departments
        </Link>
      </div>
    </div>
  );
}

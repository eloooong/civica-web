import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";

export default function BudgetDepartmentNotFound() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Budget", href: "/budget" }, { label: "Not found" }]} />
      <div className="mt-4">
        <PageHeader
          eyebrow="Budget explorer"
          title="Department not found"
          description="There is no department with that code. It may be a mistyped URL."
        />
      </div>
      <div className="mt-6">
        <Link
          href="/budget"
          className="inline-block rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
        >
          Back to Budget Explorer
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";

export default function BudgetCycleNotFound() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Budget", href: "/budget" },
          { label: "Execution", href: "/budget/cycle" },
          { label: "Not found" },
        ]}
      />
      <div className="mt-4">
        <PageHeader
          eyebrow="Budget explorer"
          title="Subject not found"
          description="The budget cycle workbook has no covered subject for this address. Coverage is limited to the subjects listed on the execution page."
        />
      </div>
      <div className="mt-6">
        <Link
          href="/budget/cycle"
          className="inline-block rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
        >
          Back to covered subjects
        </Link>
      </div>
    </div>
  );
}

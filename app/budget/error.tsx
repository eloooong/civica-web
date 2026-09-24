"use client";

import { useEffect } from "react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState } from "@/components/ui/States";

export default function BudgetError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Budget explorer error:", error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Budget" }]} />
      <div className="mt-4">
        <PageHeader eyebrow="Budget explorer" title="Budget Explorer" description="Explore Philippine national budget data." />
      </div>
      <div className="mt-6">
        <ErrorState
          title="Something went wrong loading budget data"
          description="An unexpected error occurred. The BetterGov.PH Budget API may be temporarily unavailable."
          onRetry={reset}
        />
      </div>
    </div>
  );
}

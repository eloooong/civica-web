"use client";

import { useEffect } from "react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState } from "@/components/ui/States";

export default function NepError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("NEP budget error:", error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Budget", href: "/budget" },
          { label: "FY2027 Proposal" },
        ]}
      />
      <div className="mt-4">
        <PageHeader
          eyebrow="Budget explorer"
          title="FY2027 National Expenditure Program"
          description="The proposal the Executive sends to Congress for FY2027, set against the FY2026 enacted budget."
        />
      </div>
      <div className="mt-6">
        <ErrorState
          title="Something went wrong loading the proposal"
          description="An unexpected error occurred. The BetterGov.PH budget source may be temporarily unavailable."
          onRetry={reset}
        />
      </div>
    </div>
  );
}

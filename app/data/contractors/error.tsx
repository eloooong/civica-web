"use client";

import { useEffect } from "react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState } from "@/components/ui/States";

export default function ContractorsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Contractor data error:", error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Government Data", href: "/data" },
          { label: "Contractors" },
        ]}
      />
      <div className="mt-4">
        <PageHeader
          eyebrow="Government data · Contractors"
          title="Public contractors"
          description="Companies awarded flood control contracts in the Philippines."
        />
      </div>
      <div className="mt-6">
        <ErrorState
          title="Something went wrong loading contractor data"
          description="An unexpected error occurred. The Open Data Portal may be temporarily unavailable."
          onRetry={reset}
        />
      </div>
    </div>
  );
}

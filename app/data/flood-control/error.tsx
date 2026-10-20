"use client";

import { useEffect } from "react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState } from "@/components/ui/States";

export default function FloodControlError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Flood control data error:", error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Government Data", href: "/data" },
          { label: "Flood control contracts" },
        ]}
      />
      <div className="mt-4">
        <PageHeader
          eyebrow="Government data · Contracts"
          title="Flood control contracts"
          description="Contractors and project components in BetterGov.PH's published flood control snapshot."
        />
      </div>
      <div className="mt-6">
        <ErrorState
          title="Something went wrong loading contract data"
          description="An unexpected error occurred while loading the published project snapshot. Please try again."
          onRetry={reset}
        />
      </div>
    </div>
  );
}

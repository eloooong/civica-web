"use client";

import { useEffect } from "react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState } from "@/components/ui/States";

export default function SearchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unified search error:", error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Search" }]} />
      <div className="mt-4">
        <PageHeader
          eyebrow="Unified search"
          title="Search CivicLens"
          description="One query across budgets, bills, legislators, and government datasets."
        />
      </div>
      <div className="mt-6">
        <ErrorState
          title="Something went wrong running your search"
          description="An unexpected error occurred. Please try again."
          onRetry={reset}
        />
      </div>
    </div>
  );
}

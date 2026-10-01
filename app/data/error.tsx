"use client";

import { useEffect } from "react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState } from "@/components/ui/States";

export default function DataError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Data explorer error:", error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Government Data" }]} />
      <div className="mt-4">
        <PageHeader eyebrow="Data explorer" title="Government Data" description="Discover datasets published by Philippine government agencies." />
      </div>
      <div className="mt-6">
        <ErrorState
          title="Something went wrong loading the data catalog"
          description="An unexpected error occurred. The government datasets source may be temporarily unavailable."
          onRetry={reset}
        />
      </div>
    </div>
  );
}

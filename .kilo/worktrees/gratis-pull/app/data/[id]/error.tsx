"use client";

import { useEffect } from "react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState } from "@/components/ui/States";

export default function DatasetError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dataset detail error:", error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Government Data", href: "/data" }, { label: "Dataset" }]}
      />
      <div className="mt-4">
        <PageHeader eyebrow="Data explorer" title="Dataset" description="Dataset record and downloadable files." />
      </div>
      <div className="mt-6">
        <ErrorState
          title="Something went wrong loading this dataset"
          description="An unexpected error occurred. The Open Data Portal API may be temporarily unavailable."
          onRetry={reset}
        />
      </div>
    </div>
  );
}

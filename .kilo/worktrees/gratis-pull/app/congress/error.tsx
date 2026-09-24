"use client";

import { useEffect } from "react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState } from "@/components/ui/States";

export default function CongressError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Congress explorer error:", error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Congress" }]} />
      <div className="mt-4">
        <PageHeader eyebrow="Congress explorer" title="Congress" description="Search bills, legislators, and legislative records." />
      </div>
      <div className="mt-6">
        <ErrorState
          title="Something went wrong loading congressional data"
          description="An unexpected error occurred. The Open Congress API may be temporarily unavailable."
          onRetry={reset}
        />
      </div>
    </div>
  );
}

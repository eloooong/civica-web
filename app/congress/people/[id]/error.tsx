"use client";

import { useEffect } from "react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState } from "@/components/ui/States";

export default function PersonError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Legislator profile error:", error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Congress", href: "/congress" }, { label: "Legislator" }]}
      />
      <div className="mt-4">
        <PageHeader eyebrow="Congress explorer" title="Legislator Profile" description="Legislative profile and authored bills." />
      </div>
      <div className="mt-6">
        <ErrorState
          title="Something went wrong loading this legislator"
          description="An unexpected error occurred. The congressional records source may be temporarily unavailable."
          onRetry={reset}
        />
      </div>
    </div>
  );
}

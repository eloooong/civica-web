"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState } from "@/components/ui/States";

export default function HearingTimelineError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Hearing timeline error:", error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Budget", href: "/budget" },
          { label: "Hearings", href: "/budget/hearings" },
          { label: "Timeline" },
        ]}
      />
      <div className="mt-4">
        <PageHeader
          eyebrow="Budget hearing"
          title="Timeline unavailable"
          description="This hearing's proceedings timeline could not be loaded."
        />
      </div>
      <div className="mt-6">
        <ErrorState
          title="Something went wrong loading the timeline"
          description="An unexpected error occurred. The BetterGov.PH budget source may be temporarily unavailable."
          onRetry={reset}
        />
      </div>
      <div className="mt-6">
        <Link
          href="/budget/hearings"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-700 hover:underline"
        >
          Back to all hearings
        </Link>
      </div>
    </div>
  );
}

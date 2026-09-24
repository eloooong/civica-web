"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState } from "@/components/ui/States";

/** Last-resort boundary for errors not handled by a route-level error.tsx. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled app error:", error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Error" }]} />
      <div className="mt-4">
        <PageHeader
          eyebrow="CivicLens PH"
          title="Something went wrong"
          description="An unexpected error occurred while loading this page."
        />
      </div>
      <div className="mt-6">
        <ErrorState
          title="Something went wrong"
          description="Please try again. If the problem persists, return home and navigate from there."
          onRetry={reset}
        />
        <p className="mt-4 text-center text-sm">
          <Link href="/" className="font-semibold text-brand-700 hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

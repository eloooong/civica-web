import { CrumbSkeleton, HeaderSkeleton, LoadingShell, Skeleton } from "@/components/ui/Skeleton";

export default function HearingTranscriptLoading() {
  return (
    <LoadingShell label="Loading the hearing transcript from BetterGov.PH">
      <CrumbSkeleton />
      <HeaderSkeleton />
      <div className="rounded-lg border border-line bg-white p-4" aria-hidden="true">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-2 h-10 w-48" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="rounded-lg border border-line bg-white p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-4/5" />
          </div>
        ))}
      </div>
    </LoadingShell>
  );
}

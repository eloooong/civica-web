import { CrumbSkeleton, HeaderSkeleton, LoadingShell, Skeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function HearingTimelineLoading() {
  return (
    <LoadingShell label="Loading the hearing timeline from BetterGov.PH">
      <CrumbSkeleton />
      <HeaderSkeleton />
      <div className="grid gap-3 sm:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-lg border border-line bg-white p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-7 w-32" />
        <TableSkeleton rows={12} cols={4} />
      </div>
    </LoadingShell>
  );
}

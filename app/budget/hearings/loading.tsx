import {
  CrumbSkeleton,
  HeaderSkeleton,
  LoadingShell,
  Skeleton,
  TableSkeleton,
} from "@/components/ui/Skeleton";

export default function HearingsLoading() {
  return (
    <LoadingShell label="Loading House budget hearings from BetterGov.PH">
      <CrumbSkeleton />
      <HeaderSkeleton />
      <div className="grid gap-3 sm:grid-cols-3" aria-hidden="true">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="rounded-lg border border-line bg-white p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-8 w-20" />
            <Skeleton className="mt-2 h-3 w-40" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-line bg-white p-4" aria-hidden="true">
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-7 w-40" />
        <TableSkeleton rows={10} cols={5} />
      </div>
    </LoadingShell>
  );
}

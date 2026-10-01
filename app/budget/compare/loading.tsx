import {
  ChartsSkeleton,
  CrumbSkeleton,
  HeaderSkeleton,
  LoadingShell,
  Skeleton,
  TableSkeleton,
} from "@/components/ui/Skeleton";

export default function CompareDepartmentsLoading() {
  return (
    <LoadingShell label="Loading department comparison from BetterGov.PH">
      <CrumbSkeleton />
      <HeaderSkeleton />
      <div className="rounded-lg border border-line bg-white p-4" aria-hidden="true">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-2 h-10 w-full" />
        <Skeleton className="mt-3 h-3 w-28" />
        <Skeleton className="mt-2 h-10 w-full" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2" aria-hidden="true">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="rounded-lg border border-line bg-white p-5">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="mt-3 h-8 w-56" />
            <Skeleton className="mt-4 h-32 w-full" />
          </div>
        ))}
      </div>
      <ChartsSkeleton />
      <div className="space-y-3">
        <Skeleton className="h-7 w-48" />
        <TableSkeleton rows={4} cols={6} />
      </div>
    </LoadingShell>
  );
}

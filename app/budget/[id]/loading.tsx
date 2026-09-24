import {
  ChartsSkeleton,
  CrumbSkeleton,
  HeaderSkeleton,
  LoadingShell,
  Skeleton,
  TableSkeleton,
} from "@/components/ui/Skeleton";

export default function BudgetDepartmentLoading() {
  return (
    <LoadingShell label="Loading department budget from BetterGov.PH">
      <CrumbSkeleton />
      <HeaderSkeleton />
      <div className="flex flex-wrap gap-2" aria-hidden="true">
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-16" />
        ))}
      </div>
      <div className="space-y-4" aria-hidden="true">
        <div className="rounded-lg border border-line bg-white p-5">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="mt-3 h-8 w-56" />
          <Skeleton className="mt-4 h-44 w-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="rounded-lg border border-line bg-white p-5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-8 w-32" />
              <Skeleton className="mt-2 h-3 w-40" />
            </div>
          ))}
        </div>
      </div>
      <ChartsSkeleton />
      <div className="space-y-3">
        <Skeleton className="h-7 w-64" />
        <TableSkeleton rows={6} cols={3} />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-7 w-64" />
        <TableSkeleton rows={8} cols={3} />
      </div>
    </LoadingShell>
  );
}

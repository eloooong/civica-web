import {
  ChartsSkeleton,
  CrumbSkeleton,
  HeaderSkeleton,
  LoadingShell,
  Skeleton,
  StatsSkeleton,
  TableSkeleton,
} from "@/components/ui/Skeleton";

export default function BudgetLoading() {
  return (
    <LoadingShell label="Loading budget data from BetterGov.PH">
      <CrumbSkeleton />
      <HeaderSkeleton />
      <div className="flex flex-wrap gap-2" aria-hidden="true">
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-16" />
        ))}
      </div>
      <StatsSkeleton count={4} />
      <ChartsSkeleton />
      <div className="space-y-3">
        <Skeleton className="h-7 w-64" />
        <TableSkeleton rows={8} cols={4} />
      </div>
    </LoadingShell>
  );
}

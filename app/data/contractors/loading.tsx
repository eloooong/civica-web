import {
  CrumbSkeleton,
  FilterBarSkeleton,
  HeaderSkeleton,
  LoadingShell,
  Skeleton,
  StatsSkeleton,
  TableSkeleton,
} from "@/components/ui/Skeleton";

export default function ContractorsLoading() {
  return (
    <LoadingShell label="Loading contractor data from the Open Data Portal">
      <CrumbSkeleton />
      <HeaderSkeleton />
      <div className="flex gap-3" aria-hidden="true">
        <Skeleton className="h-11 w-44" />
        <Skeleton className="h-11 w-40" />
      </div>
      <StatsSkeleton count={3} />
      <div className="space-y-3">
        <Skeleton className="h-7 w-40" />
        <FilterBarSkeleton />
        <TableSkeleton rows={8} cols={7} />
      </div>
    </LoadingShell>
  );
}

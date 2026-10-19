import {
  CrumbSkeleton,
  FilterBarSkeleton,
  HeaderSkeleton,
  LoadingShell,
  Skeleton,
  TableSkeleton,
} from "@/components/ui/Skeleton";

export default function FloodControlLoading() {
  return (
    <LoadingShell label="Loading flood control contracts from the Open Data Portal">
      <CrumbSkeleton />
      <HeaderSkeleton />
      <div className="flex flex-wrap gap-3" aria-hidden="true">
        <Skeleton className="h-11 w-44" />
        <Skeleton className="h-11 w-40" />
      </div>
      <Skeleton className="h-12 w-full" />
      <div className="space-y-3">
        <Skeleton className="h-7 w-48" />
        <FilterBarSkeleton />
        <TableSkeleton rows={8} cols={6} />
      </div>
    </LoadingShell>
  );
}

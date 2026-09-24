import {
  CardsSkeleton,
  CrumbSkeleton,
  FilterBarSkeleton,
  HeaderSkeleton,
  LoadingShell,
  Skeleton,
  StatsSkeleton,
} from "@/components/ui/Skeleton";

export default function DataLoading() {
  return (
    <LoadingShell label="Loading data catalog from the Open Data Portal">
      <CrumbSkeleton />
      <HeaderSkeleton />
      <StatsSkeleton count={4} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="rounded-lg border border-line bg-white px-4 py-3.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="mt-2 h-3 w-1/2" />
          </div>
        ))}
      </div>
      <FilterBarSkeleton />
      <CardsSkeleton count={6} />
    </LoadingShell>
  );
}

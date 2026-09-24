import {
  CardsSkeleton,
  CrumbSkeleton,
  HeaderSkeleton,
  LoadingShell,
  Skeleton,
  StatsSkeleton,
  TableSkeleton,
} from "@/components/ui/Skeleton";

export default function PersonLoading() {
  return (
    <LoadingShell label="Loading legislator profile from the Open Congress API">
      <CrumbSkeleton />
      <HeaderSkeleton titleWidth="w-1/2" />
      <StatsSkeleton count={3} />
      <div className="space-y-3">
        <Skeleton className="h-7 w-64" />
        <TableSkeleton rows={4} cols={3} />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-7 w-64" />
        <CardsSkeleton count={6} />
      </div>
    </LoadingShell>
  );
}

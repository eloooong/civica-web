import {
  CrumbSkeleton,
  HeaderSkeleton,
  LoadingShell,
  Skeleton,
  StatsSkeleton,
  TableSkeleton,
} from "@/components/ui/Skeleton";

export default function NepLoading() {
  return (
    <LoadingShell label="Loading the FY2027 proposed budget from BetterGov.PH">
      <CrumbSkeleton />
      <HeaderSkeleton />
      <StatsSkeleton count={4} />
      <div className="space-y-3">
        <Skeleton className="h-7 w-56" />
        <TableSkeleton rows={4} cols={5} />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-7 w-56" />
        <TableSkeleton rows={8} cols={5} />
      </div>
    </LoadingShell>
  );
}

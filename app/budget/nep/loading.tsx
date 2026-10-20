import {
  CrumbSkeleton,
  HeaderSkeleton,
  LoadingShell,
  Skeleton,
  TableSkeleton,
} from "@/components/ui/Skeleton";

export default function NepLoading() {
  return (
    <LoadingShell label="Loading the FY2027 proposed budget from BetterGov.PH">
      <CrumbSkeleton />
      <HeaderSkeleton />
      <div className="space-y-5 rounded-xl border border-line p-5 sm:p-6">
        <Skeleton className="h-7 w-56" />
        <div className="grid gap-7 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="space-y-5">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-5 w-3/4" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
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

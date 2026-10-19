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
      <Skeleton className="h-12 w-full" />
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

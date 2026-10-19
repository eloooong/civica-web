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
      <div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /></div>
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

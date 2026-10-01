import {
  CrumbSkeleton,
  HeaderSkeleton,
  LoadingShell,
  Skeleton,
} from "@/components/ui/Skeleton";

export default function HearingLoading() {
  return (
    <LoadingShell label="Loading hearing record from BetterGov.PH">
      <CrumbSkeleton />
      <HeaderSkeleton />
      <div className="flex flex-wrap gap-2" aria-hidden="true">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-11 w-44" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3" aria-hidden="true">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="rounded-lg border border-line bg-white p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-8 w-28" />
            <Skeleton className="mt-2 h-3 w-36" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-lg border border-line bg-white p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-5 w-3/4" />
            <Skeleton className="mt-2 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
          </div>
        ))}
      </div>
    </LoadingShell>
  );
}

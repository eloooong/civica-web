import {
  CrumbSkeleton,
  DetailSkeleton,
  HeaderSkeleton,
  LoadingShell,
  Skeleton,
} from "@/components/ui/Skeleton";

export default function DatasetLoading() {
  return (
    <LoadingShell label="Loading dataset record from the Open Data Portal">
      <CrumbSkeleton />
      <HeaderSkeleton />
      <DetailSkeleton />
      <div className="space-y-4" aria-hidden="true">
        <Skeleton className="h-7 w-64" />
        <div className="rounded-lg border border-line bg-white p-5">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="mt-2 h-4 w-full" />
          <Skeleton className="mt-2 h-10 w-40" />
        </div>
      </div>
    </LoadingShell>
  );
}

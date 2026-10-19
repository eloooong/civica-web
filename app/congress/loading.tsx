import {
  CardsSkeleton,
  CrumbSkeleton,
  FilterBarSkeleton,
  HeaderSkeleton,
  LoadingShell,
  Skeleton,
} from "@/components/ui/Skeleton";

export default function CongressLoading() {
  return (
    <LoadingShell label="Loading congressional data from Open Congress">
      <CrumbSkeleton />
      <HeaderSkeleton />
      <Skeleton className="h-5 w-full max-w-lg" />
      <FilterBarSkeleton />
      <CardsSkeleton count={6} layout="list" />
    </LoadingShell>
  );
}

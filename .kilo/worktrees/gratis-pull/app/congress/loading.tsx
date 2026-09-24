import {
  CardsSkeleton,
  CrumbSkeleton,
  FilterBarSkeleton,
  HeaderSkeleton,
  LoadingShell,
  StatsSkeleton,
} from "@/components/ui/Skeleton";

export default function CongressLoading() {
  return (
    <LoadingShell label="Loading congressional data from the Open Congress API">
      <CrumbSkeleton />
      <HeaderSkeleton />
      <StatsSkeleton count={4} />
      <FilterBarSkeleton />
      <CardsSkeleton count={6} />
    </LoadingShell>
  );
}

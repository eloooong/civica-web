import {
  CrumbSkeleton,
  DetailSkeleton,
  HeaderSkeleton,
  LoadingShell,
} from "@/components/ui/Skeleton";

export default function BillLoading() {
  return (
    <LoadingShell label="Loading bill record from Open Congress">
      <CrumbSkeleton />
      <HeaderSkeleton titleWidth="w-5/6" />
      <DetailSkeleton />
    </LoadingShell>
  );
}

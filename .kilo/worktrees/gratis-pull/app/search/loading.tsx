import {
  CardsSkeleton,
  CrumbSkeleton,
  HeaderSkeleton,
  LoadingShell,
  Skeleton,
} from "@/components/ui/Skeleton";

export default function SearchLoading() {
  return (
    <LoadingShell label="Searching budgets, bills, and datasets">
      <CrumbSkeleton />
      <HeaderSkeleton titleWidth="w-1/2" />
      <Skeleton className="h-14 w-full max-w-2xl" />
      <div className="flex gap-1 border-b border-line pb-0" aria-hidden="true">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-20 rounded-b-none" />
        ))}
      </div>
      <CardsSkeleton count={4} />
    </LoadingShell>
  );
}

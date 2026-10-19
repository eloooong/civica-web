import {
  CardsSkeleton,
  ChartsSkeleton,
  CrumbSkeleton,
  HeaderSkeleton,
  LoadingShell,
  Skeleton,
  StatsSkeleton,
  TableSkeleton,
} from "@/components/ui/Skeleton";
import { OverviewDisclosure } from "@/components/ui/OverviewDisclosure";

export default function BudgetLoading() {
  return (
    <LoadingShell label="Loading budget data from BetterGov.PH">
      <CrumbSkeleton />
      <HeaderSkeleton />
      <div className="flex flex-wrap gap-2" aria-hidden="true">
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-16" />
        ))}
      </div>
      <OverviewDisclosure title="Budget overview">
        <div className="space-y-6">
          <StatsSkeleton count={4} />
          <ChartsSkeleton />
        </div>
      </OverviewDisclosure>
      <div className="space-y-3">
        <Skeleton className="h-7 w-64" />
        <div className="flex flex-col gap-3 sm:flex-row" aria-hidden="true">
          <Skeleton className="h-11 w-full sm:flex-1" />
          <Skeleton className="h-11 w-44" />
        </div>
        <div className="sm:hidden"><CardsSkeleton count={4} /></div>
        <div className="hidden sm:block"><TableSkeleton rows={8} cols={3} /></div>
      </div>
    </LoadingShell>
  );
}

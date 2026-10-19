import {
  CardsSkeleton,
  CrumbSkeleton,
  HeaderSkeleton,
  LoadingShell,
  Skeleton,
  StatsSkeleton,
} from "@/components/ui/Skeleton";
import { OverviewDisclosure } from "@/components/ui/OverviewDisclosure";

export default function DataLoading() {
  return (
    <LoadingShell label="Loading data catalog from the Open Data Portal">
      <CrumbSkeleton />
      <HeaderSkeleton />
      <OverviewDisclosure title="Catalog overview and topics">
        <StatsSkeleton count={4} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="rounded-lg border border-line bg-white px-4 py-3.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="mt-2 h-3 w-1/2" />
            </div>
          ))}
        </div>
      </OverviewDisclosure>
      <div className="grid gap-3 rounded-lg border border-line bg-white p-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto]" aria-hidden="true">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={i === 0 ? "min-w-0 sm:col-span-2 xl:col-span-1" : "min-w-0"}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-1 h-11 w-full" />
          </div>
        ))}
        <Skeleton className="h-11 w-24 self-end" />
      </div>
      <CardsSkeleton count={6} />
    </LoadingShell>
  );
}

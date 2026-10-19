import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/** Show the overview initially while allowing readers to fold it away. */
export function OverviewDisclosure({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details open className="group mt-6 border-y border-line py-2">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-sm text-sm font-semibold text-brand-700 [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="h-4 w-4 shrink-0 group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="pb-4 pt-3">{children}</div>
    </details>
  );
}

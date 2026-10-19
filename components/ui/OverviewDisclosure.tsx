"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/** Compact on small screens; readers can open or close the overview at any size. */
export function OverviewDisclosure({ title, children }: { title: string; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const update = () => {
      if (ref.current) ref.current.open = desktop.matches;
    };
    update();
    desktop.addEventListener("change", update);
    return () => desktop.removeEventListener("change", update);
  }, []);

  return (
    <details ref={ref} className="group mt-6 border-y border-line py-2">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-sm text-sm font-semibold text-brand-700 [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="h-4 w-4 shrink-0 group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="pb-4 pt-3">{children}</div>
    </details>
  );
}

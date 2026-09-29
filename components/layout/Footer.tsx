import Link from "next/link";
import { Landmark } from "lucide-react";
import { DataStatus } from "@/components/ui/DataStatus";

export function Footer() {
  return (
    <footer className="bg-surface">
      <div aria-hidden="true" className="flex h-1 w-full">
        <span className="w-1/2 bg-brand-600" />
        <span className="w-1/3 bg-accent-600" />
        <span className="w-1/6 bg-amber-300" />
      </div>
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <p className="flex items-center gap-2 text-sm font-bold text-ink">
            <span
              aria-hidden="true"
              className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-700 text-white"
            >
              <Landmark className="h-4 w-4" strokeWidth={2} />
            </span>
            CivicLens PH
          </p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
            Philippine government data, made easier to understand. Explore
            budgets, legislation, and government datasets.
          </p>
          <DataStatus className="mt-3 text-muted" />
        </div>
        <nav aria-label="Explore">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Explore</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="text-ink/80 hover:text-brand-700 hover:underline" href="/budget">Budget</Link></li>
            <li><Link className="text-ink/80 hover:text-brand-700 hover:underline" href="/congress">Congress</Link></li>
            <li><Link className="text-ink/80 hover:text-brand-700 hover:underline" href="/data">Government Data</Link></li>
            <li><Link className="text-ink/80 hover:text-brand-700 hover:underline" href="/search">Search</Link></li>
          </ul>
        </nav>
        <nav aria-label="Sources">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Sources</p>
          <ul className="mt-3 space-y-2 text-sm text-ink/80">
            <li>BetterGov Budget API</li>
            <li>Open Congress API</li>
            <li>Open Data Portal API</li>
          </ul>
        </nav>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">About</p>
          <ul className="mt-3 space-y-2 text-sm text-ink/80">
            <li>Built for transparency and learning</li>
            <li>Not an official government website</li>
            <li>Verify with source agencies</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 py-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© 2026 CivicLens PH. Demonstration interface.</p>
          <p className="text-[11px] font-semibold uppercase tracking-widest">
            Budget · Congress · Government Data
          </p>
        </div>
      </div>
    </footer>
  );
}

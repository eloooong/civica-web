import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <p className="text-sm font-bold text-ink">CivicLens PH</p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
            Philippine government data, made easier to understand. Explore
            budgets, legislation, and government datasets.
          </p>
          <p className="mt-3 inline-flex items-center rounded border border-line bg-white px-2 py-1 text-xs text-muted">
            Phase 1 — Illustrative placeholder data only
          </p>
        </div>
        <nav aria-label="Explore">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Explore</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="text-ink/80 hover:text-brand-700 hover:underline" href="/budget">Budget</Link></li>
            <li><Link className="text-ink/80 hover:text-brand-700 hover:underline" href="/congress">Congress</Link></li>
            <li><Link className="text-ink/80 hover:text-brand-700 hover:underline" href="/data">Government data</Link></li>
            <li><Link className="text-ink/80 hover:text-brand-700 hover:underline" href="/search">Search</Link></li>
          </ul>
        </nav>
        <nav aria-label="Sources">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Future sources</p>
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
            <li>Always verify with source agencies</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© 2026 CivicLens PH. Demonstration interface.</p>
          <p>Budget · Congress · Government Data</p>
        </div>
      </div>
    </footer>
  );
}

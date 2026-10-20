import Link from "next/link";
import type { NepOverviewResponse } from "@/types/budget";
import { cn, formatPesoCompact, formatPesoDelta, formatPesoFull, formatPctDelta } from "@/lib/utils";

export function NepOverview({ meta, data }: NepOverviewResponse) {
  const { national, departments, expense_classes } = data;
  const totals = [
    { label: `FY${meta.baseline_year} enacted`, amount: national.base_amount, proposed: false },
    { label: `FY${meta.fiscal_year} proposed`, amount: national.amount, proposed: true },
  ];
  const canCompare = totals.every(({ amount }) => Number.isFinite(amount) && amount >= 0);
  const maximum = Math.max(...totals.map(({ amount }) => amount));
  const delta = national.amount - national.base_amount;
  const percentage = national.base_amount > 0 ? (delta / national.base_amount) * 100 : null;
  const changes = departments.filter((row) => Number.isFinite(row.delta));
  const increase = changes.filter((row) => row.delta > 0).sort((a, b) => b.delta - a.delta)[0];
  const decrease = changes.filter((row) => row.delta < 0).sort((a, b) => a.delta - b.delta)[0];
  const largestClass = expense_classes
    .filter((row) => Number.isFinite(row.amount) && row.amount > 0)
    .sort((a, b) => b.amount - a.amount)[0];
  const classShare = largestClass && Number.isFinite(national.amount) && national.amount > 0
    ? (largestClass.amount / national.amount) * 100
    : null;
  const takeaways = [
    ...(increase ? [{
      label: "Largest allocation increase",
      name: increase.description,
      value: formatPesoDelta(increase.delta),
      href: "#movers-heading",
    }] : []),
    ...(decrease ? [{
      label: "Largest allocation decrease",
      name: decrease.description,
      value: formatPesoDelta(decrease.delta),
      href: "#movers-heading",
    }] : []),
    ...(largestClass && classShare !== null ? [{
      label: "Largest expense class",
      name: largestClass.description ?? largestClass.code,
      value: `${classShare.toFixed(1)}% of proposed total`,
      href: "#expense-classes-heading",
    }] : []),
  ];

  return (
    <section aria-labelledby="proposal-overview-heading" className="mt-7 rounded-xl border border-line bg-white p-5 sm:p-6">
      <h2 id="proposal-overview-heading" className="scroll-mt-24 text-lg font-bold text-ink">
        The proposal at a glance
      </h2>
      <div className="mt-5 grid min-w-0 gap-7 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-10">
        <figure className="min-w-0">
          <figcaption className="text-sm font-semibold text-ink">National budget comparison</figcaption>
          {canCompare ? (
            <>
              <dl className="mt-5 space-y-5">
                {totals.map(({ label, amount, proposed }) => (
                  <div key={label}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <dt className="text-sm text-ink">{label}</dt>
                      <dd className="text-xl font-bold tabular-nums text-ink">
                        <data value={amount} title={formatPesoFull(amount)}>
                          {formatPesoCompact(amount)}
                          <span className="sr-only"> ({formatPesoFull(amount)})</span>
                        </data>
                      </dd>
                    </div>
                    <div aria-hidden="true" className="mt-2 h-5 overflow-hidden rounded bg-surface">
                      <div
                        className={cn("h-full rounded", proposed ? "bg-brand-700" : "bg-slate-500")}
                        style={{ width: `${maximum > 0 ? (amount / maximum) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </dl>
              <p className="mt-5 text-sm leading-6 text-ink">
                <strong className="font-semibold tabular-nums">{formatPesoDelta(delta)}</strong>
                {percentage !== null && <span className="tabular-nums"> ({formatPctDelta(percentage)})</span>}
                {" "}compared with the enacted budget.
                {percentage === null && <span className="block text-muted">Percentage change is unavailable with a zero baseline.</span>}
              </p>
              <p className="mt-2 text-xs leading-5 text-muted">Bars start at zero. T = trillion; B = billion. All amounts are Philippine pesos.</p>
            </>
          ) : (
            <p className="mt-4 text-sm text-muted">National totals are unavailable for comparison in this source response.</p>
          )}
        </figure>

        <div className="min-w-0 border-t border-line pt-5 lg:border-t-0 lg:border-l lg:pl-7 lg:pt-0">
          <h3 className="text-sm font-semibold text-ink">What stands out</h3>
          {takeaways.length > 0 ? (
            <ul className="mt-1 divide-y divide-line">
              {takeaways.map(({ label, name, value, href }) => (
                <li key={label} className="py-3 first:pt-3 last:pb-0">
                  <p className="text-xs text-muted">{label}</p>
                  <Link href={href} className="mt-1 inline-block text-sm font-semibold leading-5 text-ink underline decoration-line underline-offset-4 hover:text-brand-700 hover:decoration-brand-700">
                    {name}
                  </Link>
                  <p className="mt-1 text-sm tabular-nums text-brand-700">{value}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">Allocation highlights are unavailable in this source response.</p>
          )}
          <p className="mt-4 text-xs leading-5 text-muted">Changes are in pesos against FY{meta.baseline_year}. Allocation groups include automatic appropriations and special purpose funds.</p>
        </div>
      </div>
    </section>
  );
}

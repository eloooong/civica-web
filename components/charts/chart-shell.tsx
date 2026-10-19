import type { ReactNode } from "react";

/**
 * Figure wrapper shared by every Civica chart: a visible title, a
 * screen-reader summary of what the chart says, and the chart itself marked
 * decorative because the summary and the adjacent tables carry the numbers.
 *
 * Lives here rather than in a page so the budget charts and the comparison
 * chart render the same shell.
 */
export function ChartShell({
  title,
  captionId,
  summary,
  accessibleContent = false,
  contentClassName = "",
  children,
}: {
  title: string;
  captionId: string;
  summary: string;
  accessibleContent?: boolean;
  contentClassName?: string;
  children: ReactNode;
}) {
  return (
    <figure className="flex h-full min-w-0 flex-col rounded-lg border border-line bg-white p-5">
      <figcaption id={captionId} className="text-sm font-bold text-ink">
        {title}
      </figcaption>
      {!accessibleContent && <p className="sr-only">{summary}</p>}
      {/* Bklit charts render aria-hidden SVGs and size themselves. */}
      <div className={`mt-4 min-h-0 flex-1 ${contentClassName}`} aria-hidden={accessibleContent ? undefined : true}>
        {children}
      </div>
    </figure>
  );
}

export default ChartShell;

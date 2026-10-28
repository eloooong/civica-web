import Link from "next/link";
import { AlertTriangle, Inbox } from "lucide-react";
import Loader from "@/components/kokonutui/loader";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-line bg-surface px-6 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-muted">
        <Inbox className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-base font-bold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-6 text-muted">{description}</p>
      {action && <div className="mt-5 [&>a]:inline-flex [&>a]:min-h-11 [&>a]:items-center">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Unable to load data",
  description = "The source may be temporarily unavailable. Please try again.",
  onRetry,
  retryHref,
  sourceOutage,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryHref?: string;
  sourceOutage?: "open-congress-usage-exceeded";
}) {
  return (
    <div
      role="alert"
      data-source-outage={sourceOutage}
      className="flex flex-col items-center rounded-lg border border-red-200 bg-accent-50 px-6 py-12 text-center"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-red-200 bg-white text-accent-600">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-base font-bold text-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-6 text-muted">{description}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 min-h-11 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-black"
        >
          Try again
        </button>
      ) : (
        <Link
          href={retryHref ?? "#main"}
          className="mt-5 inline-flex min-h-11 items-center rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-black"
        >
          Try again
        </Link>
      )}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center rounded-lg border border-line bg-white"
    >
      <Loader className="p-10" size="sm" title={label} />
    </div>
  );
}

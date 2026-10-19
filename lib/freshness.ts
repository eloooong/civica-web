import type { SourceRetrieval } from "@/lib/api/source-cache";

/** Absolute Philippine time, with no dependency on the visitor's locale. */
export function formatRetrievalTime(iso: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T/.test(iso)) return null;
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return null;
  return `${new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(date)} PHT`;
}

export function isRetrievalStale(retrieval: SourceRetrieval, now = Date.now()): boolean {
  return now - Date.parse(retrieval.retrievedAt) > retrieval.cacheSeconds * 1000;
}

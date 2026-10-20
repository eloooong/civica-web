import type { SourceRetrieval } from "@/lib/api/source-cache";

export function buildSourceCitation({
  source,
  dataset,
  endpoint,
  docsUrl,
  requests,
}: {
  source: string;
  dataset: string;
  endpoint: string;
  docsUrl: string;
  requests: readonly SourceRetrieval[];
}): string {
  const records = requests.length > 0
    ? requests.map((request) => `Source: ${request.endpoint} (response retrieved ${request.retrievedAt}).`)
    : [`Source: ${endpoint}. Retrieval timestamp unavailable.`];
  return [source + ".", dataset + ".", ...records, `Documentation: ${docsUrl}.`, "Accessed through Civica."].join(" ");
}

import { SourceAttribution as UiSourceAttribution } from "@/components/ui/SourceAttribution";
import { BUDGET_DOCS_URL, BUDGET_SOURCE_NAME } from "@/lib/api/budget";
import type { SourceRetrieval } from "@/lib/api/source-cache";

/** Each page identifies its dataset instead of inheriting an enacted-budget label. */
export function SourceAttribution({
  endpoint,
  dataset,
  retrievals,
}: {
  endpoint: string;
  dataset: string;
  retrievals?: readonly (SourceRetrieval | null | undefined)[];
}) {
  return (
    <UiSourceAttribution
      source={BUDGET_SOURCE_NAME}
      docsUrl={BUDGET_DOCS_URL}
      endpoint={endpoint}
      dataset={dataset}
      retrievals={retrievals}
    />
  );
}

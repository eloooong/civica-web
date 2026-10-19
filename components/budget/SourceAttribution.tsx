import { SourceAttribution as UiSourceAttribution } from "@/components/ui/SourceAttribution";
import { BUDGET_DOCS_URL, BUDGET_SOURCE_NAME } from "@/lib/api/budget";
import type { SourceRetrieval } from "@/lib/api/source-cache";

/**
 * Budget-flavored source block. Preserves the Phase 2 call signature so
 * existing budget pages keep working unchanged.
 */
export function SourceAttribution({
  endpoint,
  dataset = "General Appropriations Act (GAA), FY2020–2026",
  retrievals,
}: {
  endpoint: string;
  dataset?: string;
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

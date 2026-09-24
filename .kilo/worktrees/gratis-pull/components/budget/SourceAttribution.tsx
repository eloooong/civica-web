import { SourceAttribution as UiSourceAttribution } from "@/components/ui/SourceAttribution";
import { BUDGET_DOCS_URL, BUDGET_SOURCE_NAME } from "@/lib/api/budget";

/**
 * Budget-flavored source block. Preserves the Phase 2 call signature so
 * existing budget pages keep working unchanged.
 */
export function SourceAttribution({
  endpoint,
  dataset = "General Appropriations Act (GAA), FY2020–2026",
  retrievedAt,
}: {
  endpoint: string;
  dataset?: string;
  retrievedAt?: string;
}) {
  return (
    <UiSourceAttribution
      source={BUDGET_SOURCE_NAME}
      docsUrl={BUDGET_DOCS_URL}
      endpoint={endpoint}
      dataset={dataset}
      retrievedAt={retrievedAt}
    />
  );
}

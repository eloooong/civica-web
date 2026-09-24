/** Normalized search result shape for Phase 5 unified search. */

export type SearchResultType = "budget" | "bill" | "person" | "dataset";

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  description?: string;
  agency?: string;
  metadata: Record<string, string | number>;
  url: string;
}

export type SearchCategory = "all" | SearchResultType;

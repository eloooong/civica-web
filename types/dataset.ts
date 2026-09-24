/**
 * Types mirroring the Open Data Portal API
 * (https://data.bettergov.ph, repo bettergovph/open-data-portal,
 * OpenAPI schema at /openapi.json).
 * Community-run catalog of publicly available Philippine datasets.
 */

export interface DataPagination {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
  current_page: number;
  total_pages: number;
}

export interface PublisherRef {
  id: number;
  name: string;
}

export interface CategoryRef {
  id: number;
  name: string;
}

export interface DatasetAttribution {
  author: string | null;
  source_url: string | null;
  attribution_text: string | null;
  license: string | null;
  license_url: string | null;
}

/** A catalog dataset. GET /datasets, /datasets/{id}. */
export interface Dataset {
  id: number;
  name: string;
  description: string | null;
  publisher_id: number | null;
  category_id: number | null;
  /** JSON-encoded string array, e.g. '["elections","comelec"]'. */
  tags: string | null;
  size_bytes: number | null;
  latest_version_date: string | null;
  attribution: DatasetAttribution[] | null;
  license: string | null;
  license_url: string | null;
  publisher: PublisherRef | null;
  category: CategoryRef | null;
  resource_count?: number;
}

/** A downloadable resource. GET /resources?dataset_id=. */
export interface DatasetResource {
  id: number;
  dataset_id: number;
  name: string;
  description: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  download_url: string | null;
  source_url: string | null;
  created_ts: number | null;
  last_mod_ts: number | null;
}

/** A publisher. GET /publishers. */
export interface DataPublisher {
  id: number;
  name: string;
  website_url: string | null;
  created_ts: number | null;
  last_mod_ts: number | null;
}

/** A category. GET /categories. */
export interface DataCategory {
  id: number;
  name: string;
  description: string | null;
  created_ts: number | null;
  last_mod_ts: number | null;
  dataset_count: number;
  resource_count: number;
}

/** GET /stats — platform-wide totals. */
export interface DataStats {
  total_datasets: number;
  total_resources: number;
  total_publishers: number;
  total_categories: number;
  total_size_bytes: number;
}

export type DatasetSort = "name" | "latest_version_date" | "size_bytes";
export type SortDir = "asc" | "desc";

/** First-rows preview of a small text resource (best effort). */
export interface ResourcePreview {
  columns: string[];
  rows: string[][];
  truncated: boolean;
}

/**
 * @deprecated Phase 1 placeholder shape. Kept only so the Phase 1
 * search preview still compiles; data pages use the real API types
 * above. Remove in Phase 5.
 */
export interface DatasetSummary {
  id: string;
  title: string;
  publisher: string;
  category: string;
  updatedAt: string;
  formats: string[];
  description: string;
}

export interface DatasetCategory {
  name: string;
  count: number;
}

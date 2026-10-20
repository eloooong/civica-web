/**
 * Open Data Portal API client (Philippine government datasets catalog).
 *
 * Documented endpoints only — repo bettergovph/open-data-portal,
 * OpenAPI schema at https://data.bettergov.ph/openapi.json:
 * GET /api/v1/datasets, /datasets/{id}, /resources, /publishers,
 * /categories, /stats, /ping.
 *
 * Server-side helpers only (called from Server Components). UI components
 * must never fetch the API directly. Responses are cached for 1 hour.
 */
import type {
  DataCategory,
  DataPagination,
  DataPublisher,
  DataStats,
  Dataset,
  DatasetResource,
  DatasetSort,
  ResourcePreview,
  SortDir,
} from "@/types/dataset";
import { fetchCachedResponse, type RetrievedResponse, type Sourced } from "@/lib/api/source-cache";
import { SOURCE_USER_AGENT } from "@/lib/site";

export const DATA_API_BASE = "https://data.bettergov.ph/api/v1";
export const DATA_PORTAL_URL = "https://data.bettergov.ph";
export const DATA_DOCS_URL = "https://data.bettergov.ph/docs";
export const DATA_SOURCE_NAME = "Open Data Portal (BetterGov.PH)";
export const DATA_REVALIDATE_SECONDS = 3600;

export class DataApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly endpoint: string;

  constructor(status: number, code: string, message: string, endpoint: string) {
    super(message);
    this.name = "DataApiError";
    this.status = status;
    this.code = code;
    this.endpoint = endpoint;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

interface SuccessEnvelope<T> {
  success: true;
  data: T;
  pagination?: DataPagination;
}

interface ErrorEnvelope {
  success: false;
  error?: { code?: string; message?: string; issues?: unknown };
}

async function fetchData<T>(
  path: string,
  params?: Record<string, unknown>
): Promise<Sourced<{ data: T; pagination?: DataPagination }>> {
  const url = new URL(`${DATA_API_BASE}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    }
  }
  const endpoint = url.toString();

  let res: RetrievedResponse;
  try {
    res = await fetchCachedResponse(endpoint, DATA_REVALIDATE_SECONDS);
  } catch {
    throw new DataApiError(
      503,
      "upstream_unreachable",
      "Could not reach the Open Data Portal API. Check your connection and try again.",
      endpoint
    );
  }

  if (!res.ok) {
    let code = "query_failed";
    let message = `Data Portal API request failed (HTTP ${res.status}).`;
    try {
      const body = (await res.json()) as ErrorEnvelope;
      if (body.error?.code) code = body.error.code;
      if (body.error?.message) message = body.error.message;
    } catch {
      // Keep the default message when the error body is not JSON.
    }
    throw new DataApiError(res.status, code, message, endpoint);
  }

  const body = (await res.json()) as SuccessEnvelope<T>;
  return { data: body.data, pagination: body.pagination, retrieval: res.retrieval };
}

/** GET /stats — platform-wide totals. */
export async function getDataStats(): Promise<DataStats> {
  const { data } = await fetchData<DataStats>("/stats");
  return data;
}

export interface ListDatasetsOptions {
  search?: string;
  categoryId?: number;
  publisherId?: number;
  sort?: DatasetSort;
  dir?: SortDir;
  limit?: number;
  offset?: number;
}

/** GET /datasets — search/filter with offset pagination (limit 10–100). */
export function listDatasets(options: ListDatasetsOptions = {}): Promise<Sourced<{
  data: Dataset[];
  pagination?: DataPagination;
}>> {
  return fetchData<Dataset[]>("/datasets", {
    search: options.search,
    category_id: options.categoryId,
    publisher_id: options.publisherId,
    sort: options.sort,
    dir: options.dir,
    limit: options.limit ?? 12,
    offset: options.offset,
  });
}

/** GET /datasets/{id} — one dataset (does not embed resources). */
export async function getDataset(id: number): Promise<Sourced<Dataset>> {
  const { data, retrieval } = await fetchData<Dataset>(`/datasets/${id}`);
  return { ...data, retrieval };
}

/** GET /resources?dataset_id= — downloadable files for one dataset. */
export async function listResources(
  datasetId: number,
  limit = 50
): Promise<Sourced<{ data: DatasetResource[]; pagination?: DataPagination }>> {
  return fetchData<DatasetResource[]>("/resources", { dataset_id: datasetId, limit });
}

/** GET /categories — all categories. */
export async function listCategories(): Promise<DataCategory[]> {
  const { data } = await fetchData<DataCategory[]>("/categories");
  return data;
}

/** GET /publishers — all publishers (API requires limit >= 10). */
export async function listPublishers(): Promise<DataPublisher[]> {
  const { data } = await fetchData<DataPublisher[]>("/publishers", { limit: 100 });
  return data;
}

// ---------------------------------------------------------------------------
// Best-effort first-rows preview for small plain-text resources.
// The source API exposes no preview endpoint, so this fetches the first
// bytes of the file directly. Only attempted for small (<=512KB) CSV/text
// resources; anything else returns null and the UI shows download links.
// ---------------------------------------------------------------------------

const PREVIEW_MAX_BYTES = 512 * 1024;
const PREVIEW_FETCH_BYTES = 48 * 1024;
const PREVIEW_MAX_ROWS = 50;
const PREVIEW_MAX_COLS = 10;

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === undefined) break;
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      if (rows.length > PREVIEW_MAX_ROWS + 1) break;
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function isPreviewable(resource: DatasetResource): boolean {
  if (!resource.download_url) return false;
  if ((resource.size_bytes ?? Number.MAX_SAFE_INTEGER) > PREVIEW_MAX_BYTES) return false;
  const mime = (resource.mime_type ?? "").toLowerCase();
  const url = resource.download_url.toLowerCase();
  if (mime.includes("gzip") || mime.includes("zip") || url.endsWith(".gz") || url.endsWith(".zip")) {
    return false;
  }
  return mime.includes("csv") || mime.startsWith("text/") || url.endsWith(".csv") || url.endsWith(".txt");
}

/** Fetch and parse the first rows of a small text resource. Null when unavailable. */
export async function getResourcePreview(resource: DatasetResource): Promise<ResourcePreview | null> {
  if (!isPreviewable(resource) || !resource.download_url) return null;
  try {
    const res = await fetch(resource.download_url, {
      headers: {
        Range: `bytes=0-${PREVIEW_FETCH_BYTES - 1}`,
        "User-Agent": SOURCE_USER_AGENT,
      },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: DATA_REVALIDATE_SECONDS },
    });
    if (!res.ok && res.status !== 206) return null;
    const text = await res.text();
    if (!text || text.length === 0) return null;
    const parsed = parseCsv(text);
    if (parsed.length < 2) return null;
    const [header, ...body] = parsed as [string[], ...string[][]];
    const columns = header.slice(0, PREVIEW_MAX_COLS);
    const rows = body.slice(0, PREVIEW_MAX_ROWS).map((r) => r.slice(0, PREVIEW_MAX_COLS));
    return { columns, rows, truncated: body.length >= PREVIEW_MAX_ROWS };
  } catch {
    return null;
  }
}

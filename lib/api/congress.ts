/**
 * Open Congress API client (Philippine legislative data).
 *
 * Documented endpoints only — OpenAPI spec at
 * https://open-congress-api.bettergov.ph/api/doc (routes: /congresses,
 * /people, /documents, /search/*, /stats).
 *
 * Server-side helpers only (called from Server Components). UI components
 * must never fetch the API directly. Responses are cached for 1 hour —
 * the dataset is manually encoded and changes infrequently.
 */
import type {
  BillDocument,
  ChamberGroup,
  CongressSession,
  CongressStats,
  Legislator,
  Pagination,
} from "@/types/congress";

export const CONGRESS_API_BASE = "https://open-congress-api.bettergov.ph/api";
export const CONGRESS_DOCS_URL = "https://open-congress-api.bettergov.ph/api/scalar";
export const CONGRESS_SOURCE_NAME = "Open Congress API (BetterGov.PH)";
export const CONGRESS_REVALIDATE_SECONDS = 3600;

export class CongressApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly endpoint: string;

  constructor(status: number, code: string, message: string, endpoint: string) {
    super(message);
    this.name = "CongressApiError";
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
  pagination?: Pagination;
}

interface ErrorEnvelope {
  success: false;
  error?: { code?: string; message?: string };
}

async function fetchCongress<T>(
  path: string,
  params?: Record<string, unknown>
): Promise<{ data: T; pagination?: Pagination }> {
  const url = new URL(`${CONGRESS_API_BASE}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    }
  }
  const endpoint = url.toString();

  let res: Response;
  try {
    res = await fetch(endpoint, {
      next: { revalidate: CONGRESS_REVALIDATE_SECONDS },
      headers: { "User-Agent": "Civica-PH/1.0 (+https://civica.ph)" },
    });
  } catch {
    throw new CongressApiError(
      503,
      "upstream_unreachable",
      "Could not reach the Open Congress API. Check your connection and try again.",
      endpoint
    );
  }

  if (!res.ok) {
    let code = "query_failed";
    let message = `Congress API request failed (HTTP ${res.status}).`;
    try {
      const body = (await res.json()) as ErrorEnvelope;
      if (body.error?.code) code = body.error.code;
      if (body.error?.message) message = body.error.message;
    } catch {
      // Keep the default message when the error body is not JSON.
    }
    throw new CongressApiError(res.status, code, message, endpoint);
  }

  const body = (await res.json()) as SuccessEnvelope<T>;
  return { data: body.data, pagination: body.pagination };
}

/** GET /stats — database-wide totals and per-congress bill counts. */
export async function getCongressStats(): Promise<CongressStats> {
  const { data } = await fetchCongress<CongressStats>("/stats");
  return data;
}

/** GET /congresses — congressional sessions, newest first. */
export async function listCongresses(limit = 20): Promise<CongressSession[]> {
  const { data } = await fetchCongress<CongressSession[]>("/congresses", { limit });
  return data;
}

export interface ListDocumentsOptions {
  congress?: number;
  /** HB = House bill, SB = Senate bill. */
  type?: string;
  scope?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sort?: string;
  dir?: "asc" | "desc";
}

/** GET /documents — browse/filter bills with offset pagination. */
export function listDocuments(options: ListDocumentsOptions = {}): Promise<{
  data: BillDocument[];
  pagination?: Pagination;
}> {
  return fetchCongress<BillDocument[]>("/documents", {
    congress: options.congress,
    type: options.type,
    scope: options.scope,
    search: options.search,
    limit: options.limit,
    offset: options.offset,
    sort: options.sort,
    dir: options.dir,
  });
}

export interface SearchDocumentsOptions {
  q: string;
  congress?: number;
  scope?: string;
  subtype?: string;
  limit?: number;
  offset?: number;
}

/** GET /search/documents — full-text bill search. */
export function searchDocuments(options: SearchDocumentsOptions): Promise<{
  data: BillDocument[];
  pagination?: Pagination;
}> {
  const { q, ...rest } = options;
  return fetchCongress<BillDocument[]>("/search/documents", { q, ...rest });
}

/** GET /documents/{id} — one bill with embedded authors. */
export async function getDocument(id: string): Promise<BillDocument> {
  const { data } = await fetchCongress<BillDocument>(`/documents/${encodeURIComponent(id)}`);
  return data;
}

/** GET /documents/{id}/authors — bill authors. */
export async function getDocumentAuthors(id: string): Promise<Legislator[]> {
  const { data } = await fetchCongress<Legislator[]>(`/documents/${encodeURIComponent(id)}/authors`);
  return data;
}

export interface ListPeopleOptions {
  type?: string;
  congress?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

/** GET /people — browse/filter legislators. */
export function listPeople(options: ListPeopleOptions = {}): Promise<{
  data: Legislator[];
  pagination?: Pagination;
}> {
  return fetchCongress<Legislator[]>("/people", {
    type: options.type,
    congress: options.congress,
    search: options.search,
    limit: options.limit,
    offset: options.offset,
  });
}

/** GET /search/people — full-text legislator search. */
export function searchPeople(
  q: string,
  options: { type?: string; congress?: number; limit?: number; offset?: number } = {}
): Promise<{ data: Legislator[]; pagination?: Pagination }> {
  return fetchCongress<Legislator[]>("/search/people", { q, ...options });
}

/** GET /people/{id} — legislator profile with congresses served. */
export async function getPerson(id: string): Promise<Legislator> {
  const { data } = await fetchCongress<Legislator>(`/people/${encodeURIComponent(id)}`, {
    include_congresses: "true",
  });
  return data;
}

/** GET /people/{id}/groups — chamber memberships. */
export async function getPersonGroups(id: string): Promise<ChamberGroup[]> {
  const { data } = await fetchCongress<ChamberGroup[]>(`/people/${encodeURIComponent(id)}/groups`);
  return data;
}

/** GET /people/{id}/documents — bills authored, offset-paginated. */
export function getPersonDocuments(
  id: string,
  options: { congress?: number; type?: string; limit?: number; offset?: number } = {}
): Promise<{ data: BillDocument[]; pagination?: Pagination }> {
  return fetchCongress<BillDocument[]>(`/people/${encodeURIComponent(id)}/documents`, options);
}

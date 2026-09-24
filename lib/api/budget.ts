/**
 * BetterGov.PH Budget API client.
 *
 * Documented endpoints only — see https://budget.bettergov.ph/docs.
 * Base URL: https://budget.bettergov.ph/api/v1 (GAA FY2020–2026, no auth, open CORS).
 *
 * All functions are server-side helpers (called from Server Components / Route
 * Handlers). UI components must never fetch the API directly.
 * Responses are cached for 1 hour (the API itself edge-caches for 1h s-maxage
 * and its data changes at most a few times a year).
 */
import {
  isBudgetFiscalYear,
  type BudgetFiscalYear,
  type ExpenseClassesResponse,
  type GaaDepartmentResponse,
  type GaaDepartmentsResponse,
  type GaaNationalResponse,
  type GaaYearResponse,
  type ProgramsResponse,
} from "@/types/budget";

export const BUDGET_API_BASE = "https://budget.bettergov.ph/api/v1";
export const BUDGET_DOCS_URL = "https://budget.bettergov.ph/docs";
export const BUDGET_SOURCE_NAME = "BetterGov.PH Budget API";
export const BUDGET_REVALIDATE_SECONDS = 3600;

export class BudgetApiError extends Error {
  readonly status: number;
  readonly slug: string;
  readonly endpoint: string;

  constructor(status: number, slug: string, message: string, endpoint: string) {
    super(message);
    this.name = "BudgetApiError";
    this.status = status;
    this.slug = slug;
    this.endpoint = endpoint;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

async function fetchBudget<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(`${BUDGET_API_BASE}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }
  }
  const endpoint = url.toString();

  let res: Response;
  try {
    res = await fetch(endpoint, {
      next: { revalidate: BUDGET_REVALIDATE_SECONDS },
      headers: { "User-Agent": "CivicLens-PH/1.0 (+https://civiclens.ph)" },
    });
  } catch {
    throw new BudgetApiError(
      503,
      "upstream_unreachable",
      "Could not reach the BetterGov.PH Budget API. Check your connection and try again.",
      endpoint
    );
  }

  if (!res.ok) {
    let slug = "query_failed";
    let message = `Budget API request failed (HTTP ${res.status}).`;
    try {
      const body = (await res.json()) as { error?: string; message?: string };
      if (body.error) slug = body.error;
      if (body.message) message = body.message;
    } catch {
      // Keep the default message when the error body is not JSON.
    }
    throw new BudgetApiError(res.status, slug, message, endpoint);
  }

  return (await res.json()) as T;
}

/** GET /gaa — national totals per fiscal year (2020–2026). */
export function getNationalTotals(): Promise<GaaNationalResponse> {
  return fetchBudget<GaaNationalResponse>("/gaa");
}

/** GET /gaa/years/{year} — national total + every department's share for one year. */
export function getYearBreakdown(year: number): Promise<GaaYearResponse> {
  if (!isBudgetFiscalYear(year)) {
    throw new BudgetApiError(
      400,
      "bad_request",
      `Fiscal year must be between 2020 and 2026. Received: ${year}.`,
      `${BUDGET_API_BASE}/gaa/years/${year}`
    );
  }
  return fetchBudget<GaaYearResponse>(`/gaa/years/${year satisfies BudgetFiscalYear}`);
}

/** GET /gaa/departments — all departments with per-year figures. */
export function getDepartments(): Promise<GaaDepartmentsResponse> {
  return fetchBudget<GaaDepartmentsResponse>("/gaa/departments");
}

/** GET /gaa/departments/{id} — department detail (yearly totals, agencies, expense classes). */
export function getDepartment(id: string): Promise<GaaDepartmentResponse> {
  return fetchBudget<GaaDepartmentResponse>(`/gaa/departments/${encodeURIComponent(id)}`);
}

/** GET /gaa/departments/{id}/expense-classes — PS / MOOE / FinEx / CO per year. */
export function getExpenseClasses(id: string): Promise<ExpenseClassesResponse> {
  return fetchBudget<ExpenseClassesResponse>(`/gaa/departments/${encodeURIComponent(id)}/expense-classes`);
}

export interface GetProgramsOptions {
  year?: number;
  q?: string;
  agencyId?: string;
  limit?: number;
  cursor?: string;
}

/** GET /gaa/departments/{id}/programs — P/A/P families ranked by appropriation. */
export function getPrograms(id: string, options: GetProgramsOptions = {}): Promise<ProgramsResponse> {
  const params: Record<string, string | number> = {};
  if (options.year !== undefined) {
    if (!isBudgetFiscalYear(options.year)) {
      throw new BudgetApiError(
        400,
        "bad_request",
        `Fiscal year must be between 2020 and 2026. Received: ${options.year}.`,
        `${BUDGET_API_BASE}/gaa/departments/${id}/programs`
      );
    }
    params.year = options.year;
  }
  if (options.q) params.q = options.q;
  if (options.agencyId) params.agency_id = options.agencyId;
  if (options.limit !== undefined) params.limit = options.limit;
  if (options.cursor) params.cursor = options.cursor;
  return fetchBudget<ProgramsResponse>(`/gaa/departments/${encodeURIComponent(id)}/programs`, params);
}

export interface SearchProgramsOptions {
  q: string;
  year?: number;
  departmentId?: string;
  limit?: number;
}

/** GET /gaa/search — program-name search across all departments. */
export function searchPrograms(options: SearchProgramsOptions): Promise<ProgramsResponse> {
  const params: Record<string, string | number> = { q: options.q };
  if (options.year !== undefined) params.year = options.year;
  if (options.departmentId) params.department_id = options.departmentId;
  if (options.limit !== undefined) params.limit = options.limit;
  return fetchBudget<ProgramsResponse>("/gaa/search", params);
}

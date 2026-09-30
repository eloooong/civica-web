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
  type ChildrenResponse,
  type CycleDepartmentResponse,
  type CycleManifestResponse,
  type ExpenseClassesResponse,
  type GaaChildLevel,
  type GaaDepartmentResponse,
  type GaaDepartmentsResponse,
  type GaaNationalResponse,
  type GaaYearResponse,
  type HierarchyRow,
  type HearingTopicResponse,
  type HearingsSearchResponse,
  type NepDimension,
  type NepOverviewResponse,
  type NepRollupsResponse,
  type ObjectRow,
  type ObjectsResponse,
  type ProgramRow,
  type ProgramsResponse,
} from "@/types/budget";
import { slugify } from "@/lib/utils";

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

export interface GetChildrenOptions {
  level: GaaChildLevel;
  parent?: string;
  includeZero?: boolean;
  limit?: number;
  cursor?: string;
}

/** GET /gaa/years/{year}/departments/{id}/children — one level of the GAA hierarchy. */
export function getChildren(
  year: number,
  departmentId: string,
  options: GetChildrenOptions
): Promise<ChildrenResponse> {
  const params: Record<string, string | number> = {
    level: options.level,
    limit: options.limit ?? 100,
  };
  if (options.parent) params.parent = options.parent;
  if (options.includeZero) params.include_zero = 1;
  if (options.cursor) params.cursor = options.cursor;
  return fetchBudget<ChildrenResponse>(
    `/gaa/years/${year}/departments/${encodeURIComponent(departmentId)}/children`,
    params
  );
}

export interface GetObjectsOptions {
  year?: number;
  agencyId?: string;
  expenseClass?: string;
  sort?: "amount" | "description" | "code" | "total";
  dir?: "asc" | "desc";
  limit?: number;
  cursor?: string;
}

/** GET /gaa/departments/{id}/objects — UACS object-level line items. */
export function getObjects(
  departmentId: string,
  options: GetObjectsOptions = {}
): Promise<ObjectsResponse> {
  const params: Record<string, string | number> = {};
  if (options.year !== undefined) params.year = options.year;
  if (options.agencyId) params.agency_id = options.agencyId;
  if (options.expenseClass) params.expense_class = options.expenseClass;
  if (options.sort) params.sort = options.sort;
  if (options.dir) params.dir = options.dir;
  if (options.limit !== undefined) params.limit = options.limit;
  if (options.cursor) params.cursor = options.cursor;
  return fetchBudget<ObjectsResponse>(
    `/gaa/departments/${encodeURIComponent(departmentId)}/objects`,
    params
  );
}

/**
 * GET /hearings/search — keyword search over House budget-hearing topic
 * records (FY2027 season). All terms must match.
 */
export function searchHearings(
  q: string,
  options: { agency?: string; limit?: number } = {}
): Promise<HearingsSearchResponse> {
  const params: Record<string, string | number> = { q, limit: options.limit ?? 5 };
  if (options.agency) params.agency = options.agency;
  return fetchBudget<HearingsSearchResponse>("/hearings/search", params);
}

/** GET /hearings/{video_id}/topics/{index} — full deliberation record. */
export function getHearingTopic(videoId: string, index: number): Promise<HearingTopicResponse> {
  return fetchBudget<HearingTopicResponse>(
    `/hearings/${encodeURIComponent(videoId)}/topics/${index}`
  );
}

/** GET /nep/2027 — FY2027 proposal at national level, with FY2026 baseline. */
export function getNepOverview(): Promise<NepOverviewResponse> {
  return fetchBudget<NepOverviewResponse>("/nep/2027");
}

/** GET /nep/2027/rollups/{dimension} — one dimension rolled up nationally. */
export function getNepRollups(
  dimension: NepDimension,
  options: { limit?: number } = {}
): Promise<NepRollupsResponse> {
  const params: Record<string, string | number> = {};
  if (options.limit !== undefined) params.limit = options.limit;
  return fetchBudget<NepRollupsResponse>(`/nep/2027/rollups/${dimension}`, params);
}

/** GET /budget-cycle — coverage manifest: subjects, years, stages. */
export function getBudgetCycle(): Promise<CycleManifestResponse> {
  return fetchBudget<CycleManifestResponse>("/budget-cycle");
}

/** GET /budget-cycle/departments/{id} — programs and facts for one subject. */
export function getBudgetCycleDepartment(id: string): Promise<CycleDepartmentResponse> {
  return fetchBudget<CycleDepartmentResponse>(
    `/budget-cycle/departments/${encodeURIComponent(id)}`
  );
}

/** Bounded scan sizes for slug resolution (largest first, early exit). */
const SCAN_MAX_PAGES = 6;
const SCAN_PAGE_SIZE = 500;
const HIERARCHY_PAGE_SIZE = 50;
const MAX_HIERARCHY_UNITS = 3;
const MAX_HIERARCHY_FUNDS = 6;
const VALID_EXPENSE_CLASSES = new Set(["1", "2", "3", "6"]);

/**
 * Resolve a program's hierarchy row (FPAP id) from an agency+slug URL.
 * Scans the agency's P/A/P rows ranked by the year's amount, so large
 * programs resolve on the first page. Returns null past the page cap.
 */
export async function findFpapBySlug(
  departmentId: string,
  agencyId: string,
  slug: string,
  year: number
): Promise<HierarchyRow | null> {
  let cursor: string | undefined;
  for (let page = 0; page < SCAN_MAX_PAGES; page++) {
    const res = await getChildren(year, departmentId, {
      level: "fpaps",
      parent: agencyId,
      limit: SCAN_PAGE_SIZE,
      cursor,
    });
    const hit = res.data.find((row) => slugify(row.description) === slug);
    if (hit) return hit;
    if (!res.next_cursor) return null;
    cursor = res.next_cursor;
  }
  return null;
}

/** Resolve a program family (name + 7-year figures) from an agency+slug URL. */
export async function findFamilyBySlug(
  departmentId: string,
  agencyId: string,
  slug: string,
  year: number
): Promise<ProgramRow | null> {
  let cursor: string | undefined;
  for (let page = 0; page < SCAN_MAX_PAGES; page++) {
    const res = await getPrograms(departmentId, {
      year,
      agencyId,
      limit: SCAN_PAGE_SIZE,
      cursor,
    });
    const hit = res.data.find((row) => slugify(row.name) === slug);
    if (hit) return hit;
    if (!res.next_cursor) return null;
    cursor = res.next_cursor;
  }
  return null;
}

/** Object-level rows belonging to one program, per expense class. */
export async function findObjectsForFpap(
  departmentId: string,
  agencyId: string,
  expenseClass: string,
  fpapId: string,
  year: number
): Promise<ObjectRow[]> {
  const res = await getObjects(departmentId, {
    year,
    agencyId,
    expenseClass,
    sort: "amount",
    dir: "desc",
    limit: SCAN_PAGE_SIZE,
  });
  return res.data.filter((row) => row.fpap_id === fpapId);
}

export interface ProgramHierarchy {
  operatingUnits: HierarchyRow[];
  funds: HierarchyRow[];
  expenses: HierarchyRow[];
}

function dedupeRows(rows: HierarchyRow[]): HierarchyRow[] {
  const seen = new Set<string>();
  const out: HierarchyRow[] = [];
  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row);
  }
  return out;
}

/**
 * Walk program → operating unit → fund → expense class for one year.
 * Bounded: at most 3 operating units and 6 funds are expanded.
 */
export async function getProgramHierarchy(
  year: number,
  departmentId: string,
  fpapId: string
): Promise<ProgramHierarchy> {
  const unitsRes = await getChildren(year, departmentId, {
    level: "operating_units",
    parent: fpapId,
    limit: HIERARCHY_PAGE_SIZE,
  });
  const operatingUnits = unitsRes.data;
  const fundResults = await Promise.all(
    operatingUnits.slice(0, MAX_HIERARCHY_UNITS).map((unit) =>
      getChildren(year, departmentId, {
        level: "fund_subcategories",
        parent: unit.id,
        limit: HIERARCHY_PAGE_SIZE,
      })
    )
  );
  const funds = dedupeRows(fundResults.flatMap((r) => r.data));
  const expenseResults = await Promise.all(
    funds.slice(0, MAX_HIERARCHY_FUNDS).map((fund) =>
      getChildren(year, departmentId, {
        level: "expenses",
        parent: fund.id,
        limit: HIERARCHY_PAGE_SIZE,
      })
    )
  );
  return { operatingUnits, funds, expenses: dedupeRows(expenseResults.flatMap((r) => r.data)) };
}

/** Object rows for a program across up to three expense classes. */
export async function findObjectsForProgram(
  departmentId: string,
  agencyId: string,
  fpapId: string,
  expenses: HierarchyRow[],
  year: number
): Promise<ObjectRow[]> {
  const classes = [
    ...new Set(
      expenses
        .map((row) => row.expense_code ?? "")
        .filter((code) => VALID_EXPENSE_CLASSES.has(code))
    ),
  ].slice(0, 3);
  if (classes.length === 0) return [];
  const lists = await Promise.all(
    classes.map((code) => findObjectsForFpap(departmentId, agencyId, code, fpapId, year))
  );
  return lists.flat();
}

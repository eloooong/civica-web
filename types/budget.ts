/**
 * Types mirroring the public BetterGov.PH Budget API
 * (https://budget.bettergov.ph/docs, base URL https://budget.bettergov.ph/api/v1).
 * GAA = enacted General Appropriations Act, FY2020–2026. All amounts are exact PHP pesos.
 */

export const BUDGET_FISCAL_YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026] as const;
export type BudgetFiscalYear = (typeof BUDGET_FISCAL_YEARS)[number];

export function isBudgetFiscalYear(value: number): value is BudgetFiscalYear {
  return (BUDGET_FISCAL_YEARS as readonly number[]).includes(value);
}

export interface YearFigure {
  count: number;
  amount: number;
}

export type YearMap = Record<string, YearFigure>;

export interface NationalYearTotal {
  year: number;
  line_items: number;
  amount: number;
}

/** GET /gaa — national totals per fiscal year. */
export interface GaaNationalResponse {
  meta: {
    dataset: "gaa";
    years: number[];
    currency: "PHP";
    scale: "pesos";
    departments: number;
  };
  data: NationalYearTotal[];
}

/** One department row from GET /gaa/departments or /gaa/years/{year}. */
export interface DepartmentRow {
  id: string;
  slug: string;
  description: string;
  /** Present on /gaa/years/{year} rows. */
  year?: number;
  line_items?: number;
  amount?: number;
  /** Share of the year's national total (0–1). Present on /gaa/years/{year} rows. */
  share?: number;
  /** Present on /gaa/departments rows (all seven years). */
  years?: YearMap;
}

/** GET /gaa/departments — all departments with per-year figures. */
export interface GaaDepartmentsResponse {
  meta: {
    dataset: "gaa";
    currency: "PHP";
    scale: "pesos";
    [key: string]: unknown;
  };
  data: DepartmentRow[];
}

/** GET /gaa/years/{year} — one fiscal year in isolation. */
export interface GaaYearResponse {
  meta: {
    dataset: "gaa";
    year: number;
    currency: "PHP";
    scale: "pesos";
    departments: number;
    [key: string]: unknown;
  };
  data: {
    total: NationalYearTotal;
    departments: DepartmentRow[];
  };
}

export interface AgencyRow {
  id: string;
  slug: string;
  agency_code: string;
  description: string;
  department_id: string;
  years: YearMap;
}

export interface ExpenseClassRow {
  expense_code: string;
  label: string;
  years: YearMap;
}

/** GET /gaa/departments/{id} — department detail. */
export interface DepartmentDetail {
  department: {
    id: string;
    slug: string;
    description: string;
    years: YearMap;
  };
  yearly_totals: NationalYearTotal[];
  agencies: AgencyRow[];
  expense_classes: ExpenseClassRow[];
}

export interface GaaDepartmentResponse {
  meta: {
    dataset: "gaa";
    currency: "PHP";
    scale: "pesos";
    department_id: string;
    [key: string]: unknown;
  };
  data: DepartmentDetail;
}

/** GET /gaa/departments/{id}/expense-classes — PS / MOOE / FinEx / CO per year. */
export interface ExpenseClassesResponse {
  meta: {
    dataset: "gaa";
    currency: "PHP";
    scale: "pesos";
    department_id: string;
    [key: string]: unknown;
  };
  data: ExpenseClassRow[];
}

/** One program/activity/project family from /programs or /gaa/search. */
export interface ProgramRow {
  department_id: string;
  agency_id: string;
  fam_key: string;
  name: string;
  ids_count: number;
  department?: string;
  years: YearMap;
}

/** GET /gaa/departments/{id}/programs and GET /gaa/search. */
export interface ProgramsResponse {
  meta: {
    dataset: "gaa";
    currency: "PHP";
    scale: "pesos";
    year: number;
    limit: number;
    matched?: number;
    matched_amount?: number;
    returned?: number;
    [key: string]: unknown;
  };
  data: ProgramRow[];
  next_cursor: string | null;
}

/** Hierarchy levels served by GET /gaa/years/{year}/departments/{id}/children. */
export type GaaChildLevel =
  | "agencies"
  | "fpaps"
  | "operating_units"
  | "fund_subcategories"
  | "expenses";

/**
 * One row from the per-year hierarchy walk. Rows keep their parent-id
 * columns so each row's id feeds the next level's parent. Code columns
 * (fpap_code, operunit_code, fund_code, expense_code) appear only on
 * their own level.
 */
export interface HierarchyRow {
  id: string;
  slug: string;
  description: string;
  department_id: string;
  year: number;
  line_items: number;
  amount: number;
  agency_id?: string;
  fpap_id?: string;
  operating_unit_id?: string;
  fund_id?: string;
  fpap_code?: string;
  operunit_code?: string;
  fund_code?: string;
  expense_code?: string;
}

/** GET /gaa/years/{year}/departments/{id}/children. */
export interface ChildrenResponse {
  meta: {
    dataset: "gaa";
    currency: "PHP";
    scale: "pesos";
    year: number;
    department_id: string;
    level: GaaChildLevel;
    parent?: string;
    limit: number;
    matched?: number;
    matched_amount?: number;
    [key: string]: unknown;
  };
  data: HierarchyRow[];
  next_cursor: string | null;
}

/** One UACS object-level row from GET /gaa/departments/{id}/objects. */
export interface ObjectRow {
  id: string;
  slug: string;
  object_code: string;
  description: string;
  department_id: string;
  expense_id: string;
  fund_id: string;
  operating_unit_id: string;
  fpap_id: string;
  agency_id: string;
  years: YearMap;
}

/** GET /gaa/departments/{id}/objects. */
export interface ObjectsResponse {
  meta: {
    dataset: "gaa";
    currency: "PHP";
    scale: "pesos";
    year: number;
    department_id: string;
    limit: number;
    matched?: number;
    matched_amount?: number;
    [key: string]: unknown;
  };
  data: ObjectRow[];
  next_cursor: string | null;
}

/** Hearing metadata on a /hearings/search hit. */
export interface HearingSummary {
  video_id: string;
  title: string;
  agency: string | null;
  hearing_date: string;
  fiscal_year: string;
  page_url: string;
}

/** One deliberation topic on a /hearings/search hit. */
export interface HearingTopic {
  video_id: string;
  index: number;
  topic: string;
  status: string;
  summary: string;
  first_seconds: number;
  timestamp: string;
  url: string;
  moment_count: number;
}

/** One timestamped spoken line that matched the query terms. */
export interface HearingMoment {
  seconds: number;
  timestamp: string;
  speaker?: string;
  side?: string;
  kind?: string;
  said: string;
  url: string;
}

/** One hit from GET /hearings/search. */
export interface HearingSearchHit {
  hearing: HearingSummary;
  topic: HearingTopic;
  matching_moments: HearingMoment[];
}

/** GET /hearings/search. */
export interface HearingsSearchResponse {
  meta: {
    dataset: "hearings";
    q: string;
    terms: string[];
    limit: number;
    returned: number;
    note: string;
    [key: string]: unknown;
  };
  data: HearingSearchHit[];
}

export interface BudgetApiError {
  error: string;
  message: string;
}

/** Normalized summary used by the explorer UI. */
export interface BudgetSummary {
  fiscalYear: number;
  total: number;
  lineItems: number;
  departmentCount: number;
  source: string;
}

/**
 * @deprecated Phase 1 placeholder shape. Kept only so the Phase 1
 * search/congress/data previews still compile; budget pages use the
 * real API types above. Remove in Phase 5.
 */
export interface AgencySummary {
  id: string;
  name: string;
  acronym: string;
  fiscalYear: number;
  amount: number;
  changePercent?: number;
  programs?: number;
}

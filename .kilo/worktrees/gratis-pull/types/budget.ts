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

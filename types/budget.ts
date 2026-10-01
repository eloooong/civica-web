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

/**
 * House Committee on Appropriations budget hearings (FY2027 season).
 * One row per hearing stream. The list endpoint reports limit, offset, and
 * returned but no whole-result total, so index pages filter and paginate the
 * fetched array rather than reading a total from meta.
 */

export interface HearingListRow {
  video_id: string;
  title: string;
  agency: string | null;
  fiscal_year: string;
  hearing_date: string;
  duration_seconds: number;
  length_text: string | null;
  youtube_url: string;
  page_url: string;
  has_transcript: boolean;
  transcript_source: string | null;
  has_record: boolean;
  record_method: string | null;
  /** Null when the hearing has no topic record at all. */
  topic_count: number | null;
  has_brief: boolean;
  status: string | null;
  updated_at: string | null;
}

/** GET /hearings. */
export interface HearingsListResponse {
  meta: {
    dataset: "hearings";
    currency: string;
    scale: string;
    limit: number;
    offset: number;
    returned: number;
    note: string;
    [key: string]: unknown;
  };
  data: HearingListRow[];
}

/** GET /hearings/{video_id} — hearing metadata plus its topic index. */
export interface HearingDetailResponse {
  meta: {
    dataset: "hearings";
    currency: string;
    scale: string;
    note?: string;
    [key: string]: unknown;
  };
  data: Omit<HearingListRow, "has_brief" | "links"> & {
    links?: Record<string, string>;
    topics: HearingTopic[];
  };
}

/** One speaker named in a hearing timeline, with the confidence of the match. */
export interface HearingSpeaker {
  label: string | null;
  name: string | null;
  role: string | null;
  side: string | null;
  confidence: string | null;
}

/** One question and answer inside a timeline section. */
export interface HearingTimelineExchange {
  asked_by: string | null;
  question: string;
  answered_by: string | null;
  answer: string | null;
  outcome: string | null;
  seconds: number;
  timestamp: string;
  url: string;
}

/**
 * One contiguous section of a hearing: roll call, presentation, an
 * interpellation, a motion, a suspension. Sections carry their own exchanges,
 * figures, and actions, so this payload is large (about 250 KB for a seven
 * hour hearing) and is loaded on its own route.
 */
export interface HearingTimelineSection {
  index: number;
  start_seconds: number;
  end_seconds: number;
  start: string;
  end: string;
  kind: string;
  title: string | null;
  summary: string | null;
  participants: string[] | null;
  topics: string[] | null;
  exchanges: HearingTimelineExchange[] | null;
  figures: HearingFigure[] | null;
  actions: HearingAction[] | null;
  url: string;
}

/** GET /hearings/{video_id}/timeline. */
export interface HearingTimelineResponse {
  meta: {
    dataset: "hearings";
    video_id: string;
    title: string;
    agency: string | null;
    hearing_date: string;
    sections: number;
    generated_at: string;
    model: string;
    transcript_source: string;
    diarized: boolean;
    confidence_note: string;
    note: string;
    [key: string]: unknown;
  };
  data: {
    overview: string | null;
    speakers: HearingSpeaker[];
    sections: HearingTimelineSection[];
  };
}

/** One machine-transcript line from GET /hearings/{video_id}/transcript. */
export interface HearingTranscriptSegment {
  seconds: number;
  timestamp: string;
  speaker: string | null;
  text: string;
  url: string;
}

/** GET /hearings/{video_id}/transcript?from&to. */
export interface HearingTranscriptResponse {
  meta: {
    dataset: "hearings";
    video_id: string;
    title: string;
    from_seconds: number;
    to_seconds: number;
    returned: number;
    truncated: boolean;
    transcript_source: string;
    diarized: boolean;
    note: string;
    [key: string]: unknown;
  };
  data: HearingTranscriptSegment[];
}

/**
 * NEP (National Expenditure Program): the FY2027 proposal as submitted to
 * Congress, paired against the FY2026 enacted baseline. Amounts are pesos.
 */

/** One dimension row (expense class, region, fund) with its FY2026 baseline. */
export interface NepRollupRow {
  code: string;
  description: string | null;
  extra: string | null;
  count: number;
  amount: number;
  base_amount: number;
  delta: number;
  pct: number;
}

/** One NEP department row, including section and hierarchy counts. */
export interface NepDepartmentRow {
  id: string;
  slug: string;
  description: string;
  source_description: string;
  source_department_code: string;
  section: string;
  line_items: number;
  amount: number;
  base_amount: number;
  delta: number;
  pct: number;
  agencies: number;
  programs: number;
  activities: number;
  operating_units: number;
  objects: number;
  regions: number;
}

/** One top-ranked NEP program row. */
export interface NepProgramRow {
  department_id: string;
  code: string;
  description: string;
  extra: string | null;
  count: number;
  amount: number;
  base_amount: number;
  delta: number;
  pct: number;
}

export interface NepNational {
  line_items: number;
  amount: number;
  base_amount: number;
  delta: number;
  pct: number;
}

export type NepDimension =
  | "agency"
  | "program"
  | "expense_class"
  | "fund"
  | "region"
  | "object"
  | "operating_unit"
  | "division";

/** GET /nep/2027 — national overview with FY2026 comparison. */
export interface NepOverviewResponse {
  meta: {
    dataset: "nep";
    fiscal_year: number;
    baseline_year: number;
    currency: "PHP";
    scale: "pesos";
    generated_at: string;
    source_file: string;
    [key: string]: unknown;
  };
  data: {
    national: NepNational;
    departments: NepDepartmentRow[];
    expense_classes: NepRollupRow[];
    regions: NepRollupRow[];
    top_funds: NepRollupRow[];
    top_programs: NepProgramRow[];
    top_movers_up: NepDepartmentRow[];
    top_movers_down: NepDepartmentRow[];
  };
}

/** GET /nep/2027/rollups/{dimension} and /departments/{id}/rollups/{dimension}. */
export interface NepRollupsResponse {
  meta: {
    dataset: "nep";
    fiscal_year: number;
    baseline_year: number;
    currency: "PHP";
    scale: "pesos";
    dimension: NepDimension;
    limit: number;
    [key: string]: unknown;
  };
  data: NepRollupRow[];
}

/**
 * Budget cycle workbook: Current New Appropriations only, FY2018–FY2026,
 * from proposal through disbursement. Narrower than the GAA series.
 */

export type CycleStage =
  | "nep"
  | "gaa"
  | "authorized_appropriation"
  | "adjusted_appropriation"
  | "adjusted_allotment"
  | "obligations"
  | "disbursements";

export type CycleExpenseClass = "ps" | "mooe" | "finex" | "co" | "total";

/** One covered source subject (usually one department's Office of the Secretary). */
export interface CycleSubject {
  subject_id: string;
  source_sheet: string;
  display_name: string;
  is_primary_subject: number;
  canonical_portal_department_id: string | null;
  canonical_portal_agency_id: string | null;
  source_pairs: string[];
  coverage: Record<string, number[]>;
}

export interface CycleManifestMeta {
  dataset: "budget-cycle";
  currency: "PHP";
  scale: "pesos";
  generated_at: string;
  source_filename: string;
  source_sha256: string;
  scope: string;
  units: string;
  years: number[];
  stages: CycleStage[];
  expense_classes: CycleExpenseClass[];
  [key: string]: unknown;
}

/** GET /budget-cycle — coverage manifest for all source subjects. */
export interface CycleManifestResponse {
  meta: CycleManifestMeta;
  data: {
    note: string;
    subjects: CycleSubject[];
  };
}

/** One program in the workbook, with the source-to-portal crosswalk. */
export interface CycleProgram {
  source_row_id: string;
  subject_id: string;
  source_department_code: string;
  source_department_name: string;
  source_agency_code: string;
  source_agency_name: string;
  source_pap_code: string;
  source_pap_label: string;
  canonical_portal_fpap_id: string | null;
  portal_pap_label: string | null;
  match_method: string | null;
  match_confidence: string | null;
}

/** One workbook fact: program x fiscal year x stage x expense class. */
export interface CycleFact {
  source_row_id: string;
  fiscal_year: number;
  stage: CycleStage;
  expense_class: CycleExpenseClass;
  amount: number;
}

/** GET /budget-cycle/departments/{id} — programs and facts for one subject. */
export interface CycleDepartmentResponse {
  meta: CycleManifestMeta & {
    department_id: string;
    counts: { programs: number; facts: number };
  };
  data: {
    programs: CycleProgram[];
    facts: CycleFact[];
  };
}

/**
 * Hearing deliberation record. Machine-generated from the transcript:
 * question at issue, positions, figures as spoken, actions, outcome.
 */

export interface HearingPosition {
  who: string;
  position: string;
}

export interface HearingFigure {
  amount_text: string;
  amount: number | null;
  what: string;
  speaker?: string;
  seconds?: number;
  timestamp?: string;
  url: string;
}

export interface HearingAction {
  action: string;
  kind: string;
  who: string;
  seconds?: number;
  timestamp?: string;
  url: string;
}

/** GET /hearings/{video_id}/topics/{index} — full record for one topic. */
export interface HearingTopicDetail extends HearingTopic {
  question: string | null;
  agency_position: string | null;
  outcome: string | null;
  timeline_sections: number[];
  positions: HearingPosition[];
  figures: HearingFigure[];
  actions: HearingAction[];
  thread: HearingMoment[];
}

/** GET /hearings/{video_id}/topics/{index}. */
export interface HearingTopicResponse {
  meta: {
    dataset: "hearings";
    currency: string;
    scale: string;
    video_id: string;
    [key: string]: unknown;
  };
  data: HearingTopicDetail;
}

/** GET /hearings/{video_id}/topics?thread=0 — every topic for one hearing. */
export interface HearingTopicsResponse {
  meta: {
    dataset: "hearings";
    currency: string;
    scale: string;
    video_id: string;
    returned?: number;
    [key: string]: unknown;
  };
  data: HearingTopicDetail[];
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

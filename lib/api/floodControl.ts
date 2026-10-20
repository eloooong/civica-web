/**
 * Flood control contracts client.
 *
 * Source: BetterGov.PH's published flood control project snapshot. Read the
 * original project attributes from its Parquet file and preserve component
 * amounts separately from contract-wide approved budgets.
 *
 * Server-side helpers only (called from Server Components). UI components
 * must never fetch the file directly. Responses are cached for 1 hour.
 */
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { promisify } from "node:util";
import { gzip, gunzip } from "node:zlib";
import { parquetReadObjects } from "hyparquet";
import { SOURCE_USER_AGENT } from "@/lib/site";
import { DATA_REVALIDATE_SECONDS } from "@/lib/api/datasets";
import type { SourceRetrieval } from "@/lib/api/source-cache";
import type {
  ContractorFilters,
  ContractorPage,
  ContractorSort,
  ContractorSummary,
  FloodContract,
  FloodContractFilters,
  FloodContractPage,
  FloodContractSort,
  FloodRegionOption,
  FloodSummary,
} from "@/types/floodControl";

const SNAPSHOT_REVISION = "fe11cde6cdd04f3f6c7d292c0943f3127986fadb";
const SNAPSHOT_PATH = "data/parquet/flood_control_projects.parquet";
export const FLOOD_CONTROL_DATA_URL =
  `https://raw.githubusercontent.com/bettergovph/open-data-visualization/${SNAPSHOT_REVISION}/${SNAPSHOT_PATH}`;
export const FLOOD_DATASET_PAGE =
  `https://github.com/bettergovph/open-data-visualization/blob/${SNAPSHOT_REVISION}/${SNAPSHOT_PATH}`;
export const FLOOD_DATASET_NAME = "Flood control project snapshot, December 15, 2025";
export const FLOOD_DOCS_URL = "https://github.com/bettergovph/open-data-visualization";
export const FLOOD_SOURCE_NAME = "BetterGov.PH Transparency Dashboard, original data from Sumbong sa Pangulo";

const compress = promisify(gzip);
const decompress = promisify(gunzip);

export class FloodApiError extends Error {
  readonly status: number;
  readonly endpoint: string;

  constructor(status: number, message: string, endpoint: string) {
    super(message);
    this.name = "FloodApiError";
    this.status = status;
    this.endpoint = endpoint;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function num(value: unknown): number {
  if (typeof value === "bigint") {
    const numeric = Number(value);
    return Number.isSafeInteger(numeric) ? numeric : 0;
  }
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalize(rows: Record<string, unknown>[]): FloodContract[] {
  const contracts: FloodContract[] = [];
  const components = new Set<string>();
  const contractBudgets = new Map<string, { abc: number; contractor: string }>();
  for (const row of rows) {
    if (!row.raw_data || typeof row.raw_data !== "object" || Array.isArray(row.raw_data)) {
      throw new FloodApiError(502, "The published snapshot has no original project attributes.", FLOOD_CONTROL_DATA_URL);
    }
    const a = row.raw_data as Record<string, unknown>;
    const contractId = text(a.ContractID);
    const projectId = text(a.ProjectID);
    const componentId = text(a.ProjectComponentID);
    const contractor = text(a.Contractor);
    const abc = a.ApprovedBudgetForTheContract;
    const contractCost = a.ContractCost;
    if (!contractId || !projectId || !componentId || !contractor ||
      typeof abc !== "number" || !Number.isFinite(abc) || abc < 0 ||
      typeof contractCost !== "number" || !Number.isFinite(contractCost) || contractCost < 0 ||
      components.has(componentId)) {
      throw new FloodApiError(502, "The published snapshot contains incomplete or duplicate project records.", FLOOD_CONTROL_DATA_URL);
    }
    const previous = contractBudgets.get(contractId);
    if (previous && (previous.abc !== abc || previous.contractor !== contractor)) {
      throw new FloodApiError(502, "The published snapshot contains conflicting contract details.", FLOOD_CONTROL_DATA_URL);
    }
    components.add(componentId);
    contractBudgets.set(contractId, { abc, contractor });
    const fundingYearRaw =
      typeof a.FundingYear === "number" || typeof a.FundingYear === "bigint"
        ? String(a.FundingYear) : text(a.FundingYear);
    const fundingYear = Number.parseInt(fundingYearRaw, 10);
    contracts.push({
      contractId,
      projectId,
      projectComponentId: componentId,
      projectDescription: text(a.ProjectDescription),
      projectComponentDescription: text(a.ProjectComponentDescription),
      contractor,
      abc,
      contractCost,
      fundingYear: Number.isFinite(fundingYear) ? fundingYear : 0,
      infraYear: num(a.InfraYear),
      completionYear: num(a.CompletionYear),
      startDate: text(a.StartDate),
      completionDate: text(a.CompletionDateActual),
      region: text(a.Region),
      province: text(a.Province),
      municipality: a.Municipality === null || a.Municipality === undefined ? null : text(a.Municipality),
      implementingOffice: text(a.ImplementingOffice),
      districtEngineeringOffice: text(a.DistrictEngineeringOffice),
      legislativeDistrict: text(a.LegislativeDistrict),
      typeOfWork: text(a.TypeofWork),
      latitude: num(a.Latitude),
      longitude: num(a.Longitude),
    });
  }
  if (contracts.length === 0) {
    throw new FloodApiError(502, "The published snapshot contains no project records.", FLOOD_CONTROL_DATA_URL);
  }
  return contracts;
}

const readSnapshot = unstable_cache(async () => {
  const endpoint = FLOOD_CONTROL_DATA_URL;
  let res: Response;
  try {
    res = await fetch(endpoint, {
      cache: "no-store",
      headers: { "User-Agent": SOURCE_USER_AGENT },
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new FloodApiError(
      503,
      "Could not reach the published flood control snapshot. Please try again.",
      endpoint
    );
  }
  if (!res.ok) {
    throw new FloodApiError(
      res.status,
      `Flood control data request failed (HTTP ${res.status}).`,
      endpoint
    );
  }
  let body: ArrayBuffer;
  try {
    body = await res.arrayBuffer();
  } catch {
    throw new FloodApiError(503, "The published snapshot download did not complete. Please try again.", endpoint);
  }
  const retrievedAt = new Date().toISOString();
  let records: FloodContract[];
  try {
    const rows = await parquetReadObjects({ file: body, columns: ["raw_data"] });
    records = normalize(rows);
  } catch (error) {
    if (error instanceof FloodApiError) throw error;
    throw new FloodApiError(502, "The published snapshot could not be read as project data.", endpoint);
  }

  // Keep the cached data and the time of its actual download together.
  // Compress the normalized rows so the snapshot fits in one cache entry.
  return {
    payload: (await compress(Buffer.from(JSON.stringify(records)))).toString("base64"),
    retrieval: { endpoint, retrievedAt, cacheSeconds: DATA_REVALIDATE_SECONDS } satisfies SourceRetrieval,
  };
}, ["civica-flood-snapshot-v1", FLOOD_CONTROL_DATA_URL], { revalidate: DATA_REVALIDATE_SECONDS });

const getSnapshot = cache(async () => {
  const snapshot = await readSnapshot();
  const decoded = await decompress(Buffer.from(snapshot.payload, "base64"));
  return { data: JSON.parse(decoded.toString("utf8")) as FloodContract[], retrieval: snapshot.retrieval };
});

/** All project component records, decoded once per request. */
export async function getFloodContracts(): Promise<FloodContract[]> {
  return (await getSnapshot()).data;
}

export async function getFloodRetrieval(): Promise<SourceRetrieval> {
  return (await getSnapshot()).retrieval;
}

function matchesQuery(contract: FloodContract, q: string): boolean {
  const needle = q.toLowerCase();
  return (
    contract.contractor.toLowerCase().includes(needle) ||
    contract.projectDescription.toLowerCase().includes(needle) ||
    contract.projectComponentDescription.toLowerCase().includes(needle) ||
    contract.contractId.toLowerCase().includes(needle) ||
    contract.projectId.toLowerCase().includes(needle) ||
    contract.province.toLowerCase().includes(needle) ||
    (contract.municipality ?? "").toLowerCase().includes(needle) ||
    contract.implementingOffice.toLowerCase().includes(needle)
  );
}

const CONTRACT_SORTS: Record<FloodContractSort, (a: FloodContract, b: FloodContract) => number> = {
  cost: (a, b) => b.contractCost - a.contractCost,
  abc: (a, b) => b.abc - a.abc,
  contractor: (a, b) => a.contractor.localeCompare(b.contractor),
  year: (a, b) => b.fundingYear - a.fundingYear || b.contractCost - a.contractCost,
};

/** Filter, sort, and paginate the contract records. */
export async function queryFloodContracts(
  filters: FloodContractFilters = {}
): Promise<FloodContractPage> {
  const contracts = await getFloodContracts();
  const q = filters.q?.trim();
  const contractor = filters.contractor?.trim();
  const region = filters.region?.trim();
  const year = filters.year;

  let items = contracts.filter((c) => {
    if (q && !matchesQuery(c, q)) return false;
    if (contractor && c.contractor !== contractor) return false;
    if (region && c.region !== region) return false;
    if (year !== undefined && c.fundingYear !== year) return false;
    return true;
  });

  const sort = filters.sort ?? "cost";
  items = [...items].sort(CONTRACT_SORTS[sort]);

  const pageSize = filters.pageSize ?? 25;
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, filters.page ?? 1), totalPages);
  const start = (page - 1) * pageSize;

  return { items: items.slice(start, start + pageSize), total, page, pageSize, totalPages };
}

/** Dataset-wide totals used by the stat cards. */
export async function getFloodSummary(): Promise<FloodSummary> {
  const contracts = await getFloodContracts();
  const contractors = new Set<string>();
  const contractIds = new Set<string>();
  let totalCost = 0;
  let totalAbc = 0;
  let yearMin = Number.POSITIVE_INFINITY;
  let yearMax = Number.NEGATIVE_INFINITY;
  for (const c of contracts) {
    if (c.contractor) contractors.add(c.contractor);
    totalCost += c.contractCost;
    if (!contractIds.has(c.contractId)) totalAbc += c.abc;
    contractIds.add(c.contractId);
    if (c.fundingYear > 0) {
      yearMin = Math.min(yearMin, c.fundingYear);
      yearMax = Math.max(yearMax, c.fundingYear);
    }
  }
  return {
    contracts: contractIds.size,
    components: contracts.length,
    contractors: contractors.size,
    totalCost,
    totalAbc,
    yearMin: Number.isFinite(yearMin) ? yearMin : 0,
    yearMax: Number.isFinite(yearMax) ? yearMax : 0,
  };
}

/** Distinct regions with contract counts, most covered first. */
export async function getFloodRegions(): Promise<FloodRegionOption[]> {
  const contracts = await getFloodContracts();
  const counts = new Map<string, Set<string>>();
  for (const c of contracts) {
    if (!c.region) continue;
    const ids = counts.get(c.region) ?? new Set<string>();
    ids.add(c.contractId);
    counts.set(c.region, ids);
  }
  return [...counts.entries()]
    .map(([region, ids]) => ({ region, contracts: ids.size }))
    .sort((a, b) => b.contracts - a.contracts || a.region.localeCompare(b.region));
}

/** Distinct funding years present in the data, newest first. */
export async function getFloodYears(): Promise<number[]> {
  const contracts = await getFloodContracts();
  const years = new Set<number>();
  for (const c of contracts) {
    if (c.fundingYear > 0) years.add(c.fundingYear);
  }
  return [...years].sort((a, b) => b - a);
}

async function summarizeContractors(): Promise<ContractorSummary[]> {
  const contracts = await getFloodContracts();
  const byContractor = new Map<string, ContractorSummary>();
  const regionsByContractor = new Map<string, Set<string>>();
  const countedContracts = new Set<string>();
  for (const c of contracts) {
    if (!c.contractor) continue;
    const summary = byContractor.get(c.contractor) ?? {
      contractor: c.contractor,
      contracts: 0,
      totalCost: 0,
      totalAbc: 0,
      regions: 0,
      firstYear: 0,
      lastYear: 0,
    };
    summary.totalCost += c.contractCost;
    if (!countedContracts.has(c.contractId)) {
      summary.contracts += 1;
      summary.totalAbc += c.abc;
      countedContracts.add(c.contractId);
    }
    if (c.fundingYear > 0) {
      summary.firstYear = summary.firstYear === 0 ? c.fundingYear : Math.min(summary.firstYear, c.fundingYear);
      summary.lastYear = Math.max(summary.lastYear, c.fundingYear);
    }
    byContractor.set(c.contractor, summary);
    if (c.region) {
      const set = regionsByContractor.get(c.contractor) ?? new Set<string>();
      set.add(c.region);
      regionsByContractor.set(c.contractor, set);
    }
  }
  for (const [name, summary] of byContractor) {
    summary.regions = regionsByContractor.get(name)?.size ?? 0;
  }
  return [...byContractor.values()];
}

const CONTRACTOR_SORTS: Record<ContractorSort, (a: ContractorSummary, b: ContractorSummary) => number> = {
  cost: (a, b) => b.totalCost - a.totalCost,
  contracts: (a, b) => b.contracts - a.contracts || b.totalCost - a.totalCost,
  name: (a, b) => a.contractor.localeCompare(b.contractor),
};

/** Group contracts by contractor, then filter, sort, and paginate. */
export async function queryContractors(
  filters: ContractorFilters = {}
): Promise<ContractorPage> {
  let items = await summarizeContractors();
  const q = filters.q?.trim().toLowerCase();
  if (q) {
    items = items.filter((c) => c.contractor.toLowerCase().includes(q));
  }
  const sort = filters.sort ?? "cost";
  items = [...items].sort(CONTRACTOR_SORTS[sort]);

  const pageSize = filters.pageSize ?? 25;
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, filters.page ?? 1), totalPages);
  const start = (page - 1) * pageSize;

  return { items: items.slice(start, start + pageSize), total, page, pageSize, totalPages };
}

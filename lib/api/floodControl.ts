/**
 * Flood control contracts client.
 *
 * Source: Open Data Portal dataset "Flood Control Projects Dashboard data"
 * (dataset 2, CC0), a mirror of the DPWH flood control dashboard originally
 * attributed to Sumbong sa Pangulo. One large JSON file (ArcGIS feature set,
 * about 17 MB) fetched server-side and parsed into flat contract records.
 *
 * Server-side helpers only (called from Server Components). UI components
 * must never fetch the file directly. Responses are cached for 1 hour.
 */
import { cache } from "react";
import { DATA_DOCS_URL, DATA_REVALIDATE_SECONDS, DATA_SOURCE_NAME } from "@/lib/api/datasets";
import type {
  ContractorFilters,
  ContractorPage,
  ContractorSort,
  ContractorSummary,
  FloodContract,
  FloodContractFilters,
  FloodContractPage,
  FloodContractSort,
  FloodFeatureSet,
  FloodRegionOption,
  FloodSummary,
} from "@/types/floodControl";

export const FLOOD_CONTROL_JSON_URL =
  "https://raw.githubusercontent.com/bettergovph/bettergov/refs/heads/main/src/data/flood_control/flood_control.json";
export const FLOOD_DATASET_PAGE = "/data/2";
export const FLOOD_DATASET_NAME = "Flood Control Projects Dashboard data (CC0)";
export const FLOOD_DOCS_URL = DATA_DOCS_URL;
export const FLOOD_SOURCE_NAME = `${DATA_SOURCE_NAME}, original data from Sumbong sa Pangulo`;

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

function text(value: string | null | undefined): string {
  return value === null || value === undefined ? "" : value;
}

function num(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalize(raw: FloodFeatureSet | null | undefined): FloodContract[] {
  const features = raw?.features ?? [];
  const contracts: FloodContract[] = [];
  for (const feature of features) {
    const a = feature?.attributes;
    if (!a) continue;
    const contractId = text(a.ContractID);
    const projectId = text(a.ProjectID);
    if (!contractId && !projectId) continue;
    const fundingYearRaw =
      typeof a.FundingYear === "number" ? String(a.FundingYear) : text(a.FundingYear);
    const fundingYear = Number.parseInt(fundingYearRaw, 10);
    contracts.push({
      contractId,
      projectId,
      projectComponentId: text(a.ProjectComponentID),
      projectDescription: text(a.ProjectDescription),
      projectComponentDescription: text(a.ProjectComponentDescription),
      contractor: text(a.Contractor),
      abc: num(a.ABC),
      contractCost: num(a.ContractCost),
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
  return contracts;
}

/** All flood control contract records, parsed once per request. */
export const getFloodContracts = cache(async (): Promise<FloodContract[]> => {
  const endpoint = FLOOD_CONTROL_JSON_URL;
  let res: Response;
  try {
    res = await fetch(endpoint, {
      next: { revalidate: DATA_REVALIDATE_SECONDS },
      headers: { "User-Agent": "Civica-PH/1.0 (+https://civica.ph)" },
      signal: AbortSignal.timeout(90_000),
    });
  } catch {
    throw new FloodApiError(
      503,
      "Could not reach the flood control data file. Check your connection and try again.",
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
  let body: FloodFeatureSet;
  try {
    body = (await res.json()) as FloodFeatureSet;
  } catch {
    throw new FloodApiError(502, "The flood control data file is not valid JSON.", endpoint);
  }
  return normalize(body);
});

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
  let totalCost = 0;
  let totalAbc = 0;
  let yearMin = Number.POSITIVE_INFINITY;
  let yearMax = Number.NEGATIVE_INFINITY;
  for (const c of contracts) {
    if (c.contractor) contractors.add(c.contractor);
    totalCost += c.contractCost;
    totalAbc += c.abc;
    if (c.fundingYear > 0) {
      yearMin = Math.min(yearMin, c.fundingYear);
      yearMax = Math.max(yearMax, c.fundingYear);
    }
  }
  return {
    contracts: contracts.length,
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
  const counts = new Map<string, number>();
  for (const c of contracts) {
    if (!c.region) continue;
    counts.set(c.region, (counts.get(c.region) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([region, count]) => ({ region, contracts: count }))
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
    summary.contracts += 1;
    summary.totalCost += c.contractCost;
    summary.totalAbc += c.abc;
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

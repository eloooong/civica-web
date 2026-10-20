/**
 * Flood control project components and contracts from BetterGov.PH's
 * published snapshot, preserving the original source attributes.
 */
export interface FloodContract {
  contractId: string;
  projectId: string;
  projectComponentId: string;
  projectDescription: string;
  projectComponentDescription: string;
  contractor: string;
  abc: number;
  contractCost: number;
  fundingYear: number;
  infraYear: number;
  completionYear: number;
  startDate: string;
  completionDate: string;
  region: string;
  province: string;
  municipality: string | null;
  implementingOffice: string;
  districtEngineeringOffice: string;
  legislativeDistrict: string;
  typeOfWork: string;
  latitude: number;
  longitude: number;
}

export type FloodContractSort = "cost" | "abc" | "contractor" | "year";

export interface FloodContractFilters {
  q?: string;
  contractor?: string;
  year?: number;
  region?: string;
  sort?: FloodContractSort;
  page?: number;
  pageSize?: number;
}

export interface FloodContractPage {
  items: FloodContract[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FloodSummary {
  contracts: number;
  components: number;
  contractors: number;
  totalCost: number;
  totalAbc: number;
  yearMin: number;
  yearMax: number;
}

export interface FloodRegionOption {
  region: string;
  contracts: number;
}

export type ContractorSort = "cost" | "contracts" | "name";

export interface ContractorFilters {
  q?: string;
  sort?: ContractorSort;
  page?: number;
  pageSize?: number;
}

export interface ContractorSummary {
  contractor: string;
  contracts: number;
  totalCost: number;
  totalAbc: number;
  regions: number;
  firstYear: number;
  lastYear: number;
}

export interface ContractorPage {
  items: ContractorSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

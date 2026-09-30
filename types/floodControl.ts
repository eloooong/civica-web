/**
 * Flood control contracts (DPWH flood control dashboard, mirrored by the
 * Open Data Portal). The source file is an ArcGIS feature set: one JSON
 * document with a field schema plus feature attributes.
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

/** Raw ArcGIS feature attributes as they appear in the source JSON. */
export interface FloodRawAttributes {
  InfraYear?: number | null;
  Region?: string | null;
  Province?: string | null;
  Municipality?: string | null;
  ImplementingOffice?: string | null;
  ProjectID?: string | null;
  ProjectDescription?: string | null;
  ProjectComponentID?: string | null;
  ProjectComponentDescription?: string | null;
  TypeofWork?: string | null;
  Longitude?: number | null;
  Latitude?: number | null;
  ContractID?: string | null;
  ABC?: number | null;
  ContractCost?: number | null;
  CompletionDateOriginal?: number | null;
  CompletionYear?: number | null;
  Contractor?: string | null;
  FundingYear?: string | number | null;
  LegislativeDistrict?: string | null;
  DistrictEngineeringOffice?: string | null;
  StartDate?: string | null;
  CompletionDateActual?: string | null;
}

export interface FloodRawFeature {
  attributes?: FloodRawAttributes | null;
}

export interface FloodFeatureSet {
  features?: FloodRawFeature[] | null;
}

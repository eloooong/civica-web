import type { AgencySummary } from "@/types/budget";
import type { BillSummary } from "@/types/congress";
import type { DatasetSummary } from "@/types/dataset";
import type { SearchResult } from "@/types/search";

/**
 * Realistic Phase 1 placeholder content.
 * Clearly marked as illustrative until real APIs are integrated (Phases 2–4).
 */

export const PLACEHOLDER_BUDGET_TOTAL = 6_700_000_000_000;

export const placeholderAgencies: AgencySummary[] = [
  { id: "deped", name: "Department of Education", acronym: "DepEd", fiscalYear: 2026, amount: 1_050_000_000_000, changePercent: 7.2, programs: 14 },
  { id: "dpwh", name: "Department of Public Works and Highways", acronym: "DPWH", fiscalYear: 2026, amount: 900_000_000_000, changePercent: 5.1, programs: 9 },
  { id: "doh", name: "Department of Health", acronym: "DOH", fiscalYear: 2026, amount: 320_000_000_000, changePercent: 11.4, programs: 11 },
  { id: "dnd", name: "Department of National Defense", acronym: "DND", fiscalYear: 2026, amount: 285_000_000_000, changePercent: 3.8, programs: 7 },
  { id: "dilg", name: "Department of the Interior and Local Government", acronym: "DILG", fiscalYear: 2026, amount: 270_000_000_000, changePercent: 4.6, programs: 8 },
  { id: "da", name: "Department of Agriculture", acronym: "DA", fiscalYear: 2026, amount: 180_000_000_000, changePercent: 9.3, programs: 12 },
];

export const placeholderBills: BillSummary[] = [
  {
    id: "hb-1234",
    billNumber: "HB 1234",
    title: "An Act Strengthening Basic Education Facilities Nationwide",
    congress: "20th Congress",
    status: "Committee",
    authorCount: 3,
    authors: ["Rep. Maria Santos", "Rep. Juan Dela Cruz"],
  },
  {
    id: "sb-0421",
    billNumber: "SB 421",
    title: "An Act Expanding Rural Health Units and Barangay Health Stations",
    congress: "20th Congress",
    status: "Filed",
    authorCount: 2,
    authors: ["Sen. Ana Reyes"],
  },
  {
    id: "hb-5678",
    billNumber: "HB 5678",
    title: "An Act Modernizing Farm-to-Market Road Standards",
    congress: "20th Congress",
    status: "Approved",
    authorCount: 5,
    authors: ["Rep. Jose Ramos", "Rep. Liza Aquino"],
  },
];

export const placeholderDatasets: DatasetSummary[] = [
  {
    id: "agri-production",
    title: "Agricultural Production Statistics",
    publisher: "Department of Agriculture",
    category: "Agriculture",
    updatedAt: "August 2026",
    formats: ["CSV", "XLSX", "API"],
    description: "Quarterly palay, corn, and high-value crop production volumes by region.",
  },
  {
    id: "pop-census",
    title: "Population and Housing Census Summary",
    publisher: "Philippine Statistics Authority",
    category: "Population",
    updatedAt: "July 2026",
    formats: ["CSV", "API"],
    description: "Provincial population counts, household size, and demographic breakdowns.",
  },
  {
    id: "school-inventory",
    title: "Public School Infrastructure Inventory",
    publisher: "Department of Education",
    category: "Education",
    updatedAt: "June 2026",
    formats: ["CSV", "XLSX"],
    description: "Classroom counts, facility conditions, and electrification by school division.",
  },
];

export const placeholderSearchResults: SearchResult[] = [
  {
    id: "dpwh-agency",
    type: "budget",
    title: "Department of Public Works and Highways",
    description: "FY 2026 allocation · ₱900.0B · 9 programs",
    agency: "DPWH",
    metadata: { fiscalYear: 2026, amount: "₱900.0B" },
    url: "/budget",
  },
  {
    id: "hb-5678",
    type: "bill",
    title: "HB 5678 — Farm-to-Market Road Standards",
    description: "20th Congress · Status: Approved · 5 authors",
    metadata: { congress: "20th Congress", status: "Approved" },
    url: "/congress",
  },
  {
    id: "agri-production",
    type: "dataset",
    title: "Agricultural Production Statistics",
    description: "Department of Agriculture · Updated August 2026",
    agency: "Department of Agriculture",
    metadata: { category: "Agriculture", formats: "CSV · XLSX · API" },
    url: "/data",
  },
];

export const popularSearches: { label: string; href: string; category: string }[] = [
  { label: "Department of Education", href: "/search?q=Department%20of%20Education", category: "Budget" },
  { label: "DPWH", href: "/search?q=DPWH", category: "Budget" },
  { label: "Department of Health", href: "/search?q=Department%20of%20Health", category: "Budget" },
  { label: "Education bills", href: "/search?q=education%20bills", category: "Congress" },
  { label: "Infrastructure bills", href: "/search?q=infrastructure", category: "Congress" },
  { label: "Agriculture", href: "/search?q=agriculture", category: "Data" },
  { label: "Population", href: "/search?q=population", category: "Data" },
  { label: "Government spending", href: "/search?q=government%20spending", category: "Data" },
];

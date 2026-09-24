/**
 * Types mirroring the public Open Congress API
 * (https://open-congress-api.bettergov.ph, OpenAPI spec at /api/doc).
 * Manually-encoded Philippine legislative data: bills, people, congresses.
 * Nullable fields are common — always use the display helpers in lib/congress.ts.
 */

export interface Pagination {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
  next_cursor: string | null;
}

export interface AuthorRef {
  id: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  name_suffix: string | null;
  full_name: string | null;
  aliases: string[] | null;
}

/** A legislative document (bill). GET /documents, /search/documents, /documents/{id}. */
export interface BillDocument {
  id: string;
  type: string;
  subtype: string | null;
  name: string | null;
  bill_number: number | null;
  congress: number | null;
  title: string | null;
  long_title: string | null;
  congress_website_title: string | null;
  congress_website_abstract: string | null;
  date_filed: string | null;
  scope: string | null;
  subjects: string[];
  authors_raw: string | null;
  senate_website_permalink: string | null;
  download_url_sources: string[];
  authors?: AuthorRef[];
}

export interface CongressServed {
  congress_number: number;
  congress_ordinal: string;
  position: string;
}

/** A legislator. GET /people, /search/people, /people/{id}. */
export interface Legislator {
  id: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  name_prefix: string | null;
  name_suffix: string | null;
  full_name: string | null;
  professional_designations: string[] | null;
  aliases: string[] | null;
  congresses_served?: CongressServed[];
}

/** A chamber membership. GET /people/{id}/groups. */
export interface ChamberGroup {
  id: string;
  name: string;
  type: string;
  subtype: string | null;
  congress: number | null;
}

/** A congressional session. GET /congresses. */
export interface CongressSession {
  id: string;
  congress_number: number;
  congress_website_key: number | null;
  name: string;
  ordinal: string;
  start_date: string | null;
  end_date: string | null;
  start_year: number | null;
  end_year: number | null;
  year_range: string | null;
}

export interface BillsByCongress {
  congress: number;
  total: number;
  house_bills: number;
  senate_bills: number;
}

/** GET /stats — database-wide totals. */
export interface CongressStats {
  total_bills: number;
  total_house_bills: number;
  total_senate_bills: number;
  total_congresses: number;
  total_people: number;
  total_committees: number;
  bills_with_dates: number;
  bills_without_dates: number;
  bills_by_congress: BillsByCongress[];
}

export type BillChamber = "HB" | "SB";

/**
 * @deprecated Phase 1 placeholder shape. Kept only so the Phase 1
 * search/data previews still compile; congress pages use the real
 * API types above. Remove in Phase 5.
 */
export type BillStatus = "Filed" | "Committee" | "Approved" | "Enacted";

export interface BillSummary {
  id: string;
  billNumber: string;
  title: string;
  congress: string;
  status: BillStatus;
  authorCount: number;
  authors: string[];
}

export interface LegislatorSummary {
  id: string;
  name: string;
  position: "Senator" | "Representative";
  district?: string;
  congress: string;
  billsAuthored: number;
}

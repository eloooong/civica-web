import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatPesoCompact(value: number): string {
  if (value >= 1_000_000_000_000) return `₱${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (value >= 1_000_000_000) return `₱${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
  return `₱${value.toLocaleString("en-PH")}`;
}

export function formatPesoFull(value: number): string {
  return `₱${value.toLocaleString("en-PH")}`;
}

export function formatCount(value: number): string {
  return value.toLocaleString("en-PH");
}

export function formatShare(share: number): string {
  return `${(share * 100).toFixed(2)}%`;
}

/** Trillions with 2 decimals, for chart axes (e.g. 6.79). */
export function toTrillions(value: number): number {
  return Math.round((value / 1_000_000_000_000) * 100) / 100;
}

/** Lowercase, collapse every run of non-alphanumerics to one hyphen, trim hyphens. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Canonical route for one budget program (P/A/P family). */
export function budgetProgramPath(
  departmentId: string,
  agencyId: string,
  name: string,
  year?: number
): string {
  const base = `/budget/${departmentId}/programs/${agencyId}/${slugify(name)}`;
  return year === undefined ? base : `${base}?year=${year}`;
}

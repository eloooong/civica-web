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

/** Signed compact peso change, for example +₱1.2B or -₱36.2M. */
export function formatPesoDelta(value: number): string {
  const sign = value < 0 ? "-" : "+";
  return `${sign}${formatPesoCompact(Math.abs(value))}`;
}

/** Signed percent with one decimal, for example +10.9% or -30.4%. */
export function formatPctDelta(value: number): string {
  const sign = value < 0 ? "-" : "+";
  return `${sign}${Math.abs(value).toFixed(1)}%`;
}

/** Trillions with 2 decimals, for chart axes (e.g. 6.79). */
export function toTrillions(value: number): number {
  return Math.round((value / 1_000_000_000_000) * 100) / 100;
}

/** Short department label: the acronym in parentheses, else a truncated name. */
export function deptShortName(description: string): string {
  const match = description.match(/\(([^)]+)\)/);
  if (match) return match[1];
  return description.length > 34 ? `${description.slice(0, 34)}…` : description;
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

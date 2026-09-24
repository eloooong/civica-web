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

/** Pure display helpers for Open Data Portal records. */

/** `tags` arrives as a JSON-encoded string — parse defensively. */
export function parseTags(tags: string | null): string[] {
  if (!tags) return [];
  try {
    const parsed: unknown = JSON.parse(tags);
    if (Array.isArray(parsed)) return parsed.filter((t): t is string => typeof t === "string");
    return [];
  } catch {
    return [];
  }
}

/** 18334096061 -> "18.3 GB". Null-safe. */
export function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes < 0) return "Size unavailable";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}

/** "2026-07-15" -> "Jul 15, 2026". Null-safe. */
export function formatVersionDate(iso: string | null): string {
  if (!iso) return "Version date unavailable";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

/** Short format label from mime type or file name, e.g. "CSV", "XLSX", "GZIP". */
export function resourceFormatLabel(mimeType: string | null, name: string, url: string | null): string {
  const haystack = `${mimeType ?? ""} ${name} ${url ?? ""}`.toLowerCase();
  if (haystack.includes("xlsx") || haystack.includes("spreadsheetml")) return "XLSX";
  if (haystack.includes("geojson") || haystack.includes("x-ndjson")) return "GEOJSON";
  if (haystack.includes("gzip") || haystack.includes(".gz")) return "CSV·GZ";
  if (haystack.includes("zip")) return "ZIP";
  if (haystack.includes("csv")) return "CSV";
  if (haystack.includes("json")) return "JSON";
  if (haystack.includes("pdf")) return "PDF";
  if (haystack.includes("parquet")) return "PARQUET";
  if (mimeType?.startsWith("text/")) return "TEXT";
  return "FILE";
}

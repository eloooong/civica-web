type CsvCell = string | number | null | undefined;

/** Quote text, preserve numeric values, and prevent spreadsheet formulas in source text. */
export function toCsv(rows: readonly (readonly CsvCell[])[]): string {
  return "\uFEFF" + rows.map((row) => row.map((value) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
    const text = /^[\s\u0000-\u001f]*[=+\-@]|^[\t\r\n]/.test(value) ? `'${value}` : value;
    return `"${text.replaceAll('"', '""')}"`;
  }).join(",")).join("\r\n") + "\r\n";
}

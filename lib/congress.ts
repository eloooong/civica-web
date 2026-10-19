import type { AuthorRef, BillDocument, Legislator } from "@/types/congress";

/** Prefer supplied titles over long titles; record identifiers are not descriptions. */
export function billTitle(bill: BillDocument): string | null {
  for (const value of [bill.title, bill.congress_website_title, bill.long_title]) {
    const title = value?.trim();
    if (title && !/^(?:HBN?|SBN?)[\s-]*\d+$/i.test(title)) return title;
  }
  return null;
}

export function billDisplayTitle(bill: BillDocument): string {
  return billTitle(bill) ?? `${billLabel(bill)}: title unavailable`;
}

/** Short bill label, e.g. "HB 4664". Falls back to the API name (HBN-xxxxx). */
export function billLabel(bill: BillDocument): string {
  if (bill.subtype && bill.bill_number !== null) return `${bill.subtype} ${bill.bill_number}`;
  return bill.name?.trim() || "Bill";
}

/** "20th Congress" from a congress number. */
export function congressOrdinal(n: number | null): string {
  if (n === null) return "Unknown congress";
  const suffix =
    n % 100 >= 11 && n % 100 <= 13
      ? "th"
      : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th";
  return `${n}${suffix} Congress`;
}

/** Compose a legislator's name from parts — `full_name` is often null. */
export function personFullName(
  person: Pick<Legislator, "full_name" | "first_name" | "middle_name" | "last_name" | "name_suffix"> | AuthorRef
): string {
  if (person.full_name) return person.full_name;
  const parts = [person.first_name, person.middle_name, person.last_name].filter(
    (p): p is string => !!p && p.trim().length > 0
  );
  const base = parts.join(" ");
  const suffix = "name_suffix" in person ? person.name_suffix : null;
  return suffix ? `${base} ${suffix}` : base || "Unnamed legislator";
}

/** "Sept 18, 2025" or a fallback for missing dates. */
export function formatFiledDate(iso: string | null): string {
  if (!iso) return "Filing date unavailable";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

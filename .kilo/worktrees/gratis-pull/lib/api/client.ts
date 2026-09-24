/**
 * API client stubs for Phase 2+.
 * Phase 1 intentionally performs no network calls.
 * Keep all future fetch logic here — never hardcode API URLs in components.
 */

export const API_ROUTES = {
  budget: "/api/budget",
  congress: "/api/congress",
  datasets: "/api/datasets",
  search: "/api/search",
} as const;

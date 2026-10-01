import type { MetadataRoute } from "next";

/**
 * Static sitemap. Detail pages (budget departments, individual hearings, bills,
 * legislators, datasets) are intentionally excluded: their IDs live in
 * upstream APIs, change over time, and are all reachable within one click from
 * the explorer pages listed here.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://civiclens.ph";
  const now = new Date();
  const routes = [
    "/",
    "/search",
    "/budget",
    "/budget/compare",
    "/budget/hearings",
    "/budget/nep",
    "/budget/cycle",
    "/congress",
    "/data",
    "/data/flood-control",
    "/data/contractors",
  ];
  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: now,
    changeFrequency: route === "/" ? "weekly" : "daily",
    priority: route === "/" ? 1 : 0.8,
  }));
}

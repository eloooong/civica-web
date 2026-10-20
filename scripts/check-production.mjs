import { pathToFileURL } from "node:url";

const DATA_PATHS = ["/budget", "/budget/nep", "/budget/hearings", "/congress", "/data", "/data/flood-control"];

export async function checkProduction(origin, { fetcher = fetch, timeoutMs = 45_000 } = {}) {
  const base = new URL(origin);
  if (!["http:", "https:"].includes(base.protocol) || base.username || base.password || base.search || base.hash || base.pathname !== "/") {
    throw new Error("Provide a public HTTP or HTTPS origin without a path, credentials, query, or fragment.");
  }
  const paths = ["/api/health", "/", ...DATA_PATHS];
  const results = [];
  for (let index = 0; index < paths.length; index += 2) {
    results.push(...await Promise.all(paths.slice(index, index + 2).map(async (pathname) => {
      const startedAt = Date.now();
      try {
        const response = await fetcher(new URL(pathname, base), {
          signal: AbortSignal.timeout(timeoutMs),
          cache: "no-store",
          redirect: "error",
          headers: { "User-Agent": "Civica-Production-Check/1.0" },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        if (pathname === "/api/health") {
          const health = await response.json();
          if (health.status !== "ok" || health.service !== "civica-web") throw new Error("Invalid application health response");
        } else {
          const html = await response.text();
          if (!response.headers.get("content-type")?.includes("text/html") || !/<main\b/i.test(html) || !/<h1\b/i.test(html)) {
            throw new Error("Expected a complete application page");
          }
          if (/\brole\s*=\s*["']alert["']/i.test(html)) throw new Error("Page displays an error state");
          if (DATA_PATHS.includes(pathname) && !/aria-label=["']Data source["']/.test(html)) {
            throw new Error("Data source attribution is missing");
          }
        }
        return { path: pathname, ok: true, durationMs: Date.now() - startedAt };
      } catch (error) {
        return { path: pathname, ok: false, error: error instanceof Error ? error.message : "Request failed" };
      }
    })));
  }
  return results;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const origin = process.argv[2] || process.env.PRODUCTION_URL;
    if (!origin) throw new Error("Set PRODUCTION_URL or pass the site origin as the first argument.");
    const results = await checkProduction(origin);
    for (const result of results) {
      console.log(`${result.ok ? "PASS" : "FAIL"} ${result.path}: ${result.ok ? `${result.durationMs}ms` : result.error}`);
    }
    if (results.some((result) => !result.ok)) process.exitCode = 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Production check failed");
    process.exitCode = 1;
  }
}

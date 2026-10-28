import { pathToFileURL } from "node:url";
import { appendFile } from "node:fs/promises";

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
      let warning;
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
          if (DATA_PATHS.includes(pathname) && !/aria-label=["']Data source["']/.test(html)) {
            throw new Error("Data source attribution is missing");
          }
          const alerts = html.match(/<[a-z][^>]*\brole\s*=\s*["']alert["'][^>]*>/gi) ?? [];
          for (const alert of alerts) {
            if (pathname !== "/congress" || !/\sdata-source-outage=["']open-congress-usage-exceeded["']/.test(alert)) {
              throw new Error("Page displays an error state");
            }
            warning = "Open Congress is suspended by its hosting provider (usage limit exceeded); congressional records are unavailable.";
          }
        }
        return { path: pathname, ok: true, durationMs: Date.now() - startedAt, ...(warning ? { warning } : {}) };
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
      if (result.warning) {
        console.log(`${process.env.GITHUB_ACTIONS === "true" ? "::warning::" : ""}WARN ${result.path}: ${result.warning}`);
      } else {
        console.log(`${result.ok ? "PASS" : "FAIL"} ${result.path}: ${result.ok ? `${result.durationMs}ms` : result.error}`);
      }
    }
    if (process.env.GITHUB_STEP_SUMMARY) {
      await appendFile(process.env.GITHUB_STEP_SUMMARY, [
        "## Production health",
        "",
        ...results.map(result => `- ${result.warning ? "WARN" : result.ok ? "PASS" : "FAIL"} ${result.path}: ${result.warning ?? result.error ?? `${result.durationMs}ms`}`),
        "",
      ].join("\n"));
    }
    if (results.some((result) => !result.ok)) process.exitCode = 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Production check failed");
    process.exitCode = 1;
  }
}

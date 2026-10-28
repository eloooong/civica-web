import assert from "node:assert/strict";
import { test } from "node:test";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFile, unlink } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { checkProduction } from "../scripts/check-production.mjs";

function healthyResponse(url) {
  return url.pathname === "/api/health"
    ? Response.json({ status: "ok", service: "civica-web" })
    : new Response('<main><h1>Civica</h1><aside aria-label="Data source">Source</aside></main>', { headers: { "Content-Type": "text/html" } });
}

test("checks application health and all main data journeys with bounded requests", async () => {
  const results = await checkProduction("https://site.example", { fetcher: async (url, options) => {
    assert.ok(options.signal instanceof AbortSignal);
    assert.equal(options.redirect, "error");
    return healthyResponse(url);
  } });
  assert.equal(results.length, 8);
  assert.ok(results.every(result => result.ok));
});

test("a source error rendered with HTTP 200 fails the monitor", async () => {
  const results = await checkProduction("https://site.example", { fetcher: async url => url.pathname === "/budget/hearings"
    ? new Response('<main><h1>Hearings</h1><div role="alert">Unable to load hearings</div></main>', { headers: { "Content-Type": "text/html" } })
    : healthyResponse(url) });
  assert.equal(results.find(result => result.path === "/budget/hearings").ok, false);
  assert.equal(results.filter(result => result.ok).length, 7);
});

test("missing attribution, HTTP errors, bad health JSON, and network failures are reported independently", async () => {
  const results = await checkProduction("https://site.example", { fetcher: async url => {
    if (url.pathname === "/api/health") return Response.json({ status: "ok", service: "another-app" });
    if (url.pathname === "/budget") return new Response('<main><h1>Budget</h1></main>', { headers: { "Content-Type": "text/html" } });
    if (url.pathname === "/congress") return new Response("Unavailable", { status: 503 });
    if (url.pathname === "/data") throw new Error("Connection refused");
    return healthyResponse(url);
  } });
  assert.equal(results.filter(result => !result.ok).length, 4);
});

test("redirects or login responses cannot masquerade as a healthy data page", async () => {
  const results = await checkProduction("https://site.example", { fetcher: async url => url.pathname === "/data"
    ? new Response("Sign in", { headers: { "Content-Type": "text/html" } }) : healthyResponse(url) });
  assert.equal(results.find(result => result.path === "/data").ok, false);
});

test("invalid site configuration fails before making requests", async () => {
  for (const origin of ["file:///tmp/site", "https://user:secret@site.example", "https://site.example/path", "https://site.example?token=value"]) {
    await assert.rejects(checkProduction(origin, { fetcher: () => assert.fail("Must not fetch") }));
  }
});

function sourceOutageResponse(extra = "", attribution = true) {
  return new Response(`<main><h1>Congress</h1><div role="alert" data-source-outage="open-congress-usage-exceeded">Source unavailable</div>${extra}${attribution ? '<aside aria-label="Data source">Open Congress</aside>' : ""}</main>`, {
    headers: { "Content-Type": "text/html" },
  });
}

test("a confirmed Congress hosting suspension is a warning, not a healthy data journey", async () => {
  const results = await checkProduction("https://site.example", { fetcher: async url => url.pathname === "/congress" ? sourceOutageResponse() : healthyResponse(url) });
  const congress = results.find(result => result.path === "/congress");
  assert.equal(congress.ok, true);
  assert.match(congress.warning, /usage limit exceeded/);
  assert.equal(results.filter(result => result.warning).length, 1);
});

test("outage markers cannot hide unrelated alerts, missing attribution, or errors on other pages", async () => {
  for (const [path, response] of [
    ["/congress", sourceOutageResponse('<div role="alert">Application bug</div>')],
    ["/congress", sourceOutageResponse("", false)],
    ["/budget", sourceOutageResponse()],
    ["/congress", new Response('<main><h1>Congress</h1><div role="alert">Source error</div><aside aria-label="Data source">Open Congress</aside></main>', { headers: { "Content-Type": "text/html" } })],
  ]) {
    const results = await checkProduction("https://site.example", { fetcher: async url => url.pathname === path ? response : healthyResponse(url) });
    const failed = results.find(result => result.path === path);
    assert.equal(failed.ok, false);
    assert.equal(failed.warning, undefined);
  }
});

test("the CLI emits a GitHub warning and records the degraded journey in the run summary", async () => {
  const summaryPath = join(tmpdir(), `civica-health-${randomUUID()}.md`);
  const server = createServer(async (request, response) => {
    const url = new URL(request.url, "http://localhost");
    const result = url.pathname === "/congress" ? sourceOutageResponse() : healthyResponse(url);
    response.writeHead(result.status, Object.fromEntries(result.headers));
    response.end(await result.text());
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const { stdout } = await promisify(execFile)(process.execPath, ["scripts/check-production.mjs", `http://127.0.0.1:${server.address().port}`], {
      env: { ...process.env, GITHUB_ACTIONS: "true", GITHUB_STEP_SUMMARY: summaryPath },
    });
    assert.match(stdout, /::warning::WARN \/congress:/);
    assert.doesNotMatch(stdout, /PASS \/congress:/);
    assert.match(await readFile(summaryPath, "utf8"), /WARN \/congress:.*unavailable/);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await unlink(summaryPath).catch(() => {});
  }
});

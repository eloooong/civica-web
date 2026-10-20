import assert from "node:assert/strict";
import { test } from "node:test";
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

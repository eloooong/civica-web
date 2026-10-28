import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

// Exercise the source client with only its network/cache boundary replaced.
function congressClient(response) {
  const code = ts.transpileModule(readFileSync(new URL("../lib/api/congress.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const compiledModule = { exports: {} };
  runInNewContext(code, {
    module: compiledModule, exports: compiledModule.exports, URL,
    require(name) {
      assert.equal(name, "@/lib/api/source-cache");
      return { fetchCachedResponse: async () => response };
    },
  });
  return compiledModule.exports;
}

test("the provider's plain-text HTTP 503 suspension is classified explicitly", async () => {
  const client = congressClient(new Response("503: Service Unavailable (USAGE_EXCEEDED)\nThis application is suspended due to usage limits being exceeded.", { status: 503 }));
  await assert.rejects(client.getCongressStats(), error => {
    assert.ok(error instanceof client.CongressApiError);
    assert.equal(error.status, 503);
    assert.equal(error.code, "upstream_usage_exceeded");
    assert.match(error.message, /hosting provider/);
    assert.equal(error.endpoint, `${client.CONGRESS_API_BASE}/stats`);
    return true;
  });
});

test("ordinary failures and mismatched HTTP statuses are not treated as hosting suspensions", async () => {
  for (const [status, body] of [[503, "Service unavailable"], [500, "USAGE_EXCEEDED"], [429, "Rate limited"]]) {
    const client = congressClient(new Response(body, { status }));
    await assert.rejects(client.getCongressStats(), error => error.status === status && error.code === "query_failed");
  }
});

test("structured source errors retain their code and message", async () => {
  const client = congressClient(Response.json({ success: false, error: { code: "invalid_query", message: "Invalid congress" } }, { status: 400 }));
  await assert.rejects(client.getCongressStats(), error => error.code === "invalid_query" && error.message === "Invalid congress");
});

test("successful data is returned without an outage classification", async () => {
  const stats = { total_bills: 42, bills_by_congress: [] };
  const client = congressClient(Response.json({ success: true, data: stats }));
  assert.deepEqual(await client.getCongressStats(), stats);
});

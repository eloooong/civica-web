import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { setImmediate } from "node:timers/promises";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

// Isolate the network/cache boundaries while running the actual source module.
function sourceCache(fetcher) {
  const snapshots = new Map();
  const deadlines = [];
  const code = ts.transpileModule(readFileSync(new URL("../lib/api/source-cache.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const compiledModule = { exports: {} };
  runInNewContext(code, {
    module: compiledModule, exports: compiledModule.exports, Response, fetch: fetcher,
    AbortSignal: { timeout(milliseconds) {
      const controller = new AbortController();
      deadlines.push({ milliseconds, controller });
      return controller.signal;
    } },
    require(name) {
      if (name === "react") return { cache: fn => fn };
      if (name === "@/lib/site") return { SOURCE_USER_AGENT: "Civica-Test" };
      if (name === "next/cache") return { unstable_cache(fn, key) {
        return async () => {
          const cacheKey = JSON.stringify(key);
          if (snapshots.has(cacheKey)) return snapshots.get(cacheKey);
          const snapshot = await fn();
          snapshots.set(cacheKey, snapshot);
          return snapshot;
        };
      } };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  return { ...compiledModule.exports, snapshots, deadlines };
}

test("successful snapshots retain their recorded timestamp and have independently readable responses", async () => {
  let calls = 0;
  const cache = sourceCache(async (url, options) => {
    calls++;
    assert.equal(options.cache, "no-store");
    assert.equal(options.headers["User-Agent"], "Civica-Test");
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json({ amount: 42 });
  });
  const first = await cache.fetchCachedResponse("https://source.example/data", 3600);
  const second = await cache.fetchCachedResponse("https://source.example/data", 3600);
  assert.deepEqual(await first.json(), { amount: 42 });
  assert.deepEqual(await second.json(), { amount: 42 });
  assert.equal(calls, 1);
  assert.equal(cache.deadlines[0].milliseconds, 15_000);
  assert.equal(first.retrieval.retrievedAt, second.retrieval.retrievedAt);
  assert.ok(Number.isFinite(Date.parse(first.retrieval.retrievedAt)));
});

test("HTTP failures preserve source status and body, and recovery makes a new request", async () => {
  let calls = 0;
  const cache = sourceCache(async () => ++calls === 1
    ? Response.json({ error: "unavailable" }, { status: 503 })
    : Response.json({ recovered: true }));
  const failed = await cache.fetchCachedResponse("https://source.example/data", 3600);
  assert.equal(failed.status, 503);
  assert.deepEqual(await failed.json(), { error: "unavailable" });
  assert.equal(cache.snapshots.size, 0);
  assert.deepEqual(await (await cache.fetchCachedResponse("https://source.example/data", 3600)).json(), { recovered: true });
  assert.equal(calls, 2);
});

test("malformed successful JSON never becomes a cached success", async () => {
  let calls = 0;
  const cache = sourceCache(async () => ++calls === 1 ? new Response("<html>Temporary outage</html>") : Response.json({ recovered: true }));
  await assert.rejects(cache.fetchCachedResponse("https://source.example/data", 3600), { name: "SyntaxError" });
  assert.equal(cache.snapshots.size, 0);
  assert.equal((await cache.fetchCachedResponse("https://source.example/data", 3600)).status, 200);
  assert.equal(calls, 2);
});

test("the deadline aborts a request stalled before response headers", async () => {
  const cache = sourceCache((url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener("abort", () => reject(signal.reason), { once: true });
  }));
  const pending = cache.fetchCachedResponse("https://source.example/slow", 3600);
  const rejected = assert.rejects(pending, { name: "TimeoutError" });
  cache.deadlines[0].controller.abort(new DOMException("Timed out", "TimeoutError"));
  await rejected;
  assert.equal(cache.snapshots.size, 0);
});

test("the same deadline also covers a stalled response body", async () => {
  const cache = sourceCache(async (url, { signal }) => new Response(new ReadableStream({
    start(controller) {
      signal.addEventListener("abort", () => controller.error(signal.reason), { once: true });
    },
  })));
  const pending = cache.fetchCachedResponse("https://source.example/slow-body", 3600);
  const rejected = assert.rejects(pending, { name: "TimeoutError" });
  await setImmediate();
  cache.deadlines[0].controller.abort(new DOMException("Timed out", "TimeoutError"));
  await rejected;
  assert.equal(cache.snapshots.size, 0);
});

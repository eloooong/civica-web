import { unstable_cache } from "next/cache";
import { cache } from "react";

export interface SourceRetrieval {
  endpoint: string;
  retrievedAt: string;
  cacheSeconds: number;
}

export type Sourced<T> = T & { retrieval: SourceRetrieval };
export type RetrievedResponse = Response & { retrieval: SourceRetrieval };

class UncachedHttpResponse extends Error {
  constructor(readonly response: Response, readonly retrieval: SourceRetrieval) {
    super(`Source request failed (HTTP ${response.status}).`);
  }
}

// Cache the body and its retrieval time together. Request memoization applies
// to this snapshot, never to a Response whose body a caller may consume.
const readSnapshot = cache(async (endpoint: string, cacheSeconds: number) => {
  return unstable_cache(
    async () => {
      const response = await fetch(endpoint, {
        cache: "no-store",
        headers: { "User-Agent": "Civica-PH/1.0 (+https://civica.ph)" },
      });
      if (!response.ok) {
        throw new UncachedHttpResponse(response, {
          endpoint,
          retrievedAt: new Date().toISOString(),
          cacheSeconds,
        });
      }
      const body = await response.text();
      return {
        body,
        status: response.status,
        retrieval: { endpoint, retrievedAt: new Date().toISOString(), cacheSeconds },
      };
    },
    ["civica-source-response-v1", endpoint, String(cacheSeconds)],
    { revalidate: cacheSeconds }
  )();
});

/** Cached JSON response with the time its body was actually received. */
export async function fetchCachedResponse(endpoint: string, cacheSeconds: number): Promise<RetrievedResponse> {
  try {
    const snapshot = await readSnapshot(endpoint, cacheSeconds);
    const body = snapshot.status === 204 || snapshot.status === 205 ? null : snapshot.body;
    return Object.assign(new Response(body, {
      status: snapshot.status,
      headers: { "Content-Type": "application/json" },
    }), { retrieval: snapshot.retrieval });
  } catch (error) {
    // Keep source-specific HTTP error handling in the API clients. Failed
    // responses never become successful cached data or reset its timestamp.
    if (error instanceof UncachedHttpResponse) {
      return Object.assign(error.response.clone(), { retrieval: error.retrieval });
    }
    throw error;
  }
}

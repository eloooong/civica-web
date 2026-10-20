export const dynamic = "force-dynamic";

/** Application liveness only. Page checks monitor the public data journeys separately. */
export function GET() {
  return Response.json({
    status: "ok",
    service: "civica-web",
    revision: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? "local",
  }, { headers: { "Cache-Control": "no-store" } });
}

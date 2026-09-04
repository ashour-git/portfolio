export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Liveness probe for post-deploy verification and uptime monitors. */
export async function GET() {
  return Response.json(
    { ok: true, service: "mohamed-ashour-site", time: new Date().toISOString() },
    { status: 200, headers: { "cache-control": "no-store" } },
  );
}

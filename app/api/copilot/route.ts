import type { CopilotEvent } from "@/lib/copilot/types";
import { runCopilot, validateInput } from "@/lib/copilot/service";
import { RateLimiter } from "@/lib/copilot/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const limiter = new RateLimiter({ limitPerMinute: 5, limitPerHour: 30 });

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "local";
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("invalid json\n", { status: 400, headers: { "content-type": "application/x-ndjson" } });
  }

  const parsed = validateInput(body);
  if (!parsed.ok) {
    return new Response(JSON.stringify({ type: "error", code: 400, message: parsed.error }) + "\n", {
      status: 400,
      headers: { "content-type": "application/x-ndjson" },
    });
  }

  const ip = clientIp(req);
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const event of runCopilot(parsed.data, { ip, limiter })) {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        }
      } catch (err) {
        const fallback: CopilotEvent = {
          type: "error",
          code: 500,
          message: err instanceof Error ? err.message : "internal error",
        };
        controller.enqueue(encoder.encode(JSON.stringify(fallback) + "\n"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
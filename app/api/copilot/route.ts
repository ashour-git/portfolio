import type { CopilotEvent } from "@/lib/copilot/types";
import { runCopilot, validateInput, type CacheEntry } from "@/lib/copilot/service";
import { LruCache } from "@/lib/copilot/retrieval";
import { RateLimiter } from "@/lib/copilot/rate-limit";
import { hashIp, logCopilotEvent } from "@/lib/copilot/observe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const limiter = new RateLimiter({ limitPerMinute: 10, limitPerHour: 60 });
// Keyed by user-controlled text, so it must be bounded: LRU-evicts past 200 entries.
const cacheHits = new LruCache<string, CacheEntry>(200);

/** Typed 400 so the client can render the localized bad_request message. */
function badRequest(message: string): Response {
  const event: CopilotEvent = { type: "error", code: 400, kind: "bad_request", message };
  return new Response(JSON.stringify(event) + "\n", {
    status: 400,
    headers: { "content-type": "application/x-ndjson" },
  });
}

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "local";
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  const ipHash = hashIp(ip);
  const routeReq = `route-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    // Malformed bodies are abuse-shaped far more often than client bugs —
    // log the reject (no body content, ever) and answer the 400 contract.
    logCopilotEvent({ req: routeReq, ipHash, level: "warn", errorKind: "bad_request" });
    return badRequest("invalid json");
  }

  const parsed = validateInput(body);
  if (!parsed.ok) {
    // Validation messages are static strings (no user data) — safe to count
    // by kind; probes and fuzzers show up here.
    logCopilotEvent({ req: routeReq, ipHash, level: "warn", errorKind: "bad_request" });
    return badRequest(parsed.error);
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const enqueue = (event: CopilotEvent) => {
        if (req.signal.aborted) return;
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };
      const abort = () => {
        try {
          controller.close();
        } catch {
          /* stream already closed */
        }
      };
      req.signal.addEventListener("abort", abort, { once: true });
      try {
        for await (const event of runCopilot(parsed.data, { ip, limiter, cacheHits, signal: req.signal })) {
          enqueue(event);
        }
      } catch (err) {
        if (req.signal.aborted) return;
        // Safety net: never leak the raw error to the client — runCopilot
        // already emits typed, sanitized error events for provider failures.
        void err;
        const fallback: CopilotEvent = {
          type: "error",
          code: 500,
          kind: "unknown",
          message: "internal error",
        };
        enqueue(fallback);
      } finally {
        if (!req.signal.aborted) {
          try {
            controller.close();
          } catch {
            /* stream already closed */
          }
        }
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
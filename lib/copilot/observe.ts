import { createHash } from "node:crypto";

/**
 * Zero-dependency structured telemetry for the copilot endpoint.
 *
 * On-call questions this answers (one signal per question):
 *   1. What share of requests succeed vs fail, and why?  -> level + errorKind
 *   2. Is retrieval healthy and Groq spend bounded?       -> cache, retrievalMs, tokensIn/Out
 *   3. Is anyone abusing the endpoint?                   -> rateLimited, validation rejects
 *
 * Privacy rule: allowlisted numeric/enum fields only. Message content,
 * history content, and raw IPs must never reach a log line — the unit tests
 * enforce this by asserting undeclared fields are stripped.
 */

/** Opaque, stable 16-hex-char identifier for an IP. Never log raw IPs. */
export function hashIp(ip: string): string {
  return createHash("sha256").update(ip, "utf8").digest("hex").slice(0, 16);
}

export type CopilotLogLevel = "info" | "warn" | "error";

export type CopilotLogFields = {
  req: string;
  ipHash: string;
  level: CopilotLogLevel;
  mode?: string;
  lang?: string;
  intent?: string;
  confidence?: number;
  cache?: string;
  strategy?: string;
  model?: string;
  tokensIn?: number;
  tokensOut?: number;
  retrievalMs?: number;
  totalMs?: number;
  errorKind?: string;
  rateLimited?: boolean;
  retryAfterSec?: number;
  historyCount?: number;
  truncated?: boolean;
};

type Sink = (line: string) => void;

const defaultSink: Sink = (line) => {
  process.stdout.write(line + "\n");
};

/** Emits one JSON log line. Undeclared fields are stripped (see privacy rule). */
export function logCopilotEvent(fields: CopilotLogFields, sink: Sink = defaultSink): void {
  const {
    req,
    ipHash,
    level,
    mode,
    lang,
    intent,
    confidence,
    cache,
    strategy,
    model,
    tokensIn,
    tokensOut,
    retrievalMs,
    totalMs,
    errorKind,
    rateLimited,
    retryAfterSec,
    historyCount,
    truncated,
  } = fields;
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    service: "copilot",
    event: "copilot_request",
    req,
    ipHash,
    level,
    ...(mode !== undefined ? { mode } : {}),
    ...(lang !== undefined ? { lang } : {}),
    ...(intent !== undefined ? { intent } : {}),
    ...(confidence !== undefined ? { confidence } : {}),
    ...(cache !== undefined ? { cache } : {}),
    ...(strategy !== undefined ? { strategy } : {}),
    ...(model !== undefined ? { model } : {}),
    ...(tokensIn !== undefined ? { tokensIn } : {}),
    ...(tokensOut !== undefined ? { tokensOut } : {}),
    ...(retrievalMs !== undefined ? { retrievalMs } : {}),
    ...(totalMs !== undefined ? { totalMs } : {}),
    ...(errorKind !== undefined ? { errorKind } : {}),
    ...(rateLimited !== undefined ? { rateLimited } : {}),
    ...(retryAfterSec !== undefined ? { retryAfterSec } : {}),
    ...(historyCount !== undefined ? { historyCount } : {}),
    ...(truncated !== undefined ? { truncated } : {}),
  });
  sink(line);
}

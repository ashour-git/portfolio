import { test } from "node:test";
import assert from "node:assert/strict";
import { hashIp, logCopilotEvent } from "../lib/copilot/observe";

function capture(fn: (sink: (line: string) => void) => void): string[] {
  const lines: string[] = [];
  fn((line) => lines.push(line));
  return lines;
}

test("hashIp is deterministic, opaque, and stable", () => {
  const a = hashIp("203.0.113.7");
  const b = hashIp("203.0.113.7");
  assert.equal(a, b);
  assert.match(a, /^[0-9a-f]{16}$/);
  assert.ok(!a.includes("203.0.113.7"), "raw IP must not survive hashing");
  assert.notEqual(hashIp("203.0.113.8"), a);
});

test("logCopilotEvent emits one parseable JSON line with correlation fields", () => {
  const lines = capture((sink) =>
    logCopilotEvent(
      {
        req: "req-123",
        ipHash: "abc123",
        level: "info",
        mode: "general",
        intent: "project",
        cache: "miss",
        strategy: "primary",
        tokensIn: 900,
        tokensOut: 120,
        retrievalMs: 67,
        totalMs: 1500,
        historyCount: 2,
        truncated: false,
      },
      sink,
    ),
  );
  assert.equal(lines.length, 1);
  assert.ok(!lines[0].includes("\n"), "must be a single line for log ingestion");
  const parsed = JSON.parse(lines[0]) as Record<string, unknown>;
  assert.equal(parsed.service, "copilot");
  assert.equal(parsed.event, "copilot_request");
  assert.equal(parsed.req, "req-123");
  assert.equal(parsed.level, "info");
  assert.equal(parsed.tokensIn, 900);
  assert.ok(typeof parsed.ts === "string" && parsed.ts.length > 0);
});

test("logCopilotEvent drops unknown fields so callers cannot leak PII by accident", () => {
  const canary = "CANARY-SECRET-PII-12345";
  const lines = capture((sink) =>
    logCopilotEvent(
      {
        req: "req-456",
        ipHash: "def456",
        level: "info",
        message: canary,
        content: canary,
      } as unknown as Parameters<typeof logCopilotEvent>[0],
      sink,
    ),
  );
  assert.equal(lines.length, 1);
  assert.ok(!lines[0].includes(canary), "undeclared fields (e.g. message content) must be stripped");
  const parsed = JSON.parse(lines[0]) as Record<string, unknown>;
  assert.ok(!("message" in parsed) && !("content" in parsed));
});

test("logCopilotEvent supports warn/error outcomes for failures", () => {
  const lines = capture((sink) =>
    logCopilotEvent(
      {
        req: "req-789",
        ipHash: "789abc",
        level: "warn",
        errorKind: "rate_limited",
        rateLimited: true,
        retryAfterSec: 42,
        totalMs: 5,
      },
      sink,
    ),
  );
  const parsed = JSON.parse(lines[0]) as Record<string, unknown>;
  assert.equal(parsed.level, "warn");
  assert.equal(parsed.errorKind, "rate_limited");
  assert.equal(parsed.retryAfterSec, 42);
});

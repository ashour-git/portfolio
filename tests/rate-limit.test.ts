import { test } from "node:test";
import assert from "node:assert/strict";
import { RateLimiter } from "../lib/copilot/rate-limit";

test("allows up to the per-minute limit then blocks", () => {
  let t = 0;
  const rl = new RateLimiter({ limitPerMinute: 5, limitPerHour: 30, now: () => t });
  for (let i = 0; i < 5; i++) assert.equal(rl.check("1.2.3.4").ok, true);
  const blocked = rl.check("1.2.3.4");
  assert.equal(blocked.ok, false);
  assert.ok((blocked as { retryAfterSec: number }).retryAfterSec > 0);
});

test("window slides: old minute requests expire", () => {
  let t = 0;
  const rl = new RateLimiter({ limitPerMinute: 1, limitPerHour: 30, now: () => t });
  assert.equal(rl.check("ip").ok, true);
  t += 60_000;
  assert.equal(rl.check("ip").ok, true);
});

test("hourly limit is independent and stricter over time", () => {
  let t = 0;
  const rl = new RateLimiter({ limitPerMinute: 100, limitPerHour: 3, now: () => t });
  for (let i = 0; i < 3; i++) {
    assert.equal(rl.check("ip").ok, true);
    t += 30_000; // each request a fresh minute window
  }
  assert.equal(rl.check("ip").ok, false);
});

test("different IPs are isolated", () => {
  const rl = new RateLimiter({ limitPerMinute: 1, limitPerHour: 30, now: () => 0 });
  assert.equal(rl.check("a").ok, true);
  assert.equal(rl.check("b").ok, true);
});
import { test } from "node:test";
import assert from "node:assert/strict";
import { POST } from "../app/api/copilot/route";

test("invalid JSON returns 400 with an NDJSON contract", async () => {
  const res = await POST(
    new Request("http://localhost/api/copilot", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not json",
    }),
  );
  assert.equal(res.status, 400);
  assert.equal(res.headers.get("content-type"), "application/x-ndjson");
});

test("missing GROQ_API_KEY streams a stranded error event", async () => {
  const prev = process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEY;
  try {
    const res = await POST(
      new Request("http://localhost/api/copilot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: "What did you build?" }),
      }),
    );
    assert.equal(res.status, 200);
    const first = JSON.parse((await res.text()).trim().split("\n")[0]);
    assert.equal(first.type, "error");
    assert.equal(first.code, 500);
  } finally {
    if (prev) process.env.GROQ_API_KEY = prev;
  }
});

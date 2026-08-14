import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { CopilotMarkdown } from "../components/copilot-markdown";

test("copilot markdown renders RTL container for Arabic", () => {
  const html = renderToStaticMarkup(
    createElement(CopilotMarkdown, { text: "مرحبًا بك في المساعد", lang: "ar" }),
  );
  assert.match(html, /dir="rtl"/, "container must set dir=rtl for Arabic");
  assert.match(html, /data-copilot-lang="ar"/, "container must mark language");
  assert.doesNotMatch(html, /dir="ltr"/, "Arabic-only text has no LTR runs");
});

test("copilot markdown isolates LTR token runs inside Arabic text", () => {
  const html = renderToStaticMarkup(
    createElement(CopilotMarkdown, { text: "استخدم React و TypeScript هنا", lang: "ar" }),
  );
  assert.match(html, /dir="ltr"/, "English tokens must be wrapped LTR");
  assert.match(html, /class="[^"]*ltr-token[^"]*"/, "LTR tokens get isolation class");
  assert.match(html, /React/, "English token text is preserved");
});

test("copilot markdown renders LTR container for English", () => {
  const html = renderToStaticMarkup(
    createElement(CopilotMarkdown, { text: "Tell me about RestAI", lang: "en" }),
  );
  assert.match(html, /dir="ltr"/, "container must set dir=ltr for English");
});

test("copilot markdown isolates links and inline code as LTR", () => {
  const html = renderToStaticMarkup(
    createElement(CopilotMarkdown, {
      text: "see [docs](https://example.com) and `npm run build`",
      lang: "ar",
    }),
  );
  assert.match(html, /<a[^>]*dir="ltr"/, "links are LTR isolated");
  assert.match(html, /<code[^>]*dir="ltr"/, "inline code is LTR isolated");
});

/**
 * Streaming filter that drops the reasoning preamble some hosted models prepend
 * to their reply (" thinking", "Thinking Process:", "Here's a thinking
 * process:", followed by numbered/bulleted analysis in English — even when the
 * answer itself is Arabic). It operates on line boundaries so it works for both
 * heading-driven answers (EN templates) and prose answers (Arabic/non-heading):
 *
 *  - "head": decide on the first non-blank line whether a narration started
 *  - "drop": drop every line until a boundary — a markdown heading, a line with
 *    Arabic text outside a `**Label:**` bullet, or a bare prose paragraph
 *  - "stream": pass everything through untouched
 *
 * Answers that don't narrate are never buffered beyond the first line, so
 * streaming latency is unaffected.
 */

const NARRATION_START =
  /^(?:<\/?think(?:ing)?>|\[think(?:ing)?\]|\(think(?:ing)?\)|thinking\s*:?\s*$|thinking process:?|here's a thinking process:?|let me (think|analyze|consider|break|look)|i (will|need to|should) (think|analyze|consider))/i;

const BULLET = /^\s*(?:[-*]|\d+\.)\s+/;

const CATCHWORD =
  /^(?:<\/?think(?:ing)?>|thinking|here's|let me|let'?s go|proceed|done|output (?:generation|matches|will|should)|word count|final answer|verification|self[- ]correction|check(?:ing)? constraint|constraint|note|i'?ll|i will|verify|polish|ready)/i;

const HEADING = /^#{1,3}\s/;

const BOLD_BULLET = /^\s*[-*]\s+\*\*/;

function countArabic(line: string): number {
  let n = 0;
  for (const ch of line) {
    const c = ch.codePointAt(0)!;
    if (c >= 0x0600 && c <= 0x06ff) n++;
  }
  return n;
}

/** A line that clearly belongs to the real answer. */
function isBoundary(line: string): boolean {
  if (HEADING.test(line)) return true;
  if (countArabic(line) >= 2 && !BOLD_BULLET.test(line)) return true;
  if (line.trim().length > 0 && !BULLET.test(line) && !CATCHWORD.test(line)) return true;
  return false;
}

const HEAD_MAX = 80;
const MAX_DROP_LINES = 400;

/**
 * Some hosted models wrap their reasoning in `<think>...</think>` tags and put
 * the real answer AFTER the closing tag (observed in production: the reply
 * starts `<think>\nThinking Process:\n...` and the final answer follows
 * `</think>`). This filter buffers the thinking, discards it at the closing
 * tag, then streams the answer verbatim. When no tag appears at the start — a
 * clean, direct answer — it streams through after a tiny hold. If the stream
 * ends mid-thinking it falls back to NarrationFilter for a best-effort strip.
 */
const OPEN_TAG = /<think(?:ing)?>/i;
const CLOSE_TAG = /<\/think(?:ing)?>/i;
const TAG_HOLD_MAX = 200;

export class ThinkingTagFilter {
  private buf = "";
  private dropped = false;
  private streaming = false;
  private fallback = new NarrationFilter();

  push(chunk: string): string[] {
    if (this.streaming) return [chunk];
    this.buf += chunk;
    if (this.dropped) {
      const m = CLOSE_TAG.exec(this.buf);
      if (m) {
        this.streaming = true;
        const after = this.buf.slice(m.index + m[0].length);
        this.buf = "";
        return after ? [after] : [];
      }
      return [];
    }
    if (OPEN_TAG.test(this.buf)) {
      this.dropped = true;
      return [];
    }
    if (this.buf.length > TAG_HOLD_MAX) {
      this.streaming = true;
      const held = this.buf;
      this.buf = "";
      return [held];
    }
    return [];
  }

  flush(): string[] {
    if (this.streaming) return [];
    if (this.dropped) {
      const out = [...this.fallback.push(this.buf), ...this.fallback.flush()];
      this.buf = "";
      return out;
    }
    const held = this.buf;
    this.buf = "";
    return held ? [held] : [];
  }
}

export class NarrationFilter {
  private buf = "";
  private mode: "head" | "drop" | "stream" = "head";
  private droppedLines = 0;

  push(chunk: string): string[] {
    this.buf += chunk;
    const out: string[] = [];
    let nl = this.buf.indexOf("\n");
    while (nl !== -1) {
      const line = this.buf.slice(0, nl);
      this.buf = this.buf.slice(nl + 1);
      const res = this.handleLine(line);
      if (res !== null) out.push(res + "\n");
      nl = this.buf.indexOf("\n");
    }
    if (this.mode === "head" && this.buf.length >= HEAD_MAX) {
      this.mode = "stream";
      out.push(this.buf);
      this.buf = "";
    }
    return out;
  }

  flush(): string[] {
    const out: string[] = [];
    if (this.buf.length) {
      const res = this.handleLine(this.buf);
      if (res !== null) out.push(res);
      this.buf = "";
    }
    return out;
  }

  private handleLine(line: string): string | null {
    if (this.mode === "head") {
      if (line.trim() === "") return null;
      if (NARRATION_START.test(line.trim())) {
        this.mode = "drop";
        return null;
      }
      this.mode = "stream";
      return line;
    }
    if (this.mode === "drop") {
      if (line.trim() === "") return null;
      if (isBoundary(line)) {
        this.mode = "stream";
        return line;
      }
      this.droppedLines++;
      if (this.droppedLines > MAX_DROP_LINES) {
        this.mode = "stream";
        return line;
      }
      return null;
    }
    return line;
  }
}

/** Convenience: filter a whole string (for tests). */
export function stripNarration(text: string): string {
  const f = new NarrationFilter();
  const parts = [...f.push(text), ...f.flush()];
  return parts.join("");
}
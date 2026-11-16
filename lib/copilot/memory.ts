import type { ChatMessage, Lang } from "@/lib/copilot/types";
import { arabiziToEnglish, isArabizi } from "@/lib/copilot/language";
import { classifyConversation } from "@/lib/copilot/conversation";
import { safeSlice } from "@/lib/copilot/passage";

export const MAX_ANCHOR_CHARS = 300;
export const MAX_QUERY_CHARS = 300;
export const MAX_FOLLOWUP_WORDS = 8;

/** Words that only make sense against an earlier turn ("why did you choose it?").
 *  he/him/his are excluded on purpose: on this site they mean Mohamed. */
const EN_MARKERS = new Set(
  "it its that this those these they them their there same more else instead too also elaborate further".split(" "),
);
const EN_PHRASES = ["what about", "how about", "and the", "tell me more", "go deeper", "the other one"];
/** Arabic-script and Arabizi deictics / follow-up words. */
const AR_MARKERS = new Set(
  ("ده دي دا دول هذا هذه ذلك تلك هؤلاء عنه عنها فيه فيها منه منها بتاعه بتاعها كمان أكثر اكثر اكتر أكتر أيضا أيضًا ايضا كذلك " +
    "da di dah deh dol bta3o bta3ha 3ano 3anha feeh feeha kaman kman aktar").split(" "),
);
const AR_PHRASES = ["وماذا عن", "طب و", "طيب و", "و ايه عن", "وإيه عن", "وايه عن"];
const BARE_DEICTICS = new Set(["it", "that", "this", "those", "these", "them", "that one", "this one", "ده", "دي", "دا", "هذا", "هذه", "ذلك", "da", "di"]);

function words(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[؟?!.,;:()"'«»]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function stripWaw(w: string): string {
  // Arabic conjunction prefix: "وفيها" -> "فيها"
  return /^[وف][؀-ۿ]{2,}$/.test(w) ? w.slice(1) : w;
}

export function isFollowUp(message: string): boolean {
  const ws = words(message);
  if (ws.length === 0 || ws.length > MAX_FOLLOWUP_WORDS) return false;
  const joined = ws.join(" ");
  if (BARE_DEICTICS.has(joined)) return true;
  if (ws.some((w) => EN_MARKERS.has(w) || AR_MARKERS.has(w) || AR_MARKERS.has(stripWaw(w)))) return true;
  return [...EN_PHRASES, ...AR_PHRASES].some((p) => joined.includes(p));
}

function isEligibleAnchor(m: unknown): m is ChatMessage {
  if (typeof m !== "object" || m === null) return false;
  const { role, content } = m as { role?: unknown; content?: unknown };
  if (role !== "user" || typeof content !== "string") return false;
  const text = content.trim();
  if (words(text).length < 2) return false;
  try {
    return !classifyConversation(text).casual;
  } catch {
    return false;
  }
}

/** Retrieval text in the embedder's language: Arabizi is glossed to English keywords. */
function forRetrieval(s: string): string {
  return isArabizi(s) ? arabiziToEnglish(s) : s;
}

/**
 * Builds the RETRIEVAL query for a turn (the provider prompt keeps the raw
 * message). A short follow-up with a deictic/follow-up marker is anchored to
 * the last substantive user turn so "why did you choose it over Pinecone?"
 * still retrieves what "it" referred to. Pure; never throws.
 */
export function buildRetrievalQuery(input: { message: string; history?: unknown; lang?: Lang }): {
  query: string;
  expanded: boolean;
} {
  const message = typeof input?.message === "string" ? input.message.trim() : "";
  const base = { query: forRetrieval(message), expanded: false };
  try {
    if (!message || !isFollowUp(message)) return base;
    const history = Array.isArray(input.history) ? input.history : [];
    let anchor: string | undefined;
    for (let i = history.length - 1; i >= 0; i--) {
      if (isEligibleAnchor(history[i])) {
        anchor = (history[i] as ChatMessage).content.trim();
        break;
      }
    }
    if (!anchor) return base;
    const tail = forRetrieval(message);
    const room = Math.max(0, Math.min(MAX_ANCHOR_CHARS, MAX_QUERY_CHARS - tail.length - 1));
    const head = safeSlice(forRetrieval(safeSlice(anchor, MAX_ANCHOR_CHARS)), room).trim();
    if (!head) return base;
    return { query: safeSlice(`${head} ${tail}`, MAX_QUERY_CHARS), expanded: true };
  } catch {
    return base;
  }
}

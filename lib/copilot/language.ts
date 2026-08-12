import type { Lang } from "@/lib/copilot/types";

const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const LATIN_RE = /[A-Za-z\u00C0-\u024F]/;

export function detectLanguage(message: string): Lang {
  let ar = 0;
  let en = 0;
  let first: "ar" | "en" | null = null;
  for (const ch of message) {
    if (ARABIC_RE.test(ch)) {
      if (first === null) first = "ar";
      ar++;
    } else if (LATIN_RE.test(ch)) {
      if (first === null) first = "en";
      en++;
    }
  }
  if (ar === 0 && en === 0) return "en";
  if (first === "ar") return "ar";
  return ar > en ? "ar" : "en";
}
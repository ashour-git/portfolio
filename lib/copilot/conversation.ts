import type { Lang } from "@/lib/copilot/types";
import { detectLanguage } from "@/lib/copilot/language";
import { INTENT_RULES } from "@/lib/copilot/intent";

/**
 * Conversation intent layer — runs BEFORE the portfolio RAG pipeline.
 *
 * Its only job is to decide whether a message is casual chit-chat (greeting,
 * thanks, farewell, help, clarification) or an actual portfolio query. Casual
 * messages are answered deterministically with a short reply and NEVER trigger
 * retrieval, grounding, or knowledge-base language.
 *
 * Routing rule (see spec §1, §4):
 *   casual phrase present  AND  no portfolio signal  -> casual
 *   otherwise                                       -> portfolio (go to RAG)
 *
 * This keeps "أزيك يا محمد" casual while "مين محمد" and
 * "أزيك؟ Tell me about RestAI" still reach the portfolio pipeline.
 */

export type CasualSubtype =
  | "greeting"
  | "farewell"
  | "thanks"
  | "acknowledgement"
  | "casual_question"
  | "clarification"
  | "help";

export type ConversationClassification =
  | { casual: true; subtype: CasualSubtype; language: Lang; shouldRetrieve: false }
  | { casual: false; language: Lang };

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[؟?！!.,;:()\[\]"'`«»]/g, " ")
    // strip Arabic tashkeel / diacritics so أزيك === ازيك
    .replace(/[ؽ-ؿݐ-ݿࢠ-ࣿ٠-٩]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function hasPhrase(norm: string, phrase: string): boolean {
  if (!phrase) return false;
  if (norm === phrase) return true;
  return new RegExp(
    `(^|\\s)${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`,
    "i",
  ).test(norm);
}

/**
 * Strong portfolio signals. If any of these appear, the message is treated as a
 * portfolio query even if it also contains a casual token (e.g. mixed input).
 * NB: a bare "محمد" is intentionally NOT a signal — it appears in greetings.
 */
/**
 * Coarse portfolio signals. Anything matching one of these is treated as a
 * portfolio query even if it also contains a casual token. The conversation
 * layer reuses the canonical intent rules (INTENT_RULES) as its generic
 * portfolio phrases to avoid two diverging sources of truth; the explicit
 * list below adds the conversation-specific signals those rules don't cover
 * (project names, tech terms, and who-is-Mohamed phrases).
 */
const PORTFOLIO_SIGNALS: string[] = [
  ...Object.values(INTENT_RULES).flat(),
  // typo-tolerant recruiter signals (common misspellings, informal)
  "whay", "whyy", "hie you", "hire u", "hire me", "hir you", "whay i should", "why i should hire",
  // project names
  "restai", "restaurant ai", "storefy", "text2sql", "text-to-sql", "text to sql",
  "semantic book", "book recommender", "kepler", "kepler vision", "hand gesture",
  "gesture", "semantic recommender",
  // resources / navigation
  "github", "linkedin", "resume", "cv", "سيرة", "سيرتك", "السيرة الذاتية",
  // tech
  "rag", "llm", "mlops", "computer vision", "forecasting", "forecast", "embedding",
  "vector", "pgvector", "fastapi", "pytorch", "mlflow", "lightgbm", "chromadb",
  "langchain", "opencv", "yolov", "resnet", "cnn", "transformer", "agentic",
  "تعلّم آلي", "تعلم آلي", "ذكاء اصطناعي", "نموذج",
  // who-is-Mohamed (specific, not bare محمد)
  "مين محمد", "من هو محمد", "عرفني ب", "احكيلي عن محمد", "عن محمد", "خبرة محمد",
  "tell me about mohamed", "who is mohamed", "who is mohamed ashour", "about mohamed",
  // work / projects not covered by INTENT_RULES (protect mixed messages)
  "مشاريع", "أهم مشاريع", "best project", "top project",
  "وظيفة", "شغلك", "شغل محمد", "توظيف",
  "case study", "دراسة حالة",
];

const CASUAL_PATTERNS: Record<CasualSubtype, string[]> = {
  greeting: [
    "أزيك", "ازيك", "إزيك", "ازاي", "عامل إيه", "عامل ايه", "عامل اي", "يا محمد",
    "مرحبا", "مرحباً", "أهلا", "اهلا", "السلام عليكم", "سلام", "هلا", "هاي", "هي",
    "صباح الخير", "مساء الخير",
    "hi", "hello", "hey", "hii", "heyy", "good morning", "good evening", "good afternoon",
    "how are you", "how are u", "how r u", "how's it going", "how is it going",
    "how are things", "how have you been", "what's up", "whats up", "wassup", "sup", "yo",
    "howdy", "greetings", "hi there", "hello there", "hey there", "قول أزيك", "قول ازيك",
    "عامل ايه يا محمد", "ازيك يا محمد",
  ],
  casual_question: [
    "how are you", "what's up", "what are you", "what r u", "عامل إيه", "أزيك",
  ],
  farewell: [
    "باي", "مع السلامة", "يلا بقى", "يلا", "وداعا", "وداعاً", "في امان الله",
    "تصبح على خير", "باي باي",
    "bye", "goodbye", "good bye", "see you", "see ya", "take care", "farewell", "later",
    "cya", "good night", "bye bye",
  ],
  thanks: [
    "شكرا", "شكراً", "شكرا جزيلا", "شكراً جداً", "الف شكر", "متشكر", "متشكرة", "تسلم",
    "thanks", "thank you", "thank u", "thanx", "appreciate it", "much appreciated",
    "thanks a lot", "thank you so much", "thanks so much", "welcome", "you're welcome",
  ],
  acknowledgement: [
    "تمام", "حاضر", "ممتاز", "جميل", "اوكي", "اوك", "حلو", "ماشي", "خلاص", "كده تمام",
    "ok", "okay", "got it", "understood", "cool", "nice", "great", "awesome", "perfect",
    "sounds good", "alright", "noted", "sure", "yes", "yep", "yup", "nope", "interesting",
    "gotcha", "sure thing", "makes sense",
  ],
  clarification: [
    "مش فاهم", "مش فاهمة", "إيه قصدك", "ايه قصدك", "مقصدش", "مش واضح", "عايز أفهم",
    "i don't understand", "dont understand", "what do you mean", "can you clarify",
    "say that again", "explain", "مش فاهم قصدك",
  ],
  help: [
    "ممكن تساعدني", "ممكن مساعدة", "عايز مساعدة", "ازاي استخدمك", "إزاي استخدمك",
    "تقدر تساعدني", "محتاج مساعدة", "عندي سؤال", "ممكن أسألك", "تقدر تساعد",
    "help", "can you help", "could you help", "i need help", "how do i use you",
    "what can you do", "how does this work", "help me", "مساعدة",
  ],
};

const CASUAL_RESPONSES: Record<CasualSubtype, { ar: string; en: string }> = {
  greeting: {
    ar: "أنا تمام. أنا المساعد الهندسي لمحمد، ومجهّز أساعدك تستكشف خبرته ومشاريعه وقراراته الهندسية. اسألني مثلاً عن RestAI أو خبرته في RAG.",
    en: "I'm doing well. I'm Mohamed's Engineering Copilot — here to help you explore his projects, experience, and engineering decisions. Ask me about any project or technology.",
  },
  casual_question: {
    ar: "أنا المساعد الهندسي لمحمد. مهمتي إني أساعدك تفهم شغله وقراراته الهندسية. اسألني عن أي مشروع أو تقنية وأنا أجاوبك من المصادر.",
    en: "I'm Mohamed's Engineering Copilot. My job is to help you understand his work and the engineering decisions behind it. Ask me about any project or technology and I'll answer from the sources.",
  },
  farewell: {
    ar: "مع السلامة. لو حبيت ترجع، أنا هنا أساعدك تستكشف شغل محمد في أي وقت.",
    en: "Take care. If you want to come back, I'm here to help you explore Mohamed's work anytime.",
  },
  thanks: {
    ar: "العفو. لو حابب تكمل، ممكن تسألني عن أي مشروع أو قرار هندسي.",
    en: "You're welcome. You can ask me about any project or engineering decision.",
  },
  acknowledgement: {
    ar: "تمام. لو حابب تكمل، ممكن تسألني عن أي مشروع أو قرار هندسي.",
    en: "Got it. If you want to keep going, ask me about any project or engineering decision.",
  },
  clarification: {
    ar: "قصدي إني المساعد الهندسي لمحمد — أساعدك تفهم شغله والقرارات وراه. اسألني عن أي مشروع أو تقنية وأحددّلك المصادر.",
    en: "To clarify: I'm Mohamed's Engineering Copilot. I help you understand his work and the decisions behind it. Ask me about any project or technology and I'll point you to the sources.",
  },
  help: {
    ar: "أنا المساعد الهندسي لمحمد. أقدر أجاوب على أسئلة عن مشاريعه (زي RestAI وStorefy)، ومعمارياتها، وقراراته الهندسية، ومهاراته، وخبرته. جرّب تسأل: «احكيلي عن RestAI» أو «اشرح معمارية RAG».",
    en: 'I\'m Mohamed\'s Engineering Copilot. I can answer questions about his projects (like RestAI and Storefy), their architectures, engineering decisions, skills, and experience. Try: "Tell me about RestAI" or "Explain the RAG architecture".',
  },
};

export function casualReply(subtype: CasualSubtype, lang: Lang): string {
  return CASUAL_RESPONSES[subtype][lang];
}

export function classifyConversation(message: string): ConversationClassification {
  const norm = normalize(message);
  const lang = detectLanguage(message);

  if (PORTFOLIO_SIGNALS.some((s) => hasPhrase(norm, s) || norm.includes(s))) {
    return { casual: false, language: lang };
  }

  // Casual tokens are short ("yo", "hi", "ok", "yes", "sup") and MUST be matched
  // on word boundaries only — a naive substring match would fire on "you",
  // "this", "yesterday", "support", etc. and wrongly suppress retrieval.
  // Also, a greeting followed by substantive content (e.g. "hi, why should I hire you")
  // must NOT be treated as casual — the RAG pipeline should handle it.
  for (const subtype of Object.keys(CASUAL_PATTERNS) as CasualSubtype[]) {
    for (const p of CASUAL_PATTERNS[subtype]) {
      if (hasPhrase(norm, p)) {
        const phraseWords = p.split(/\s+/).filter(Boolean).length;
        const normWords = norm.split(/\s+/).filter(Boolean).length;
        // If message has substantially more words than the casual phrase, it's a mixed query, not pure casual
        if (normWords > phraseWords + 2) continue;
        // If remaining text contains portfolio-like keywords, don't treat as casual
        const remaining = norm.replace(new RegExp(`(^|\\s)${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`, "i"), " ").trim();
        if (/(hire|whay|why|recruit|job|work|project|restai|rag|resume|experience|should)/i.test(remaining)) continue;
        return { casual: true, subtype, language: lang, shouldRetrieve: false };
      }
    }
  }

  return { casual: false, language: lang };
}

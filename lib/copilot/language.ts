import type { Lang } from "@/lib/copilot/types";

const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const LATIN_RE = /[A-Za-z\u00C0-\u024F]/;

/* ---------- Franco-Arabic (Arabizi): Latin-script Egyptian Arabic ---------- */

/** word -> English gloss used for retrieval ("" = function word, dropped). */
const ARABIZI_STRONG: Record<string, string> = {
  ezay: "how", ezzay: "how", izay: "how", izzay: "how", ezai: "how",
  ezayak: "", ezayek: "", ezzayak: "", izayak: "", ezayko: "", ahlan: "", shokran: "thanks", shukran: "thanks",
  "3ayez": "want", "3ayz": "want", "3awez": "want", "3ayza": "want", "3awza": "want",
  a3raf: "know", a3rf: "know", ta3raf: "know", momken: "can", mumkin: "can", momkn: "can",
  ya3ni: "", keda: "", kda: "", feen: "where", fein: "where", emta: "when", imta: "when", leh: "why", leeh: "why",
  bta3: "", bta3o: "", bta3ak: "", bta3ek: "", bta3ha: "", bta3to: "",
  "3n": "about", "3an": "about", "3ano": "about", "3anha": "about", "3ala": "", "3la": "", ma3a: "with", m3a: "with",
  a7san: "best", a7sn: "best", a7la: "best", gamed: "great",
  "3amal": "built", "3amalt": "built", "3amalto": "built", "3amaltoh": "built", "3emel": "built", "3ml": "built",
  shoghl: "work", shoghlo: "work", shoghlak: "work", eshtaghal: "worked", eshta8al: "worked", eshtaghalt: "worked",
  t2oly: "tell", te2oly: "tell", "2oly": "tell", "2olly": "tell", "2oli": "tell", e7kili: "tell", e7kily: "tell", e7ky: "tell",
  enta: "", enty: "", inta: "", howa: "", hwa: "", heya: "", msh: "not", kaman: "also", kman: "also",
  khebra: "experience", "5ebra": "experience", khebrto: "experience", "5ebrto": "experience", khebrtak: "experience",
  mashro3: "project", mashroo3: "project", mashari3: "projects", mashare3: "projects", mohandes: "engineer",
  fahem: "understand", fahim: "understand", fahma: "understand", so2al: "question", es2al: "ask",
  esta5dem: "used", esta5dam: "used", estakhdam: "used", "3ashan": "because", "3shan": "because", "7aga": "thing", "7agat": "things",
};
/** Ambiguous with English/other languages — count half. */
const ARABIZI_WEAK: Record<string, string> = {
  eh: "what", eih: "what", el: "", ana: "", mesh: "not", kam: "how many", da: "", dah: "", deh: "", salam: "",
};
const EN_FUNCTION_WORDS = new Set(
  "the a an is are was were what which who how why when where do does did you your i me my to of in on for and with about can tell show explain this that it best top".split(" "),
);
const DIGIT_LETTERS = /[2356789]/;

/** Latin token that uses Arabizi digit-letters (3ayez, a7san, t2oly) — not a tech id (k8s, b2b, gpt4o, llama3b, web3). */
function isDigitWord(w: string): boolean {
  if (!/\d/.test(w) || !/[a-z]/.test(w) || !DIGIT_LETTERS.test(w)) return false;
  if ((w.match(/[a-z]/g) ?? []).length < 3) return false; // b2b, k8s, e2e, h2o, 3d, 2fa
  if (/\d[^aeiou\d]{0,2}$/.test(w)) return false; // web3, ec2, llama3b, qwen2vl, yolov5s
  if (/^[a-z]{2,}2[a-z]{2,}$/.test(w)) return false; // text2sql, word2vec, seq2seq, pix2pix
  return true;
}

function latinWords(message: string): string[] {
  return message.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

/** Conservative Franco-Arabic detector: lexicon + digit-letter evidence must outweigh English function words. */
export function isArabizi(message: string): boolean {
  if (typeof message !== "string" || ARABIC_RE.test(message)) return false;
  const words = latinWords(message).filter((w) => /[a-z]/.test(w));
  if (words.length === 0) return false;
  let lex = 0;
  let digit = 0;
  let en = 0;
  for (const w of words) {
    if (Object.hasOwn(ARABIZI_STRONG, w)) lex += 1;
    else if (Object.hasOwn(ARABIZI_WEAK, w)) lex += 0.5;
    else if (isDigitWord(w)) digit += 1;
    else if (EN_FUNCTION_WORDS.has(w)) en += 1;
  }
  const score = lex + digit;
  // A lexicon hit is mandatory: digit-letters alone also appear in tech ids.
  if (lex < 1 || score <= en) return false;
  return score >= 2 || score / words.length >= 0.34;
}

/** English gloss of an Arabizi message for the English-only embedder/BM25; non-Arabizi words (RestAI, project) pass through. */
export function arabiziToEnglish(message: string): string {
  const out: string[] = [];
  for (const raw of message.split(/\s+/)) {
    const w = raw.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");
    if (!w) continue;
    const gloss = ARABIZI_STRONG[w] ?? ARABIZI_WEAK[w];
    if (gloss !== undefined) {
      if (gloss) out.push(gloss);
    } else if (!isDigitWord(w)) {
      out.push(raw.replace(/[?!.,؟]+$/g, ""));
    }
  }
  return out.length > 0 ? out.join(" ") : message;
}

/* ---------- Arabic dialect ---------- */

const EGYPTIAN_MARKERS = new Set(
  ("عايز عايزة عاوز عاوزة ايه إيه ازاي إزاي ازيك أزيك ليه فين امتى إمتى ده دي دول دا بتاع بتاعك بتاعه بتاعها بتاعته " +
    "كده كدا مش احكيلي احكيلنا احكي قولي قوللي اوي أوي حاجة حاجات عشان علشان بقى خالص لسه برضه برضو زي مين اللي " +
    "عملت عملته عملتها شغلك شغله اشتغلت اشتغل").split(" "),
);

/** "egyptian" for Egyptian colloquial (Arabic script or Arabizi), "msa" for other Arabic, null for non-Arabic turns. */
export function detectDialect(message: string): "egyptian" | "msa" | null {
  if (typeof message !== "string" || detectLanguage(message) !== "ar") return null;
  if (isArabizi(message)) return "egyptian";
  for (const m of message.matchAll(/[؀-ۿ]+/g)) {
    const w = m[0].replace(/[ً-ْ]/g, "");
    if (EGYPTIAN_MARKERS.has(w) || (/^[وف]/.test(w) && EGYPTIAN_MARKERS.has(w.slice(1)))) return "egyptian";
  }
  return "msa";
}

/* ---------- other Latin-script reply languages ---------- */

export type ReplyLanguage = "fr" | "es" | "de" | "pt" | "it" | "tr";

export const REPLY_LANGUAGE_NAMES: Record<ReplyLanguage, string> = {
  fr: "French", es: "Spanish", de: "German", pt: "Portuguese", it: "Italian", tr: "Turkish",
};

const STOPWORDS_BY_LANG: Record<ReplyLanguage, Set<string>> = {
  fr: new Set("le la les des est une du quel quelle quels quelles pourquoi comment qui que quoi avec pour dans ses sa ces mes vous nous tu il elle sont fait projet projets meilleur peux pouvez parle parlez moi est-ce expérience compétences travail aussi très".split(" ")),
  es: new Set("el los las una unos es qué que cuál cuáles por cómo como con para sus mis proyecto proyectos mejor experiencia habilidades trabajo hizo puedes dime sobre del está son muy también quién cuántos tiene tienes".split(" ")),
  de: new Set("der das und ist ein eine wie warum welche welches mit für nicht sind hast du ich mir über seine sein ihre projekt projekte erfahrung beste besten kannst erzähl erzähle auch sehr wer".split(" ")),
  pt: new Set("os um uma é são qual quais porque como com para seus suas projeto projetos melhor experiência habilidades trabalho você fez pode conte sobre dos das não também muito ele quem".split(" ")),
  it: new Set("il lo gli della del di che è sono qual quale quali perché con suoi sue progetto progetti migliore esperienza competenze lavoro puoi dimmi parlami anche molto chi cosa una uno".split(" ")),
  tr: new Set("ne nedir neden nasıl hangi bir ve ile için bu şu mi mı mu mü en iyi proje projeler projesi deneyim deneyimi beceri yetenekleri yaptı yaptığı anlat bana onun var nerede kim kaç çok".split(" ")),
};

const EN_STOPWORDS = new Set(
  "the a an is are was were what which who how why when where do does did you your i me my to of in on for and with about can tell show explain this that it its his he him best top".split(" "),
);

/** Conservative stopword vote for French/Spanish/German/Portuguese/Italian/Turkish; null means English (or unsure). */
export function detectReplyLanguage(message: string): ReplyLanguage | null {
  if (typeof message !== "string" || ARABIC_RE.test(message)) return null;
  const words = message.toLowerCase().match(/\p{L}+/gu) ?? [];
  if (words.length < 2) return null;
  const en = words.filter((w) => EN_STOPWORDS.has(w)).length;
  const scores = (Object.keys(STOPWORDS_BY_LANG) as ReplyLanguage[])
    .map((l) => ({ l, n: words.filter((w) => STOPWORDS_BY_LANG[l].has(w)).length }))
    .sort((a, b) => b.n - a.n);
  const [best, second] = scores;
  if (best.n < 2 || best.n <= en || best.n === second.n) return null;
  return best.l;
}

export function detectLanguage(message: string): Lang {
  if (isArabizi(message)) return "ar";
  // Language is decided by the prose, not by letter volume: an English question
  // that names an Arabic document ("Tell me about السيرة الذاتية") is still an
  // English turn, and an Arabic greeting followed by a full English question
  // should answer in English. Counting *words* per script keeps long technical
  // terms from outvoting the sentence they sit in; ties fall back to the first
  // scripted character so "اشرح لي RAG architecture في RestAI" stays Arabic.
  let arWords = 0;
  let enWords = 0;
  let first: "ar" | "en" | null = null;

  for (const word of message.split(/\s+/)) {
    let ar = 0;
    let en = 0;
    for (const ch of word) {
      if (ARABIC_RE.test(ch)) {
        if (first === null) first = "ar";
        ar++;
      } else if (LATIN_RE.test(ch)) {
        if (first === null) first = "en";
        en++;
      }
    }
    if (ar === 0 && en === 0) continue;
    if (ar >= en) arWords++;
    else enWords++;
  }

  if (arWords === 0 && enWords === 0) return "en";
  if (enWords === 0) return "ar";
  if (arWords === enWords) return first === "ar" ? "ar" : "en";
  return arWords > enWords ? "ar" : "en";
}

export const TECH_TERMS: string[] = [
  "Next.js", "scikit-learn", "TensorFlow", "LangChain", "Transformers", "TypeScript",
  "PostgreSQL", "Kubernetes", "LightGBM", "XGBoost", "Redis", "MongoDB", "Qdrant",
  "Milvus", "Airflow", "Python", "Jupyter", "React", "Vercel", "pgvector", "FastAPI",
  "PyTorch", "MLflow", "MLOps", "GitHub", "LinkedIn", "Docker", "OpenCV", "Kafka",
  "LLMs", "LLM", "RAG", "API", "APIs",
];

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function buildTokenPattern(terms: string[]): RegExp {
  const sorted = [...terms].sort((a, b) => b.length - a.length).map(escapeRe);
  const termAlt = sorted.map((t) => `(?<![A-Za-z0-9])${t}(?![A-Za-z0-9])`).join("|");
  return new RegExp(
    [
      "(?:https?://|www\\.)[^\\s<>()\\[\\]]+",
      "[\\w.+-]+@[\\w-]+(?:\\.[\\w-]+)+",
      "[~≈±]?\\d[\\d,]*(?:\\.\\d+)?(?:\\s*(?:ms|MB|GB|KB|s|%))?(?:\\s*[/+]\\s*\\d+)?(?:\\s*\\+)?",
      termAlt,
    ].join("|"),
    "giu",
  );
}

export type BidiSegment = { text: string; ltr: boolean };

export function isolateLtrTokens(text: string): BidiSegment[] {
  const pattern = buildTokenPattern(TECH_TERMS);
  const segments: BidiSegment[] = [];
  let last = 0;
  for (const m of text.matchAll(pattern)) {
    const start = m.index ?? 0;
    if (start > last) segments.push({ text: text.slice(last, start), ltr: false });
    segments.push({ text: m[0], ltr: true });
    last = start + m[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last), ltr: false });
  return segments;
}
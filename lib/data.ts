export const profile = {
  name: "Mohamed Ashour",
  roles: ["AI Engineer", "ML Engineer", "LLM Engineer"],
  location: "Cairo, Egypt",
  email: "muhamed.3ashour@gmail.com",
  linkedin: "https://www.linkedin.com/in/mohamedashour-ai",
  github: "https://github.com/ashour-git",
  resume: "/resume.pdf",
};

export const heroStats = [
  { label: "Role", value: "AI Engineer @ SustainGRC" },
  { label: "Focus", value: "LLMs · RAG · MLOps · CV" },
  { label: "Ship", value: "Production, end-to-end" },
  { label: "Based in", value: "Cairo, Egypt" },
];

export type Stat = { value: string; label: string };

export const stats: Stat[] = [
  { value: "18/18", label: "security tests passing" },
  { value: "162", label: "automated tests written" },
  { value: "7,000+", label: "books in the semantic index" },
  { value: "~67ms", label: "average retrieval latency" },
];

export type GithubStat = { value: string; label: string };

export const githubStats: GithubStat[] = [
  { value: "15+", label: "public repositories" },
  { value: "6", label: "AI/ML projects featured" },
  { value: "5", label: "disciplines · LLM CV ML data" },
  { value: "CI", label: "tests via GitHub Actions" },
];

export type Project = {
  index: string;
  title: string;
  tagline: string;
  summary?: string;
  stack: string[];
  href: string;
  caseStudy?: string;
  note?: string;
  domain: string;
  featured?: boolean;
  impact?: string[];
  image?: string;
  demo?: string;
  gradient: string;
};

export const projects: Project[] = [
  {
    index: "01",
    title: "RestAI",
    tagline:
      "A production restaurant-management SaaS with an LLM-powered RAG assistant and a demand-forecasting engine.",
    summary:
      "A RAG assistant grounded in live menu and operational data answers staff questions in seconds, while an Optuna-tuned LightGBM forecaster plans demand over lag and rolling-window features.",
    stack: ["FastAPI", "Next.js", "LightGBM", "Groq Llama 3.3", "pgvector", "RAG"],
    href: "https://github.com/ashour-git/Restaurant_AI",
    caseStudy: "https://github.com/ashour-git/Restaurant_AI",
    note: "forecasting · RAG",
    domain: "LLM & Forecasting",
    featured: true,
    impact: ["162 automated tests", "Optuna-tuned forecasts", "RAG over live data"],
    gradient: "from-indigo-500 via-violet-500 to-fuchsia-500",
  },
  {
    index: "02",
    title: "Storefy",
    tagline:
      "AI-native e-commerce with wildcard-subdomain multi-tenancy and per-tenant data isolation.",
    summary:
      "A scalable AI e-commerce foundation — natural-language POS, per-tenant isolation, and generative storefront onboarding.",
    stack: ["Next.js 15", "TypeScript", "Drizzle ORM", "PostgreSQL", "Groq Llama 3.3", "Inngest"],
    href: "https://github.com/ashour-git/storefy",
    caseStudy: "https://github.com/ashour-git/storefy",
    note: "generative onboarding",
    domain: "Backend & Agentic AI",
    gradient: "from-sky-500 via-blue-500 to-indigo-500",
  },
  {
    index: "03",
    title: "Text-to-SQL Generator",
    tagline:
      "Natural language to executable, validated SQL over LLM APIs — with defense-in-depth guards.",
    summary:
      "A validator, injection guards, and deterministic checks translate user intent into SQL that only executes when it passes every gate.",
    stack: ["Python", "Azure OpenAI GPT-4o", "GitHub Actions"],
    href: "https://github.com/ashour-git/Text2SQL-Generator",
    caseStudy: "https://github.com/ashour-git/Text2SQL-Generator",
    note: "18/18 security tests",
    domain: "LLM & Backend",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
  },
  {
    index: "04",
    title: "Hand Gesture Recognition",
    tagline:
      "Real-time hand-gesture recognition for human-computer interaction using deep learning and computer vision.",
    summary:
      "A deep-learning pipeline that recognizes gestures from live camera input for HCI, VR, and accessibility applications.",
    stack: ["Python", "Deep Learning", "Computer Vision", "OpenCV"],
    href: "https://github.com/ashour-git/hand_gesture_reco",
    caseStudy: "https://github.com/ashour-git/hand_gesture_reco",
    note: "real-time inference",
    domain: "Computer Vision",
    gradient: "from-rose-500 via-pink-500 to-fuchsia-500",
  },
  {
    index: "05",
    title: "Semantic Book Recommender",
    tagline:
      "Semantic-search recommendation over 7,000+ books using vector embeddings — under 70 ms per query.",
    summary:
      "Converts books to vector embeddings, then retrieves contextually similar titles with no API cost.",
    stack: ["Python", "sentence-transformers", "ChromaDB", "LangChain"],
    href: "https://github.com/ashour-git/semantic-book-recommender",
    caseStudy: "https://github.com/ashour-git/semantic-book-recommender",
    note: "7k+ books · ~67 ms",
    domain: "Recommendation",
    gradient: "from-amber-500 via-orange-500 to-rose-500",
  },
  {
    index: "06",
    title: "Kepler Vision",
    tagline:
      "A computer-vision exploration focused on capable, production-minded vision models and clean inference pipelines.",
    stack: ["Python", "Computer Vision", "PyTorch"],
    href: "https://github.com/ashour-git/Kepler-Vision",
    caseStudy: "https://github.com/ashour-git/Kepler-Vision",
    domain: "Computer Vision",
    gradient: "from-slate-500 via-zinc-500 to-neutral-500",
  },
];

export const projectFilters = [
  "All",
  "LLM",
  "Computer Vision",
  "Recommendation",
  "Backend",
  "Forecasting",
];

export type Role = {
  title: string;
  company: string;
  period: string;
  context?: string;
  points: string[];
};

export const experience: Role[] = [
  {
    title: "AI Engineer",
    company: "SustainGRC",
    period: "2026 — Present",
    context: "Production AI, shared across an enterprise SaaS platform",
    points: [
      "Ship AI features end to end — data pipelines, model serving, API surface, and observability.",
      "Build RAG and LLM applications on Azure AI Foundry with Anthropic Claude and OpenAI models.",
      "Engineer data pipelines and backend services for real multi-tenant workloads.",
      "Drive experimentation and evaluation to ship reliable model behavior at scale.",
    ],
  },
  {
    title: "Data Engineer",
    company: "SustainGRC",
    period: "2025 — 2026",
    points: [
      "Shipped a Text-to-SQL feature translating natural language into executable SQL via GPT-4o.",
      "Automated backup and disaster-recovery pipelines with integrity-validation checksums.",
      "Applied FAIR data principles and automation across data engineering.",
    ],
  },
  {
    title: "Machine Learning",
    company: "CodeAlpha",
    period: "2024",
    points: [
      "Fine-tuned a ResNet-50 image classifier for a computer-vision task.",
      "Built a music recommendation prototype using collaborative filtering.",
    ],
  },
];

export type SkillGroup = { title: string; items: string[] };

export const skills: SkillGroup[] = [
  {
    title: "LLM Engineering",
    items: ["RAG", "Agentic AI", "Prompt engineering", "Vector search", "Embeddings", "Fine-tuning"],
  },
  {
    title: "Machine Learning",
    items: ["LightGBM", "Scikit-Learn", "PyTorch", "Optuna", "MLflow", "Forecasting"],
  },
  {
    title: "Backend AI",
    items: ["FastAPI", "Next.js", "Node.js", "PostgreSQL", "Redis", "SQLAlchemy"],
  },
  {
    title: "MLOps",
    items: ["Azure AI Foundry", "Azure OpenAI", "Docker", "GitHub Actions", "CI/CD"],
  },
  {
    title: "Computer Vision",
    items: ["OpenCV", "YOLOv5", "MediaPipe", "ResNet-50", "CNNs"],
  },
  {
    title: "Cloud",
    items: ["Azure", "Docker Compose", "GitHub", "Vercel", "Linux"],
  },
  {
    title: "Data Engineering",
    items: ["PostgreSQL", "Pandas", "Pipelines", "ETL", "FAIR data"],
  },
];

export const insights = [
  {
    index: "W1",
    title: "Grounding a RAG assistant in real ops data",
    body: "pgvector, embeddings, and sub-second retrieval over live operational data.",
    href: "https://github.com/ashour-git/Restaurant_AI",
    tag: "Engineering note",
  },
  {
    index: "W2",
    title: "Making Text-to-SQL production-safe",
    body: "How a validator, injection guards, and 18/18 tests turn a raw LLM into a usable tool.",
    href: "https://github.com/ashour-git/Text2SQL-Generator",
    tag: "Engineering note",
  },
  {
    index: "W3",
    title: "Recommenders without an API bill",
    body: "Vector embeddings and semantic search over 7,000+ books at ~67 ms.",
    href: "https://github.com/ashour-git/semantic-book-recommender",
    tag: "Engineering note",
  },
];
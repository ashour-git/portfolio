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

export type Project = {
  index: string;
  title: string;
  tagline: string;
  stack: string[];
  href: string;
  note?: string;
  domain: string;
};

export const projects: Project[] = [
  {
    index: "01",
    title: "RestAI",
    tagline:
      "Production restaurant-management SaaS. LLM-powered RAG assistant grounded in live menu and operational data, paired with a demand-forecasting engine.",
    stack: ["FastAPI", "Next.js", "LightGBM", "Groq Llama 3.3", "pgvector", "RAG"],
    href: "https://github.com/ashour-git/Restaurant_AI",
    note: "forecasting · 162 tests",
    domain: "LLM · Forecasting",
  },
  {
    index: "02",
    title: "Storefy",
    tagline:
      "AI-native e-commerce platform with wildcard-subdomain multi-tenancy, per-tenant data isolation, and natural-language data access.",
    stack: ["Next.js 15", "TypeScript", "Drizzle ORM", "PostgreSQL", "Groq Llama 3.3", "Inngest"],
    href: "https://github.com/ashour-git/storefy",
    note: "generative onboarding",
    domain: "Backend · Agentic AI",
  },
  {
    index: "03",
    title: "Text-to-SQL Generator",
    tagline:
      "Natural language to executable, validated SQL over LLM APIs — with defense-in-depth guards and injection protection.",
    stack: ["Python", "Azure OpenAI GPT-4o", "GitHub Actions"],
    href: "https://github.com/ashour-git/Text2SQL-Generator",
    note: "18/18 security tests",
    domain: "LLM · Backend",
  },
  {
    index: "04",
    title: "Hand Gesture Recognition",
    tagline:
      "Real-time hand-gesture recognition for human-computer interaction using deep learning and computer vision.",
    stack: ["Python", "Deep Learning", "Computer Vision", "OpenCV"],
    href: "https://github.com/ashour-git/hand_gesture_reco",
    note: "real-time inference",
    domain: "Computer Vision",
  },
  {
    index: "05",
    title: "Semantic Book Recommender",
    tagline:
      "Semantic-search recommendation over 7,000+ books using vector embeddings — under 70 ms per query, zero API cost.",
    stack: ["Python", "sentence-transformers", "ChromaDB", "LangChain"],
    href: "https://github.com/ashour-git/semantic-book-recommender",
    note: "7k+ books · ~67 ms",
    domain: "Recommendation",
  },
  {
    index: "06",
    title: "Kepler Vision",
    tagline:
      "A computer-vision exploration focused on capable, production-minded vision models and clean inference pipelines.",
    stack: ["Python", "Computer Vision", "PyTorch"],
    href: "https://github.com/ashour-git/Kepler-Vision",
    domain: "Computer Vision",
  },
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
    context: "Production AI shared across an enterprise SaaS platform",
    points: [
      "Ship AI features end to end — from data pipelines and model serving to API surface and observability.",
      "Build RAG and LLM applications on Azure AI Foundry with Anthropic Claude and OpenAI models.",
      "Engineer data pipelines and backend services for real multi-tenant production workloads.",
      "Drive experimentation and evaluation to ship reliable model behavior at scale.",
    ],
  },
  {
    title: "Data Engineer Intern",
    company: "SustainGRC",
    period: "2025 — 2026",
    points: [
      "Shipped a Text-to-SQL feature translating natural language into executable SQL via GPT-4o.",
      "Automated backup and disaster-recovery pipelines with integrity-validation checksums.",
      "Applied FAIR data principles and automation across data engineering.",
    ],
  },
  {
    title: "Machine Learning Intern",
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
    title: "AI / LLM Engineering",
    items: ["RAG", "Agentic AI", "Prompt engineering", "Vector search", "Embeddings", "Fine-tuning"],
  },
  {
    title: "Machine Learning",
    items: ["LightGBM", "Scikit-Learn", "PyTorch", "Optuna", "MLflow", "Forecasting"],
  },
  {
    title: "Backend & Data",
    items: ["FastAPI", "Next.js", "Node.js", "PostgreSQL", "Redis", "SQLAlchemy"],
  },
  {
    title: "Cloud & MLOps",
    items: ["Azure AI Foundry", "Azure OpenAI", "Docker", "GitHub Actions", "CI/CD"],
  },
  {
    title: "Computer Vision",
    items: ["OpenCV", "YOLOv5", "MediaPipe", "ResNet-50", "CNNs"],
  },
  {
    title: "Tools",
    items: ["Git", "Linux", "Jupyter", "LangChain", "Drizzle ORM", "Figma"],
  },
];

export const insights = [
  {
    index: "W1",
    title: "Grounding a RAG assistant in real ops data",
    body: "pgvector, embeddings, and sub-second retrieval over live operational data — beyond the demo.",
    href: "https://github.com/ashour-git/Restaurant_AI",
    tag: "Engineering note",
  },
  {
    index: "W2",
    title: "Making Text-to-SQL production-safe",
    body: "How a validator, injection guards, and 18/18 security tests turn a raw LLM into a usable tool.",
    href: "https://github.com/ashour-git/Text2SQL-Generator",
    tag: "Engineering note",
  },
  {
    index: "W3",
    title: "Recommenders without an API bill",
    body: "Vector embeddings and semantic search over 7,000+ books at ~67 ms and zero inference cost.",
    href: "https://github.com/ashour-git/semantic-book-recommender",
    tag: "Engineering note",
  },
];
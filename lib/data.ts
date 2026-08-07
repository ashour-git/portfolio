export const profile = {
  name: "Mohamed Ashour",
  roles: ["AI Engineer", "Machine Learning Engineer", "LLM / RAG / MLOps"],
  location: "Cairo, Egypt",
  email: "muhamed.3ashour@gmail.com",
  linkedin: "https://www.linkedin.com/in/mohamedashour-ai",
  github: "https://github.com/ashour-git",
  resume: "/resume.pdf",
};

export const heroStats = [
  { label: "Current role", value: "AI Engineer @ SustainGRC" },
  { label: "Focus", value: "AI governance · RAG · MLOps" },
  { label: "Systems", value: "Multi-tenant · audit-grade · EU AI Act" },
  { label: "Based in", value: "Cairo, Egypt" },
];

export type Project = {
  index: string;
  title: string;
  tagline: string;
  stack: string[];
  href: string;
  note?: string;
};

export const projects: Project[] = [
  {
    index: "01",
    title: "RestAI",
    tagline:
      "Production restaurant-management SaaS with a demand-forecasting engine and a RAG assistant over live menu and operational data.",
    stack: ["FastAPI", "Next.js", "LightGBM", "Groq Llama 3.3", "pgvector", "Docker"],
    href: "https://github.com/ashour-git/Restaurant_AI",
    note: "162 automated tests",
  },
  {
    index: "02",
    title: "Storefy",
    tagline:
      "AI-native multi-tenant e-commerce platform — wildcard-subdomain routing, per-tenant data isolation, and natural-language POS.",
    stack: ["Next.js 15", "TypeScript", "Drizzle ORM", "PostgreSQL", "Better Auth", "Inngest"],
    href: "https://github.com/ashour-git/storefy",
    note: "Generative storefront onboarding",
  },
  {
    index: "03",
    title: "Text-to-SQL Generator",
    tagline:
      "Production-hardened natural-language-to-SQL converter with defense-in-depth validation and injection protection.",
    stack: ["Python", "Azure OpenAI (GPT-4o)", "GitHub Actions"],
    href: "https://github.com/ashour-git/Text2SQL-Generator",
    note: "18/18 security tests passing",
  },
  {
    index: "04",
    title: "Semantic Book Recommender",
    tagline:
      "Semantic-search recommendation engine over 7,000+ books using vector embeddings — roughly 67 ms per query, zero API cost.",
    stack: ["Python", "sentence-transformers", "ChromaDB", "LangChain"],
    href: "https://github.com/ashour-git/semantic-book-recommender",
    note: "Zero-cost inference",
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
    context: "UK-based AI-native GRC/ESG SaaS · end-to-end AI governance tooling",
    points: [
      "Engineered a deterministic EU AI Act classification engine with five risk gates and a hash-chained audit trail.",
      "Delivered AI-assisted compliance drafting powered by Anthropic Claude on Azure AI Foundry.",
      "Implemented AI discovery that matches network logs against a vendor signature library.",
      "Built a climate-risk data pipeline with country-specific physical-risk multipliers.",
      "Shaped the AI-governance product roadmap through product and competitor analysis.",
    ],
  },
  {
    title: "Data Engineer Intern",
    company: "SustainGRC",
    period: "2025 — 2026",
    points: [
      "Designed and shipped a Text-to-SQL feature translating natural language into executable SQL via GPT-4o.",
      "Automated backup and disaster-recovery pipelines with integrity-validation checksums.",
      "Applied FAIR data principles and automation across ESG data governance.",
    ],
  },
  {
    title: "Machine Learning Intern",
    company: "CodeAlpha",
    period: "2024",
    points: [
      "Fine-tuned a ResNet-50 image classification model for a computer-vision task.",
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
    items: ["LightGBM", "Scikit-Learn", "PyTorch", "Optuna", "MLflow", "Time-series forecasting"],
  },
  {
    title: "Backend & Data",
    items: ["FastAPI", "Next.js", "Node.js", "PostgreSQL", "Redis", "SQLAlchemy", "Drizzle ORM"],
  },
  {
    title: "Cloud & MLOps",
    items: ["Azure AI Foundry", "Azure OpenAI", "Docker", "Docker Compose", "GitHub Actions"],
  },
  {
    title: "Computer Vision",
    items: ["OpenCV", "YOLOv5", "MediaPipe", "ResNet-50", "CNNs"],
  },
  {
    title: "Domain",
    items: ["GRC/ESG SaaS", "Multi-tenant architecture", "EU AI Act", "Audit-grade AI systems"],
  },
];

export const insights = [
  {
    index: "W1",
    title: "Designing a deterministic EU AI Act classifier",
    body: "Five risk gates, hash-chained audit trails, and what it takes to make governance machine-checkable.",
    href: "https://www.linkedin.com/in/mohamedashour-ai",
    tag: "Case study",
  },
  {
    index: "W2",
    title: "Shipping Text-to-SQL with defense in depth",
    body: "How a validator, injection guards, and 18/18 security tests turn a raw LLM into a production tool.",
    href: "https://github.com/ashour-git/Text2SQL-Generator",
    tag: "Engineering note",
  },
  {
    index: "W3",
    title: "RAG beyond the demo",
    body: "pgvector, embeddings, and grounding an assistant in real operational data at sub-second latency.",
    href: "https://github.com/ashour-git/Restaurant_AI",
    tag: "Engineering note",
  },
];

export const profile = {
  name: "Mohamed Ashour",
  roles: ["AI Engineer", "ML Engineer", "LLM Engineer"],
  location: "Cairo, Egypt",
  email: "muhamed.3ashour@gmail.com",
  linkedin: "https://www.linkedin.com/in/mohamedashour-ai",
  github: "https://github.com/ashour-git",
  resume: "/resume.pdf",
};

export type Stat = { value: string; label: string };

export const stats: Stat[] = [
  { value: "18/18", label: "security tests passing" },
  { value: "162", label: "automated tests written" },
  { value: "7,000+", label: "books in the semantic index" },
  { value: "~67ms", label: "average retrieval latency" },
];

export const heroStats: Stat[] = stats.slice(0, 2);

export type CommandWidget = {
  id: string;
  label: string;
  value: string;
  meta?: string;
  status: "ready" | "warn" | "busy";
  anchor: "top-left" | "top-right" | "mid-left" | "mid-right" | "bottom";
  offsetX: number;
  offsetY: number;
  drift: number;
  flow?: string[];
};

export const commandWidgets: CommandWidget[] = [
  { id: "model", label: "Model", value: "Llama 3.3 · GPT-4o", meta: "multi-provider", status: "ready", anchor: "top-left", offsetX: 0, offsetY: 0, drift: 19, flow: ["prompt", "LLM", "answer"] },
  { id: "latency", label: "Retrieval", value: "~67 ms", meta: "p95 avg", status: "ready", anchor: "top-right", offsetX: 0, offsetY: 0, drift: 27, flow: ["embed", "index", "top-k"] },
  { id: "api", label: "API / deploy", value: "FastAPI · Docker", meta: "all green", status: "ready", anchor: "mid-right", offsetX: 0, offsetY: 0, drift: 23, flow: ["route", "gateway", "service"] },
  { id: "mlflow", label: "Experiments", value: "162", meta: "runs tracked", status: "busy", anchor: "mid-left", offsetX: 0, offsetY: 0, drift: 31, flow: ["trial", "eval", "metric"] },
  { id: "registry", label: "Azure AI", value: "Foundry · OpenAI", meta: "connected", status: "ready", anchor: "bottom", offsetX: 0, offsetY: 0, drift: 17, flow: ["asset", "deploy", "monitor"] },
];

export type GithubStat = { value: string; label: string };

export const githubStats: GithubStat[] = [
  { value: "15+", label: "public repositories" },
  { value: "7", label: "AI/ML codebases" },
  { value: "CI", label: "tests via GitHub Actions" },
  { value: "Docs", label: "architecture in every repo" },
];

export type ArchNode = {
  label: string;
  sub?: string;
  kind?: "client" | "api" | "model" | "gate" | "db" | "outcome";
};

export type ArchFlow = {
  nodes: ArchNode[];
  caption?: string;
};

export type Decision = {
  title: string;
  body: string;
};

export type PerformanceItem = { value: string; label: string };

export type Observability = {
  tools: string[];
  watch: string[];
  logs: string[];
};

export type CaseStudyContent = {
  slug: string;
  requirements: string[];
  modelChoice: string;
  tradeoffs: { choice: string; cost: string }[];
  challenges: string[];
  deployment: string;
  lessons: string[];
  observability: Observability;
};

export type Project = {
  index: string;
  title: string;
  tagline: string;
  summary?: string;
  problem: string;
  solution: string;
  decisions: Decision[];
  architecture: ArchFlow;
  performance: PerformanceItem[];
  stack: string[];
  href: string;
  caseStudy?: string;
  study?: CaseStudyContent;
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
    problem:
      "Restaurant staff juggle live menu, order, and staffing data scattered across screens. Answers arrive slowly, forecasts are gut-feel, and there is no single source of truth for operations.",
    solution:
      "A single product where a RAG assistant answers staff questions grounded in live operational data, and a LightGBM forecaster predicts demand. Both share one PostgreSQL + pgvector layer, so the answer and the number come from the same source of truth.",
    decisions: [
      {
        title: "RAG over live data",
        body: "Kept the assistant grounded in pgvector embeddings of live menu/order data instead of free-form generation — answers stay verifiable and current.",
      },
      {
        title: "Optuna-tuned LightGBM",
        body:
          "Chose gradient boosting with lag and rolling-window features so forecast quality was tunable and reproducible, with structured experimentation baked in.",
      },
      {
        title: "Tests as a shipping gate",
        body:
          "162 automated tests guard the pipeline — retrieval, forecasting, and API behavior must pass CI before anything is considered shippable.",
      },
    ],
    architecture: {
      nodes: [
        { label: "Next.js dashboard", sub: "staff UI · client", kind: "client" },
        { label: "FastAPI", sub: "REST · SSE", kind: "api" },
        { label: "RAG orchestrator", sub: "Groq Llama 3.3", kind: "model" },
        { label: "pgvector", sub: "semantic index", kind: "db" },
        { label: "PostgreSQL", sub: "menu · orders · suppliers", kind: "db" },
        { label: "Grounded answer", sub: "cited · measured ~67ms", kind: "outcome" },
      ],
      caption:
        "Retrieval and forecasting share one operational data layer — no separate, stale copies.",
    },
    performance: [
      { value: "162", label: "automated tests" },
      { value: "~67ms", label: "avg retrieval" },
      { value: "Optuna", label: "tuned forecasts" },
    ],
    stack: ["FastAPI", "Next.js", "LightGBM", "Groq Llama 3.3", "pgvector", "RAG"],
    href: "https://github.com/ashour-git/Restaurant_AI",
    caseStudy: "https://github.com/ashour-git/Restaurant_AI",
    note: "forecasting · RAG",
    domain: "LLM & Forecasting",
    featured: true,
    impact: ["162 automated tests", "Optuna-tuned forecasts", "RAG over live data"],
    image: "/projects/restai.svg",
    gradient: "from-teal-500 via-emerald-500 to-cyan-500",
    study: {
      slug: "restai",
      requirements: [
        "Answer staff questions grounded in live menu, order, and supplier data.",
        "Forecast demand per item so purchasing and staffing can be planned.",
        "One shared data layer so the assistant and the forecaster never disagree.",
        "CI that keeps the whole pipeline shippable.",
      ],
      modelChoice:
        "LightGBM with Optuna hyperparameter search for forecasting — gradient boosting trains fast, handles tabular features and missing values well, and produces defensible feature importances. Groq Llama 3.3 for the assistant because hosted LLM inference keeps ops simple while staying fast enough for interactive answers.",
      tradeoffs: [
        {
          choice: "LightGBM over a deep sequence model",
          cost: "Loses some capacity on long time-series context, wins on trainability, interpretability, and low latency for tabular features.",
        },
        {
          choice: "pgvector inside PostgreSQL over a standalone vector DB",
          cost: "Single source of truth and one deployment to run, at the cost of sharing the same Postgres instance for OLTP and embeddings.",
        },
        {
          choice: "Hosted Groq inference over self-hosting an open model",
          cost: "Zero serving infrastructure to maintain, but a dependency on an external API for assistant responses.",
        },
      ],
      challenges: [
        "Keeping RAG answers grounded in live data rather than stale snapshots.",
        "Engineering lag and rolling-window features that actually generalize for restaurant demand.",
        "Coordinating 162 tests across retrieval, forecasting, and API surfaces so one layer can't silently break another.",
      ],
      deployment:
        "Dockerized FastAPI service with a Next.js dashboard; PostgreSQL + pgvector as the single data layer; CI via GitHub Actions runs the full test suite on every push.",
      lessons: [
        "Grounded retrieval and structured experimentation matter more than model novelty.",
        "One shared data layer prevents the classic 'RAG and analytics disagree' failure.",
        "Tests are what make an AI product operable, not the model card.",
      ],
      observability: {
        tools: ["MLflow", "Grafana", "Structured logs", "RAG trace"],
        watch: [
          "Answer latency and retrieval latency tracked per request from the same ~67ms claim.",
          "Optuna experiment runs recorded in MLflow, tuned locally and re-run in CI.",
          "Grounding quality sampled from logs: citations present, source counts, empty-answer rate.",
        ],
        logs: [
          'INFO trace query="chicken shawarma availability" retrieval_ms=67 sources=4 cited=1',
          "INFO forecast horizon=7d model=lightgbm optuna_trial=14 rmse=…",
          "WARN evaluator source_mismatch=0.03 precision=0.96",
        ],
      },
    },
  },
  {
    index: "02",
    title: "Storefy",
    tagline:
      "AI-native e-commerce with wildcard-subdomain multi-tenancy and per-tenant data isolation.",
    summary:
      "A scalable AI e-commerce foundation — natural-language POS, per-tenant isolation, and generative storefront onboarding.",
    problem:
      "Most e-commerce platforms are single-tenant by accident: one mistake leaks another store's customers, and onboarding a new store means manual, repetitive setup.",
    solution:
      "Storefy bakes multi-tenancy into the schema and routing — wildcard subdomains isolate every store, while generative onboarding turns a brand description into a live storefront. Data is never shared between tenants.",
    decisions: [
      {
        title: "Multi-tenancy from day one",
        body:
          "Chose tenant-scoped rows and wildcard-subdomain routing over a shared-database-everything approach so isolation is structural, not bolted on.",
      },
      {
        title: "Generative onboarding",
        body:
          "Used Groq Llama to scaffold a storefront from a plain-language brief, cutting setup from hours to minutes without template sprawl.",
      },
      {
        title: "Async where it matters",
        body:
          "Offloaded long-running work to Inngest so POS and onboarding stay responsive while background jobs manage the heavy lifting.",
      },
    ],
    architecture: {
      nodes: [
        { label: "Next.js 15 storefront", sub: "wildcard subdomains", kind: "client" },
        { label: "API layer", sub: "TypeScript · Drizzle", kind: "api" },
        { label: "LLM service", sub: "Groq Llama 3.3", kind: "model" },
        { label: "Inngest", sub: "background jobs", kind: "api" },
        { label: "PostgreSQL", sub: "tenant-isolated rows", kind: "db" },
        { label: "Isolated store", sub: "per-tenant data", kind: "outcome" },
      ],
      caption: "Wildcard subdomains resolve to tenant-scoped data — isolation is structural.",
    },
    performance: [
      { value: "Per-tenant", label: "isolated rows" },
      { value: "Groq", label: "gen onboarding" },
      { value: "Drizzle", label: "typed queries" },
    ],
    stack: ["Next.js 15", "TypeScript", "Drizzle ORM", "PostgreSQL", "Groq Llama 3.3", "Inngest"],
    href: "https://github.com/ashour-git/storefy",
    caseStudy: "https://github.com/ashour-git/storefy",
    note: "generative onboarding",
    domain: "Backend & Agentic AI",
    image: "/projects/storefy.svg",
    gradient: "from-cyan-500 via-sky-600 to-blue-600",
    study: {
      slug: "storefy",
      requirements: [
        "Every store's data structurally isolated from every other store.",
        "Onboarding a new store from a plain-language brief, not manual setup.",
        "Background jobs that can fail, retry, and be observed.",
      ],
      modelChoice:
        "Groq Llama 3.3 for generative storefront scaffolding — fast enough to make onboarding feel interactive, and cheap enough that one generation per store is a non-event.",
      tradeoffs: [
        {
          choice: "Wildcard-subdomain routing over a single shared dashboard",
          cost: "Clean per-tenant URL isolation and auth boundaries, at the cost of DNS/routing complexity.",
        },
        {
          choice: "Drizzle + typed SQL over an ORM magic layer",
          cost: "Explicit, reviewable queries that make tenant scoping auditable, at the cost of writing more SQL.",
        },
        {
          choice: "Generative onboarding over a template gallery",
          cost: "Unlimited storefront variety from one prompt, traded for needing prompt-guardrails to keep output consistent.",
        },
      ],
      challenges: [
        "Making tenant isolation structural — enforced in routing, queries, and schema — rather than a convention people remember.",
        "Prompt-scaffolding generation so storefronts vary without looking broken.",
        "Keeping POS and onboarding responsive while Inngest runs the heavy lifting in the background.",
      ],
      deployment:
        "Next.js 15 frontend on Vercel, PostgreSQL with Drizzle, Inngest for durable background jobs, wildcard subdomains mapped per tenant.",
      lessons: [
        "Tenancy decided on day one is exponentially cheaper than retrofitted later.",
        "Generative features are only as good as the guardrails around them.",
        "Async boundaries are the natural place to make a product observable.",
      ],
      observability: {
        tools: ["Inngest events", "Structured logs", "Per-tenant metrics"],
        watch: [
          "Background-job success, retry, and timeout rates from Inngest event streams.",
          "Tenant-scoped request counts to prove per-store isolation holds under load.",
          "Onboarding generation quality sampled from generated storefront records.",
        ],
        logs: [
          'INFO tenant=acme request scope="tenant_scoped" rows=12 ok',
          "INFO job=storefront-gen tenant=acme duration_ms=3400 completed",
          "ERROR job=pos-sync tenant=acme retry=2 backoff_ms=8000",
        ],
      },
    },
  },
  {
    index: "03",
    title: "Text-to-SQL Generator",
    tagline:
      "Natural language to executable, validated SQL over LLM APIs — with defense-in-depth guards.",
    problem:
      "An LLM can write SQL — but letting raw model output run against a real database is how people drop tables. The problem was never generation; it was making generation safe to execute.",
    solution:
      "A Python service that produces a candidate query, then runs it through deterministic validation and injection guards. SQL only executes when it passes every gate — made provable by 18/18 security tests in GitHub Actions.",
    decisions: [
      {
        title: "Defense in depth",
        body:
          "Model output is treated as untrusted input: syntactic validation, injection guards, and dry-run checks each reject before execution.",
      },
      {
        title: "Deterministic guards",
        body:
          "The validation layer is fully deterministic — no model in the critical path — so a passing grade is reproducible, not probabilistic.",
      },
      {
        title: "CI as source of truth",
        body:
          "18/18 security tests run on every push, so the safety contract is enforced in public, not asserted in prose.",
      },
    ],
    architecture: {
      nodes: [
        { label: "User prompt", sub: "natural language", kind: "client" },
        { label: "Generator API", sub: "Python · Azure OpenAI", kind: "api" },
        { label: "GPT-4o", sub: "candidate SQL", kind: "model" },
        { label: "Validation gates", sub: "injection · dry-run", kind: "gate" },
        { label: "Database", sub: "read-only execution", kind: "db" },
        { label: "Validated result", sub: "18/18 tests", kind: "outcome" },
      ],
      caption: "The validator sits between the model and the database — execution is gated, not trusted.",
    },
    performance: [
      { value: "18/18", label: "security tests" },
      { value: "Guarded", label: "before execute" },
      { value: "GPT-4o", label: "on Azure" },
    ],
    stack: ["Python", "Azure OpenAI GPT-4o", "GitHub Actions"],
    href: "https://github.com/ashour-git/Text2SQL-Generator",
    caseStudy: "https://github.com/ashour-git/Text2SQL-Generator",
    note: "18/18 security tests",
    domain: "LLM & Backend",
    image: "/projects/text2sql.svg",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    study: {
      slug: "text2sql",
      requirements: [
        "Turn natural language into executable SQL against a real schema.",
        "Never execute unsafe or destructive statements, even if prompted to.",
        "Make the safety contract provable — 18/18 security tests in CI.",
      ],
      modelChoice:
        "GPT-4o on Azure OpenAI for SQL generation — strong structured-output reliability — paired with a fully deterministic Python validator so the safety boundary never depends on model behavior.",
      tradeoffs: [
        {
          choice: "Deterministic validation over prompt-based safety",
          cost: "More code, but the safety gate is reproducible rather than probabilistic.",
        },
        {
          choice: "Read-only execution by default",
          cost: "Prevents destructive queries entirely, at the cost of limiting write workflows behind the tool.",
        },
        {
          choice: "Azure OpenAI over a self-hosted model",
          cost: "Enterprise-grade compliance and quality, traded for a vendor dependency.",
        },
      ],
      challenges: [
        "Prompt and SQL injection attempts aimed at bypassing the guard layers.",
        "Mapping ambiguous natural language onto a precise, executable schema.",
        "Writing tests that prove a negative — that nothing unsafe can execute.",
      ],
      deployment:
        "Python service behind an API; model calls via Azure OpenAI; GitHub Actions runs the 18/18 security suite on every push before anything ships.",
      lessons: [
        "Treat model output as untrusted input — always.",
        "The validator, not the model, is the product's safety story.",
        "A CI-encoded security contract is auditable in public and stays honest.",
      ],
      observability: {
        tools: ["GitHub Actions", "Validation counters", "Command logs"],
        watch: [
          "18/18 security tests green on every push, surfaced as a CI gate.",
          "Injection-guard rejection rate: how often the validator blocks prompts.",
          "Dry-run vs. execution counts so read-only guarantees break loudly.",
        ],
        logs: [
          "PASS gate=injection scan=3 blocked=1 risk=high → dry-run only",
          "RUN 18/18 security: validator:12 injection:6 dry-run:1",
          "INFO SQL executed=true read_only=true cached_result=true",
        ],
      },
    },
  },
  {
    index: "04",
    title: "Hand Gesture Recognition",
    tagline:
      "Real-time hand-gesture recognition for human-computer interaction using deep learning and computer vision.",
    problem:
      "Controllers, keyboards, and screens create friction for accessibility, VR, and hands-full interactions. There is no natural, low-latency way to map intention to a command.",
    solution:
      "A deep-learning pipeline recognizes gestures from live camera input via OpenCV and a CNN — framing the problem as one continuous low-latency inference loop rather than a one-shot classifier.",
    decisions: [
      {
        title: "Latency as a feature",
        body:
          "Designed around real-time inference so gesture classification maps cleanly to an interaction loop instead of a batch job.",
      },
      {
        title: "Pragmatic CV stack",
        body:
          "Combined OpenCV preprocessing with a deep CNN — a balance of accuracy and inference cost for interactive use.",
      },
      {
        title: "Interaction-first framing",
        body:
          "Targeted HCI, VR, and accessibility from the start, which shaped model and post-processing choices around responsiveness.",
      },
    ],
    architecture: {
      nodes: [
        { label: "Live camera", sub: "video frames", kind: "client" },
        { label: "OpenCV", sub: "preprocess", kind: "api" },
        { label: "Deep CNN", sub: "gesture classifier", kind: "model" },
        { label: "Postprocess", sub: "landmarks · filter", kind: "gate" },
        { label: "Interaction", sub: "HCI · VR · access", kind: "outcome" },
      ],
      caption: "One low-latency inference loop from frame to interaction.",
    },
    performance: [
      { value: "Real-time", label: "per-frame" },
      { value: "CNN", label: "classifier" },
      { value: "OpenCV", label: "pipeline" },
    ],
    stack: ["Python", "Deep Learning", "Computer Vision", "OpenCV"],
    href: "https://github.com/ashour-git/hand_gesture_reco",
    caseStudy: "https://github.com/ashour-git/hand_gesture_reco",
    note: "real-time inference",
    domain: "Computer Vision",
    image: "/projects/hand-gesture.svg",
    gradient: "from-cyan-500 via-teal-500 to-emerald-500",
    study: {
      slug: "hand-gesture",
      requirements: [
        "Recognize gestures from live camera input in real time.",
        "Frame the problem for HCI, VR, and accessibility — not just classification benchmarks.",
      ],
      modelChoice:
        "A deep CNN over a hand-tuned CV pipeline — the network absorbs pose and lighting variation that handcrafted features cannot, at a cost the CPU can meet per-frame.",
      tradeoffs: [
        {
          choice: "CNN over classical computer vision",
          cost: "More robust to real-world variation, traded for a training pipeline and data requirement.",
        },
        {
          choice: "OpenCV preprocessing before the model",
          cost: "Stable, normalized input for the network at a negligible latency cost.",
        },
        {
          choice: "On-device inference over an API",
          cost: "Zero network round-trip for interaction, at the cost of model size constraints.",
        },
      ],
      challenges: [
        "Meeting per-frame latency so gestures feel immediate, not delayed.",
        "Robustness across lighting, skin tone, and background clutter.",
        "Defining gesture vocabulary that is intuitive and unambiguous for users.",
      ],
      deployment:
        "Python pipeline: OpenCV capture and preprocessing → CNN inference → postprocessed gesture label, designed to run interactively with no server dependency.",
      lessons: [
        "Latency is a product feature for HCI, not just a benchmark metric.",
        "Preprocessing is where most real-world robustness is won or lost.",
        "Interaction framing shapes the model more than the benchmark does.",
      ],
      observability: {
        tools: ["Frame timing", "Confidence histograms", "FPS meter"],
        watch: [
          "Per-frame inference time to keep the HCI loop under its latency budget.",
          "Class confidence and confusion-rate per gesture class.",
          "Long captures monitored for pose and lighting drift.",
        ],
        logs: [
          "INFO fps=28 latency_ms=35 conf=0.94 gesture=peace",
          "WARN low_confidence conf=0.51 → rejected",
          "INFO session=… frames=1200 avg_fps=31 p99=41ms",
        ],
      },
    },
  },
  {
    index: "05",
    title: "Semantic Book Recommender",
    tagline:
      "Semantic-search recommendation over 7,000+ books using vector embeddings — under 70 ms per query.",
    problem:
      "Keyword search returns books that match text, not books the reader means. Asking 'something calm about grief and the sea' needs meaning, not string matching.",
    solution:
      "Converted 7,000+ books to vector embeddings with sentence-transformers, then retrieves contextually similar titles with ChromaDB — no API cost, ~67 ms per query.",
    decisions: [
      {
        title: "Zero marginal retrieval cost",
        body:
          "Chose an open-source embedding model + local ChromaDB over a paid API so retrieval cost is near zero at scale.",
      },
      {
        title: "Semantic over keyword",
        body:
          "Embeddings capture intent, so vague linguistic queries return books a keyword search would miss.",
      },
      {
        title: "Measurable fetch",
        body:
          "Kept sub-70ms retrieval so the recommender feels instant, not academic.",
      },
    ],
    architecture: {
      nodes: [
        { label: "Query", sub: "natural language", kind: "client" },
        { label: "sentence-transformers", sub: "embed query", kind: "model" },
        { label: "Vector index", sub: "ChromaDB · 7k+ books", kind: "db" },
        { label: "Top-K", sub: "cosine similarity", kind: "gate" },
        { label: "Recommendations", sub: "~67ms · no API bill", kind: "outcome" },
      ],
      caption: "Embed once, query forever — zero marginal retrieval cost.",
    },
    performance: [
      { value: "7,000+", label: "books indexed" },
      { value: "~67ms", label: "per query" },
      { value: "0", label: "API cost" },
    ],
    stack: ["Python", "sentence-transformers", "ChromaDB", "LangChain"],
    href: "https://github.com/ashour-git/semantic-book-recommender",
    caseStudy: "https://github.com/ashour-git/semantic-book-recommender",
    note: "7k+ books · ~67 ms",
    domain: "Recommendation",
    image: "/projects/book-recommender.svg",
    gradient: "from-amber-500 via-orange-500 to-rose-500",
    study: {
      slug: "book-recommender",
      requirements: [
        "Recommend books by meaning, not keyword overlap.",
        "Handle 7,000+ books with sub-100 ms retrieval.",
        "Zero ongoing API cost per query.",
      ],
      modelChoice:
        "sentence-transformers for embeddings and ChromaDB for the vector index — open-source, local, and fast enough that the marginal cost of a query is effectively zero.",
      tradeoffs: [
        {
          choice: "Local embeddings over a paid embedding API",
          cost: "No per-query bill and full control, at the cost of running the index yourself.",
        },
        {
          choice: "ChromaDB over a hosted vector database",
          cost: "Zero infrastructure overhead for 7k documents, traded for less horizontal scale-out.",
        },
        {
          choice: "Approximate nearest-neighbor search over exact search",
          cost: "~67 ms at this scale instead of slower exact scans — accuracy loss is negligible for book similarity.",
        },
      ],
      challenges: [
        "Choosing the right text representation so whole-book meaning, not just titles, is embedded.",
        "Keeping retrieval under ~67 ms as the index grows.",
        "Evaluating semantic quality without a labeled similarity dataset.",
      ],
      deployment:
        "Python service: query → sentence-transformers embedding → ChromaDB similarity search → top-K results, orchestrated with LangChain; the index is rebuilt offline from the catalog.",
      lessons: [
        "Semantic retrieval removes the API bill from personalization.",
        "Sub-100 ms latency turns a recommender into a real-time product.",
        "Embedding choice matters more than index choice at this scale.",
      ],
      observability: {
        tools: ["ChromaDB stats", "Latency log", "Query sampler"],
        watch: [
          "p95 query latency held under ~67 ms as the index grows.",
          "Index staleness: how often the offline rebuild runs and how long it takes.",
          "Zero marginal cost stays true — embedding calls logged, no paid API seen.",
        ],
        logs: [
          "INFO query='grief and the sea' top_k=5 latency_ms=62 best='The Old Man and the Sea'",
          "INFO reindex_books count=7,214 duration_ms=18…",
          "STATS p50=41ms p95=67ms cache_hit=0.88",
        ],
      },
    },
  },
  {
    index: "06",
    title: "Kepler Vision",
    tagline:
      "A computer-vision exploration focused on capable, production-minded vision models and clean inference pipelines.",
    problem:
      "Vision models are easy to demo and hard to operate: frames, preprocess steps, and postprocess edges are usually reverse-engineered from notebooks.",
    solution:
      "Kepler Vision treats inference as a pipeline — clean preprocess, a capable detector, and deterministic postprocessing — so a vision model can be operated like a service, not a script.",
    decisions: [
      {
        title: "Clean inference, no scripts",
        body:
          "Structured the code as a repeatable pipeline, which is what makes a vision model deployable at all.",
      },
      {
        title: "Production-minded model",
        body:
          "Chose a model that balances capability with inferable speed, matching the deployment-rethinking of the site.",
      },
    ],
    architecture: {
      nodes: [
        { label: "Input frame", kind: "client" },
        { label: "Preprocess", sub: "resize · normalize", kind: "api" },
        { label: "Detector model", sub: "PyTorch", kind: "model" },
        { label: "Postprocess", sub: "NMS · threshold", kind: "gate" },
        { label: "Detections", kind: "outcome" },
      ],
      caption: "A vision pipeline you can operate, not a notebook you re-run.",
    },
    performance: [
      { value: "Pipeline", label: "preprocess → detect" },
      { value: "PyTorch", label: "serving" },
      { value: "Deterministic", label: "postprocess" },
    ],
    stack: ["Python", "Computer Vision", "PyTorch"],
    href: "https://github.com/ashour-git/Kepler-Vision",
    caseStudy: "https://github.com/ashour-git/Kepler-Vision",
    domain: "Computer Vision",
    image: "/projects/kepler.svg",
    gradient: "from-slate-500 via-zinc-500 to-neutral-500",
    study: {
      slug: "kepler-vision",
      requirements: [
        "Turn vision models into repeatable, operable pipelines.",
        "Deterministic postprocessing so outputs are stable and testable.",
      ],
      modelChoice:
        "PyTorch for model authoring and inference — a production-minded ecosystem that keeps the pipeline portable from research to serving.",
      tradeoffs: [
        {
          choice: "Full pipeline discipline over notebook-style exploration",
          cost: "More structure up front, but outputs that can be operated and compared.",
        },
        {
          choice: "PyTorch over a higher-level wrapper",
          cost: "Direct control over the inference graph, at the cost of writing more plumbing.",
        },
        {
          choice: "Deterministic postprocessing over learned thresholds",
          cost: "Stable, explainable detections, traded for manual threshold tuning.",
        },
      ],
      challenges: [
        "Reproducibility across environments and runs.",
        "Keeping inference fast enough for near-real-time use without sacrificing quality.",
      ],
      deployment:
        "Structured Python pipeline — preprocess → detector → postprocess — designed to run like a service rather than a re-run notebook.",
      lessons: [
        "A clean inference pipeline is what makes a vision model deployment-grade.",
        "Deterministic postprocessing is underrated for production trust.",
      ],
      observability: {
        tools: ["Model card", "Threshold dashboards", "Inference logs"],
        watch: [
          "Deterministic postprocess outputs: NMS and thresholds versioned, not silent.",
          "Detection quality per threshold as the operating point is tuned.",
          "Model-file identity and runtime in the inference log at boot.",
        ],
        logs: [
          "INFO model=… torch=2.x device=cuda:0 pipeline v2",
          "INFO det=frame:00142 conf=0.93 box=(x,y,w,h) labels=…",
          "INFO postprocess deterministic=true nms_iou=0.45",
        ],
      },
    },
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

export type Progression = {
  period: string;
  title: string;
  body: string;
  tags: string[];
};

export const trajectory: Progression[] = [
  {
    period: "2024",
    title: "ML experiments",
    body: "First models: fine-tuned ResNet-50 for image classification, a collaborative-filtering music recommender, and OpenCV gesture recognition.",
    tags: ["PyTorch", "CNN", "OpenCV"],
  },
  {
    period: "2025",
    title: "From notebooks to pipelines",
    body: "Data engineering in production: Text-to-SQL over a real schema with deterministic guards, backup pipelines, and FAIR data discipline.",
    tags: ["GPT-4o", "Validation", "CI"],
  },
  {
    period: "2025 — 2026",
    title: "Applied ML in products",
    body: "Turned approaches into shippable AI: RAG assistants, semantic recommenders at 7k+ scale, forecasting, and multi-tenant AI e-commerce.",
    tags: ["RAG", "pgvector", "LightGBM", "Multi-tenancy"],
  },
  {
    period: "2026+",
    title: "Production AI systems",
    body: "Enterprise AI as a system: RAG and LLM apps on Azure AI Foundry, XR & computer vision at the edge, observability and evaluation as first-class.",
    tags: ["Azure AI", "LLMOps", "Observability", "Eval"],
  },
];

export type SkillGroup = { title: string; statement: string; items: string[] };

export const skills: SkillGroup[] = [
  {
    title: "LLM Engineering",
    statement:
      "Grounded RAG, agentic systems, and evaluation wired into products that ship — not prompts bolted onto a demo.",
    items: ["RAG", "Agentic AI", "Prompt engineering", "Fine-tuning", "Evaluation"],
  },
  {
    title: "Retrieval-Augmented Generation",
    statement:
      "Vector search and embeddings over live operational data, so answers stay current instead of drifting from a stale snapshot.",
    items: ["Vector search", "Embeddings", "pgvector", "ChromaDB", "Hybrid retrieval"],
  },
  {
    title: "Machine Learning",
    statement:
      "Tabular modeling and demand forecasting with reproducible, tunable experiments — quality you can defend, not just claim.",
    items: ["LightGBM", "Scikit-Learn", "PyTorch", "Optuna", "MLflow", "Forecasting"],
  },
  {
    title: "Backend APIs",
    statement:
      "Typed services and streaming endpoints — FastAPI, Next.js, and SQL — built to hold up under real multi-tenant load.",
    items: ["FastAPI", "Next.js", "Node.js", "SQLAlchemy", "REST · SSE"],
  },
  {
    title: "Data Engineering",
    statement:
      "Pipelines and ETL with integrity checks and FAIR discipline, so the data a model learns from is trustworthy end to end.",
    items: ["PostgreSQL", "Pandas", "Pipelines", "ETL", "FAIR data"],
  },
  {
    title: "Computer Vision",
    statement:
      "Detection and inference pipelines operated like services — preprocess, model, deterministic postprocess — not re-run notebooks.",
    items: ["OpenCV", "YOLOv5", "MediaPipe", "ResNet-50", "CNNs"],
  },
  {
    title: "MLOps",
    statement:
      "Azure AI Foundry, CI, and evaluation treated as first-class production concerns — the model is one layer of a system.",
    items: ["Azure AI Foundry", "Azure OpenAI", "Docker", "GitHub Actions", "CI/CD"],
  },
  {
    title: "Cloud & Deployment",
    statement:
      "Docker, multi-tenancy, and Linux — taking an approach from prototype to a deployed, isolated, observable product.",
    items: ["Azure", "Docker Compose", "Vercel", "Linux", "Multi-tenancy"],
  },
];

export const principles = [
  {
    index: "01",
    title: "Ground every answer",
    body:
      "RAG over live operational data. A model should cite a database before it speaks — not answer from memory it cannot verify.",
  },
  {
    index: "02",
    title: "Ship with evidence",
    body: "Tests, latency numbers, and architecture diagrams live in the repo. Claims I make are claims I can reproduce.",
  },
  {
    index: "03",
    title: "Production is a system",
    body: "A model is one layer. Serving, tenancy, observability, and CI are the rest — and they decide whether a feature survives contact with users.",
  },
  {
    index: "04",
    title: "Evaluate before you trust",
    body: "Measure retrieval latency and pass rates before a prompt or model goes live. Confidence is earned, not asserted.",
  },
];

export const insights = [
  {
    index: "W1",
    title: "Grounding a RAG assistant in real ops data",
    body: "pgvector, embeddings, and sub-second retrieval over live operational data — no stale answer sources.",
    href: "https://github.com/ashour-git/Restaurant_AI",
    tag: "RAG",
  },
  {
    index: "W2",
    title: "Making Text-to-SQL production-safe",
    body: "How a validator, injection guards, and 18/18 tests turn a raw LLM into a usable tool.",
    href: "https://github.com/ashour-git/Text2SQL-Generator",
    tag: "LLM Safety",
  },
  {
    index: "W3",
    title: "Recommenders without an API bill",
    body: "Vector embeddings and semantic search over 7,000+ books at ~67 ms.",
    href: "https://github.com/ashour-git/semantic-book-recommender",
    tag: "Recommendation",
  },
  {
    index: "W4",
    title: "Multi-tenancy structural, not bolted on",
    body: "Wildcard subdomains, tenant-scoped rows, and how Storefy isolates every store.",
    href: "https://github.com/ashour-git/storefy",
    tag: "Backend",
  },
  {
    index: "W5",
    title: "Latency as a product feature in CV",
    body: "Designing gesture recognition as one continuous HCI loop, not a batch classifier.",
    href: "https://github.com/ashour-git/hand_gesture_reco",
    tag: "Computer Vision",
  },
  {
    index: "W6",
    title: "Operating vision models like services",
    body: "Why Kepler Vision treats inference as a deterministic, operable pipeline.",
    href: "https://github.com/ashour-git/Kepler-Vision",
    tag: "MLOps",
  },
];
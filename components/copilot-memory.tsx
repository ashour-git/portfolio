import { MemoryMap } from "./memory-map";

export function CopilotMemory() {
  return (
    <section id="memory" aria-labelledby="memory-title" className="relative scroll-mt-20 py-24 md:py-32">
      <div className="shell">
        <h2 id="memory-title" className="display max-w-[22ch]">
          Inside this site&rsquo;s copilot
        </h2>
        <p className="lead mt-5 max-w-[60ch]">
          The copilot answers from 23 documents about my work. Each star below is one of them, placed by the meaning of
          its embedding. Ask a question and watch retrieval light up the stars it reads from.
        </p>
        <div className="mt-12">
          <MemoryMap />
        </div>
      </div>
    </section>
  );
}

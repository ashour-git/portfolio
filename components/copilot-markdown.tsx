"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

function CodeBlock({ language, value }: { language: string; value: string }) {
  return (
    <div className="group relative my-3 overflow-hidden rounded-xl border border-line bg-bg/60">
      <div className="flex items-center justify-between border-b border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-ink-faint">
        <span>{language || "code"}</span>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(value)}
          className="text-ink-soft transition-colors hover:text-ink"
        >
          copy
        </button>
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={oneDark}
        customStyle={{ margin: 0, background: "transparent", fontSize: "0.8rem" }}
        codeTagProps={{ style: { fontFamily: "var(--font-mono)" } }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}

export function CopilotMarkdown({ text }: { text: string }) {
  return (
    <div className="prose-copilot text-sm leading-relaxed text-ink">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children }) {
            const match = /language-(\w+)/.exec(className ?? "");
            if (!match) {
              return (
                <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em] text-ink">
                  {children}
                </code>
              );
            }
            return <CodeBlock language={match[1]} value={String(children)} />;
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline decoration-accent/40 underline-offset-2 transition-colors hover:decoration-accent"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
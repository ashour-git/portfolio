"use client";

import React, { Children, cloneElement, isValidElement, useState } from "react";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { Lang } from "@/lib/copilot/types";
import { isolateLtrTokens } from "@/lib/copilot/language";

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (permissions, non-secure context) — the code
      // remains selectable, so there is nothing else to offer.
    }
  };
  return (
    <div className="terminal group relative my-3 overflow-hidden rounded-xl" dir="ltr">
      <div className="flex items-center justify-between border-b border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-ink-faint">
        <span>{language || "code"}</span>
        <button
          type="button"
          onClick={() => void copy()}
          aria-live="polite"
          className="inline-flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-lg px-2 text-ink-soft transition-colors hover:text-ink focus-visible:bg-surface-hover"
        >
          {copied ? "copied" : "copy"}
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

function BidiRuns({ text }: { text: string }) {
  const segments = isolateLtrTokens(text);
  return (
    <>
      {segments.map((s, i) =>
        s.ltr ? (
          <span key={i} dir="ltr" lang="en" className="ltr-token">
            {s.text}
          </span>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </>
  );
}

function isolateChildren(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child === "string") return <BidiRuns text={child} />;
    if (isValidElement(child)) {
      const props = child.props as { children?: unknown };
      if (typeof props.children === "string") {
        return cloneElement(child, {}, <BidiRuns text={props.children} />);
      }
    }
    return child;
  });
}

const ISOLATE_BLOCKS = ["p", "li", "td", "th", "h1", "h2", "h3"];

export function CopilotMarkdown({ text, lang }: { text: string; lang: Lang }) {
  const blockOverrides: Record<string, (props: any) => ReactNode> = {};
  for (const tag of ISOLATE_BLOCKS) {
    blockOverrides[tag] = ({ node: _node, ...props }: any) =>
      React.createElement(tag, props, isolateChildren(props.children));
  }
  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      lang={lang}
      data-copilot-lang={lang}
      className="prose-copilot text-sm leading-relaxed text-ink"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          ...blockOverrides,
          // Tables carry the metrics — they must scroll inside the
          // conversation on narrow screens instead of spilling past it.
          // The region is focusable so keyboard and SR users can reach it.
          table({ node: _tableNode, ...props }: any) {
            return (
              <div
                role="region"
                aria-label="Data table, scroll horizontally to see all columns"
                tabIndex={0}
                className="overflow-x-auto"
              >
                <table {...props} />
              </div>
            );
          },
          code({ className, children }) {
            const match = /language-(\w+)/.exec(className ?? "");
            if (!match) {
              return (
                <code dir="ltr" lang="en" className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em] text-ink">
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
                dir="ltr"
                lang="en"
                className="ltr-token text-accent underline decoration-accent/40 underline-offset-2 transition-colors hover:decoration-accent"
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

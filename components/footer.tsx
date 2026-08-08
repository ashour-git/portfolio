import { profile } from "@/lib/data";

const links = [
  { label: "Resume", href: profile.resume },
  { label: "GitHub", href: profile.github },
  { label: "LinkedIn", href: profile.linkedin },
  { label: "Email", href: `mailto:${profile.email}` },
];

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between md:px-10">
        <p className="font-mono text-xs text-ink-faint">
          © {new Date().getFullYear()} Mohamed Ashour
          <span className="mx-2 text-border-strong">·</span>
          <span className="text-ink-soft">Production AI Engineer</span>
        </p>
        <nav aria-label="Contact links" className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target={l.href.startsWith("http") ? "_blank" : undefined}
              rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="font-mono text-xs text-ink-soft transition-colors hover:text-accent"
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}

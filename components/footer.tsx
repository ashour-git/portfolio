import { profile } from "@/lib/data";

const links = [
  { label: "Resume", href: profile.resume },
  { label: "GitHub", href: profile.github },
  { label: "LinkedIn", href: profile.linkedin },
  { label: "Email", href: `mailto:${profile.email}` },
];

export function Footer() {
  return (
    <footer className="relative border-t border-line bg-bg">
      <div className="shell flex flex-col gap-4 py-8 md:flex-row md:items-center md:justify-between">
        <p className="font-mono text-[13px] text-ink-faint">
          &copy; {new Date().getFullYear()} {profile.name}. The black hole is ray traced live in your browser.
        </p>
        <nav aria-label="Footer" className="-mx-3 flex flex-wrap items-center">
          {links.map((l) => {
            const newTab = l.href.startsWith("http") || l.href.endsWith(".pdf");
            return (
              <a
                key={l.label}
                href={l.href}
                target={newTab ? "_blank" : undefined}
                rel={newTab ? "noopener noreferrer" : undefined}
                className="inline-flex min-h-11 items-center px-3 font-mono text-[13px] text-ink-soft transition-colors hover:text-accent"
              >
                {l.label}
              </a>
            );
          })}
        </nav>
      </div>
    </footer>
  );
}

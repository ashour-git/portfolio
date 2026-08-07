const links = [
  { label: "Work", href: "#work" },
  { label: "Experience", href: "#experience" },
  { label: "Stack", href: "#stack" },
  { label: "Notes", href: "#notes" },
  { label: "Contact", href: "#contact" },
];

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line/70 bg-paper/85 backdrop-blur-md">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 md:px-10"
      >
        <a
          href="#top"
          className="font-mono text-sm font-semibold tracking-tight text-ink"
        >
          m.ashour<span className="text-accent">.</span>
        </a>
        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-ink-soft transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#contact"
            className="rounded-full border border-ink px-4 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            Hire me
          </a>
        </div>
        <a
          href="#contact"
          className="rounded-full border border-ink px-4 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper md:hidden"
        >
          Hire me
        </a>
      </nav>
    </header>
  );
}
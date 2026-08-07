const links = [
  { label: "Work", href: "#work" },
  { label: "Experience", href: "#experience" },
  { label: "Stack", href: "#stack" },
  { label: "Notes", href: "#notes" },
  { label: "Contact", href: "#contact" },
];

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 md:px-6">
      <nav
        aria-label="Primary"
        className="glass mx-auto flex h-14 w-full max-w-6xl items-center justify-between rounded-2xl px-5"
      >
        <a
          href="#top"
          className="font-mono text-sm font-semibold tracking-tight text-ink"
        >
          m.ashour<span className="text-accent">.</span>
        </a>
        <div className="hidden items-center gap-7 md:flex">
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
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-ink-soft transition-colors hover:text-ink"
          >
            Resume
          </a>
          <a
            href="#contact"
            className="rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-bg transition-colors hover:opacity-85"
          >
            Hire me
          </a>
        </div>
        <a
          href="#contact"
          className="rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-bg transition-colors hover:opacity-85 md:hidden"
        >
          Hire me
        </a>
      </nav>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-8 md:flex-row md:items-center md:justify-between md:px-10">
        <p className="font-mono text-xs text-ink-faint">
          © {new Date().getFullYear()} Mohamed Ashour
        </p>
        <p className="font-mono text-xs text-ink-faint">
          Built as a product. Fast, accessible, minimal.
        </p>
      </div>
    </footer>
  );
}
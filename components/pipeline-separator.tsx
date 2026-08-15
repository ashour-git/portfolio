export function PipelineSeparator({ from, to }: { from: string; to: string }) {
  return (
    <div className="relative mx-auto my-20 flex items-center px-6 md:px-10" aria-hidden="true">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-5">
        <span className="h-px flex-1 bg-border" />
        <span className="eyebrow flex items-center gap-3 whitespace-nowrap">
          {from}
          <span aria-hidden="true" className="text-accent">→</span>
          {to}
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}

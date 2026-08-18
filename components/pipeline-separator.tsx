export function PipelineSeparator({ from, to }: { from: string; to: string }) {
  return (
    <div
      className="relative mx-auto my-16 flex items-center justify-center gap-5 px-6 md:my-20 md:px-10"
      aria-hidden="true"
    >
      <span className="hidden h-px flex-1 bg-border sm:block" />
      <span className="eyebrow max-w-full shrink-0 text-center">
        {from}
        <span aria-hidden="true" className="mx-2 text-accent">→</span>
        {to}
      </span>
      <span className="hidden h-px flex-1 bg-border sm:block" />
    </div>
  );
}

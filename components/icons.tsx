import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";

export function ArrowIcon({ className = "" }: { className?: string }) {
  return <ArrowRight aria-hidden="true" className={className} weight="regular" />;
}

export function ExternalIcon({ className = "" }: { className?: string }) {
  return <ArrowUpRight aria-hidden="true" className={className} weight="regular" />;
}

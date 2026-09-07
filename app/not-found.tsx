import Link from "next/link";
import { Nav } from "@/components/nav";
import { ArrowIcon } from "@/components/icons";

export default function NotFound() {
  return (
    <>
      <Nav />
      <main id="main">
        <section className="relative overflow-hidden pb-28 pt-40 md:pt-48">
          <div className="mx-auto w-full max-w-4xl px-6 md:px-10">
            <p className="eyebrow mb-5">404 · no such page</p>
            <h1 className="display max-w-2xl">
              No grounded answer <span className="serif-accent text-ink-soft">here.</span>
            </h1>
            <p className="lead mt-6 max-w-xl">
              This page doesn&rsquo;t exist. The work does — start from the
              products, each one shipped with tests and architecture you can
              verify.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/#work" className="btn btn-primary">
                See the products
                <ArrowIcon className="h-4 w-4" />
              </Link>
              <Link
                href="/"
                className="inline-flex min-h-[2.75rem] items-center rounded-lg px-3 py-2 text-sm font-medium text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline focus-visible:bg-surface-hover"
              >
                Back to top
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

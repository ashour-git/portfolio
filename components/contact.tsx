import { EnvelopeSimple, FileText, GithubLogo, LinkedinLogo } from "@phosphor-icons/react/dist/ssr";
import { profile } from "@/lib/data";
import { ArrowIcon } from "./icons";

const links = [
  { label: "Email", value: profile.email, href: `mailto:${profile.email}`, Icon: EnvelopeSimple },
  { label: "LinkedIn", value: "in/mohamedashour-ai", href: profile.linkedin, Icon: LinkedinLogo },
  { label: "GitHub", value: "github.com/ashour-git", href: profile.github, Icon: GithubLogo },
  { label: "Resume", value: "Download PDF", href: profile.resume, Icon: FileText },
];

// face position inside public/space/observer.jpg, in percent
const FACE = { x: 34.9, y: 20.7, w: 36.9, h: 30.9 };

export function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="relative scroll-mt-20 py-20 md:py-24">
      <div className="shell grid grid-cols-1 gap-14 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:gap-20">
        <div>
          <h2 id="contact-title" className="display max-w-[18ch]">
            Have an AI system worth building?
          </h2>
          <p className="lead mt-6 max-w-[46ch]">
            I design and ship production AI: RAG, LLM systems, ML pipelines and computer vision. If the problem is
            real, I&rsquo;m glad to talk.
          </p>

          <ul className="mt-10 border-t border-line">
            {links.map(({ label, value, href, Icon }) => {
              const newTab = href.startsWith("http") || href.endsWith(".pdf");
              return (
                <li key={label} className="border-b border-line">
                  <a
                    href={href}
                    target={newTab ? "_blank" : undefined}
                    rel={newTab ? "noopener noreferrer" : undefined}
                    className="group flex min-h-16 items-center gap-4"
                  >
                    <Icon aria-label={label} size={20} className="shrink-0 text-ink-faint transition-colors group-hover:text-accent" />
                    <span className="hidden w-20 shrink-0 text-sm text-ink-faint sm:inline">{label}</span>
                    <span className="min-w-0 flex-1 truncate font-mono text-[15px] font-bold text-ink transition-colors group-hover:text-accent sm:text-right">
                      {value}
                    </span>
                    <ArrowIcon className="h-4 w-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
                  </a>
                </li>
              );
            })}
          </ul>
          <p className="mt-6 text-sm text-ink-faint">References from teams I&rsquo;ve shipped with are available on request.</p>
        </div>

        <figure className="observer mx-auto w-full max-w-[22rem] lg:mx-0 lg:justify-self-end">
          <div className="relative">
            <div className="observer-frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/space/observer.jpg"
                alt="Mohamed Ashour in a dark suit, arms crossed."
                width={480}
                height={600}
                loading="lazy"
                decoding="async"
              />
            </div>
            <div
              className="detect"
              style={{ left: `${FACE.x}%`, top: `${FACE.y}%`, width: `${FACE.w}%`, height: `${FACE.h}%` }}
              aria-hidden="true"
            >
              <span className="detect-label">mohamed_ashour</span>
            </div>
            <span aria-hidden="true" className="hud pointer-events-none absolute -inset-3" />
          </div>
          <figcaption className="mt-6 font-mono text-[12px] uppercase leading-relaxed tracking-[0.05em] text-ink-faint">
            <span className="text-ink-soft">id</span> mohamed_ashour
            <br />
            <span className="text-ink-soft">class</span> ai engineer, sustaingrc
            <br />
            <span className="text-ink-soft">base</span> cairo, working with teams anywhere
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

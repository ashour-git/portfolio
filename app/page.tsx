import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { Proof } from "@/components/proof";
import { CopilotMemory } from "@/components/copilot-memory";
import { Projects } from "@/components/projects";
import { Experience } from "@/components/experience";
import { Skills } from "@/components/skills";
import { Principles } from "@/components/principles";
import { Contact } from "@/components/contact";

export default function Page() {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <Proof />
        <CopilotMemory />
        <Projects />
        <Experience />
        <Skills />
        <Principles />
        <Contact />
      </main>
    </>
  );
}

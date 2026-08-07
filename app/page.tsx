import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { Projects } from "@/components/projects";
import { CaseStudies } from "@/components/case-studies";
import { Experience } from "@/components/experience";
import { Skills } from "@/components/skills";
import { Principles } from "@/components/principles";
import { Insights } from "@/components/insights";
import { Contact } from "@/components/contact";

export default function Page() {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <Projects />
        <CaseStudies />
        <Experience />
        <Skills />
        <Principles />
        <Insights />
        <Contact />
      </main>
    </>
  );
}
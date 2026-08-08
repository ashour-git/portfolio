import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { Projects } from "@/components/projects";
import { CaseStudies } from "@/components/case-studies";
import { Experience } from "@/components/experience";
import { Skills } from "@/components/skills";
import { Principles } from "@/components/principles";
import { Insights } from "@/components/insights";
import { Contact } from "@/components/contact";
import { PipelineSeparator } from "@/components/pipeline-separator";

export default function Page() {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <PipelineSeparator from="engineering" to="shipped products" />
        <Projects />
        <PipelineSeparator from="built" to="verified" />
        <CaseStudies />
        <PipelineSeparator from="why" to="what it takes" />
        <Experience />
        <Skills />
        <Principles />
        <Insights />
        <Contact />
      </main>
    </>
  );
}
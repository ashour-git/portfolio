import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { Projects } from "@/components/projects";
import { Experience } from "@/components/experience";
import { Skills } from "@/components/skills";
import { Insights } from "@/components/insights";
import { GithubStats } from "@/components/github-stats";
import { Contact } from "@/components/contact";

export default function Page() {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <Projects />
        <Experience />
        <Skills />
        <Insights />
        <GithubStats />
        <Contact />
      </main>
    </>
  );
}
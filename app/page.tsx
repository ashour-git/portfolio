import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { Projects } from "@/components/projects";
import { Experience } from "@/components/experience";
import { Skills } from "@/components/skills";
import { Insights } from "@/components/insights";
import { Contact } from "@/components/contact";
import { Footer } from "@/components/footer";

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
        <Contact />
      </main>
      <Footer />
    </>
  );
}
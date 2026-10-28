import { Suspense } from "react";
import Header from "../components/Header";
import About from "../components/About";
import Skills from "../components/Skills";
import Projects from "../components/Projects";
import Contact from "../components/Contact";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <About />
      <Suspense fallback={<p style={{padding:"2rem"}}>Chargement des compétences…</p>}>
        <Skills />
      </Suspense>
      <Suspense fallback={<p style={{padding:"2rem"}}>Chargement des projets…</p>}>
        <Projects />
      </Suspense>
      <Contact />
      <Footer />
    </>
  );
}

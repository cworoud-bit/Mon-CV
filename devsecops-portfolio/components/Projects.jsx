import Link from "next/link";
import { getProjects } from "../lib/api";

export default async function Projects() {
  const projects = await getProjects();
  return (
    <section id="projects" style={{padding:"2rem"}}>
      <h2>Projects</h2>
      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:"1rem"}}>
        {projects.map((p) => (
          <Link key={p.slug} href={`/projects/${p.slug}`} style={{border:"1px solid #ddd", borderRadius:"6px", padding:"1rem", textDecoration:"none", color:"inherit"}}>
            <h3>{p.title}</h3>
            <p style={{color:"#666", fontSize:"0.9rem"}}>{p.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

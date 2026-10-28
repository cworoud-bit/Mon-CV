import { connection } from "next/server";

async function get(path) {
  await connection();
  const base = process.env.API_URL;
  if (!base) throw new Error("La variable d'environnement API_URL n'est pas définie");
  const res = await fetch(`${base}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Erreur API ${res.status} sur ${path}`);
  return res.json();
}

export const getProjects = () => get("/api/projects");
export const getSkills = () => get("/api/skills");

import { projects as localProjects } from "../data/projects";
import { skills as localSkills } from "../data/skills";

// URL lue dans l'environnement (jamais écrite en dur dans le code)
const API_URL = process.env.API_URL;

async function fetchFromApi(path, fallback) {
  if (!API_URL) return fallback;
  try {
    const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`API indisponible (${path}) :`, err.message);
    return fallback; // données locales si l'API ne répond pas
  }
}

export const getProjects = () => fetchFromApi("/api/projects", localProjects);
export const getSkills = () => fetchFromApi("/api/skills", localSkills);

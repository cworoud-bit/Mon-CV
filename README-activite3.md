# Activité 3 : Ansible, API Express et Dockerisation

## Structure du dépôt

```
.
├── ansible/
│   ├── inventory
│   ├── install-packages.yml
│   └── install-docker.yml
├── api/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   └── data/
│       ├── profile.js
│       ├── projects.js
│       └── skills.js
├── devsecops-portfolio/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env.example
│   ├── next.config.js
│   ├── lib/api.js
│   └── app/page.js
└── docker-compose.yml
```

---

## VII. Automatisation avec Ansible

### 25. Installation d'Ansible (VM d'administration)

```bash
sudo apt update && sudo apt install -y ansible
ansible --version
```

![ansible --version](screenshots/25-ansible-version.png)

### 26. Inventory et test de communication

Fichier `ansible/inventory` :

```ini
[servers]
ubuntu-server ansible_host=192.168.1.20 ansible_user=ubuntu

[servers:vars]
ansible_python_interpreter=/usr/bin/python3
```

Commandes :

```bash
ssh-copy-id ubuntu@192.168.1.20
ansible all -i inventory -m ping
```

![ansible ping](screenshots/ansible-ping.png)

### 27. Premier playbook : installation de curl et git

Fichier `ansible/install-packages.yml` :

```yaml
---
- name: Installer curl et git
  hosts: all
  become: true
  tasks:
    - name: Mettre à jour le cache apt
      ansible.builtin.apt:
        update_cache: true
        cache_valid_time: 3600

    - name: Installer curl et git
      ansible.builtin.apt:
        name:
          - curl
          - git
        state: present
```

Exécution :

```bash
ansible-playbook -i inventory install-packages.yml
```

![Exécution du playbook](screenshots/ansible-packages.png)

### 28. Playbook d'installation de Docker

Fichier `ansible/install-docker.yml` :

```yaml
---
- name: Installer Docker sur une nouvelle VM
  hosts: all
  become: true
  tasks:
    - name: Installer les prérequis
      ansible.builtin.apt:
        name: [ca-certificates, curl, gnupg]
        state: present
        update_cache: true

    - name: Créer le dossier des clés
      ansible.builtin.file:
        path: /etc/apt/keyrings
        state: directory
        mode: "0755"

    - name: Ajouter la clé GPG Docker
      ansible.builtin.get_url:
        url: https://download.docker.com/linux/ubuntu/gpg
        dest: /etc/apt/keyrings/docker.asc
        mode: "0644"

    - name: Ajouter le dépôt Docker
      ansible.builtin.apt_repository:
        repo: "deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu {{ ansible_distribution_release }} stable"
        state: present
        filename: docker

    - name: Installer Docker
      ansible.builtin.apt:
        name:
          - docker-ce
          - docker-ce-cli
          - containerd.io
          - docker-compose-plugin
        state: present
        update_cache: true

    - name: Démarrer et activer Docker
      ansible.builtin.service:
        name: docker
        state: started
        enabled: true

    - name: Ajouter l'utilisateur au groupe docker
      ansible.builtin.user:
        name: "{{ ansible_user }}"
        groups: docker
        append: true
```

Exécution et vérification :

```bash
ansible-playbook -i inventory install-docker.yml
ssh ubuntu@192.168.1.20 "docker --version"
```

![docker --version](screenshots/ansible-docker.png)

---

## VIII. API Node.js / Express

### 29. Création de l'API

Structure du projet : voir l'arborescence en haut de ce document (dossier `api/`).

```bash
mkdir api && cd api
npm init -y
npm install express cors
npm start
```

`package.json` contient `"scripts": { "start": "node server.js" }`. L'API est indépendante du frontend et écoute sur le port 4000.

`api/server.js` :

```js
const express = require("express");
const cors = require("cors");
const profile = require("./data/profile");
const projects = require("./data/projects");
const skills = require("./data/skills");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());

app.get("/api/health", (req, res) =>
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() })
);
app.get("/api/profile", (req, res) => res.json(profile));
app.get("/api/projects", (req, res) => res.json(projects));
app.get("/api/skills", (req, res) => res.json(skills));

app.listen(PORT, "0.0.0.0", () => console.log(`API démarrée sur le port ${PORT}`));
```

![Serveur démarré](screenshots/point29.png)

### 30. Route `GET /api/health`

```bash
curl http://localhost:4000/api/health
```

![Health](screenshots/api-health.png)

### 31. Route `GET /api/profile`

`api/data/profile.js` :

```js
module.exports = {
  name: "Votre Nom",
  title: "Étudiant DevSecOps",
  bio: "Courte présentation...",
  email: "vous@example.com",
  github: "https://github.com/votre-compte",
};
```

```bash
curl http://localhost:4000/api/profile
```

![Profile](screenshots/api-profile.png)

### 32. Route `GET /api/projects`

`api/data/projects.js` :

```js
module.exports = [
  { id: 1, title: "Portfolio DevSecOps", description: "Site Next.js conteneurisé", tags: ["Next.js", "Docker"] },
  { id: 2, title: "Pipeline CI/CD", description: "Build, tests et scan de sécurité", tags: ["GitHub Actions", "Trivy"] },
];
```

```bash
curl http://localhost:4000/api/projects
```

![Projects](screenshots/api-projects.png)

### 33. Route `GET /api/skills`

`api/data/skills.js` :

```js
module.exports = [
  { id: 1, name: "Docker", level: "Intermédiaire" },
  { id: 2, name: "Ansible", level: "Débutant" },
  { id: 3, name: "Linux", level: "Intermédiaire" },
];
```

```bash
curl http://localhost:4000/api/skills
```

![Skills](screenshots/api-skills.png)

### 34. Frontend : projets depuis l'API

Le frontend ne lit plus de données locales. Un Server Component Next.js appelle l'API Express via `fetch`. L'option `cache: "no-store"` force la requête à l'exécution et non au build, ce qui est nécessaire en Docker car l'API n'existe pas pendant le build du frontend.

`devsecops-portfolio/lib/api.js` :

```js
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
```

`devsecops-portfolio/app/page.js` :

```jsx
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
      <Suspense fallback={<p>Chargement des compétences…</p>}>
        <Skills />
      </Suspense>
      <Suspense fallback={<p>Chargement des projets…</p>}>
        <Projects />
      </Suspense>
      <Contact />
      <Footer />
    </>
  );
}
```

![Projets depuis l'API](screenshots/nextjs-api-projects.png)

### 35. Frontend : compétences depuis l'API

Même principe avec `getSkills()` et la route `/api/skills`.

![Compétences depuis l'API](screenshots/nextjs-api-skills.png)

---

## IX. Variables d'environnement

### 36. Variable `API_URL`

Le frontend lit l'URL de l'API via `process.env.API_URL` (en local : `devsecops-portfolio/.env.local`, non commité).

**Pourquoi ne pas coder l'URL en dur ?**
L'URL de l'API change selon l'environnement : `http://localhost:4000` en développement, `http://api:4000` dans Docker Compose, un domaine HTTPS en production. La coder en dur obligerait à modifier le code et à reconstruire l'image à chaque changement. Avec une variable d'environnement, la même image fonctionne partout et la configuration reste séparée du code.

### 37. Fichier `.env.example`

```env
# URL de l'API Express (aucun secret ici)
API_URL=http://localhost:4000
```

Le `.gitignore` ignore `.env*` sauf `.env.example`.

---

## X. Dockerisation

### 38. Dockerfile du frontend

`next.config.js` :

```js
module.exports = { output: "standalone" };
```

`devsecops-portfolio/Dockerfile` :

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --fetch-timeout=600000 --fetch-retries=5 --fetch-retry-maxtimeout=120000

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder /app/public ./public
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
USER app
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
```

**Explication :** build multi-étapes (dépendances, build, exécution). L'image finale est légère car elle ne contient que le résultat du build en mode standalone, et l'application s'exécute avec un utilisateur non-root. Un `.dockerignore` exclut `node_modules`, `.next`, `.env*` et `.git`.

### 39. Dockerfile de l'API

`api/Dockerfile` :

```dockerfile
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
USER node
EXPOSE 4000
CMD ["node", "server.js"]
```

**Explication :** image Alpine minimale, uniquement les dépendances de production, et exécution avec l'utilisateur `node` non privilégié.

### 40. Construction des images

```bash
docker build --network=host -t devsecops-portfolio ./devsecops-portfolio
docker build --network=host -t devsecops-api ./api
docker images | grep devsecops
```

`--network=host` a été utilisé car le réseau lent des conteneurs provoquait des timeouts (`EIDLETIMEOUT`) lors de `npm ci`. Les images ont ensuite été transférées vers la VM `worker2` (où Docker a été installé avec Ansible) :

```bash
docker save devsecops-portfolio | ssh wrida@192.168.220.169 docker load
docker save devsecops-api | ssh wrida@192.168.220.169 docker load
```

![docker images](screenshots/40-docker-images.png)

### 41. Docker Compose

`docker-compose.yml` (le service `portfolio` du CV statique existant est conservé) :

```yaml
services:
  portfolio:
    build: .
    image: cv-docker
    container_name: cv-portfolio
    ports:
      - "8081:80"
    restart: unless-stopped

  api:
    build: ./api
    image: devsecops-api
    container_name: devsecops-api
    ports:
      - "4000:4000"
    restart: unless-stopped

  frontend:
    build: ./devsecops-portfolio
    image: devsecops-portfolio
    container_name: devsecops-portfolio
    environment:
      - API_URL=http://api:4000
    ports:
      - "3000:3000"
    depends_on:
      - api
    restart: unless-stopped
```

```bash
docker compose up -d --no-build api frontend
docker compose ps
```

Résultat :

```
NAME                  IMAGE                 COMMAND                  SERVICE    STATUS         PORTS
devsecops-api         devsecops-api         "docker-entrypoint.s…"   api        Up 2 seconds   0.0.0.0:4000->4000/tcp
devsecops-portfolio   devsecops-portfolio   "docker-entrypoint.s…"   frontend   Up 1 second    0.0.0.0:3000->3000/tcp
```

![docker compose ps](screenshots/41-compose-ps.png)

### 42. Communication frontend / API via le réseau Compose

Docker Compose crée un réseau par défaut (`mon-cv_default`) où chaque service est joignable par son nom DNS. Le frontend appelle donc l'API avec `http://api:4000` (valeur de `API_URL`). L'appel est fait côté serveur par Next.js, il passe donc bien par le réseau Docker.

Preuve depuis le conteneur du frontend :

```bash
docker compose exec frontend wget -qO- http://api:4000/api/health
```

```json
{"status":"ok","service":"devsecops-api","uptime":215.98,"timestamp":"2026-10-28T22:15:18.955Z"}
```

Le Portfolio (`http://192.168.220.169:3000`) affiche les compétences et projets fournis par l'API :

![Portfolio avec données de l'API](screenshots/42-portfolio-api.png)

# Activité 4 : Vagrant + Ansible, sécurisation de l'API, PostgreSQL, tests et pipeline DevSecOps

## 11. Infrastructure automatisée avec Vagrant + Ansible

### 43. Playbook de déploiement du Portfolio avec Docker Compose

Fichier `ansible/deploy-portfolio.yml` (déploiement sur une VM qui a déjà Docker) :

```yaml
---
- name: Déployer le DevSecOps Portfolio avec Docker Compose
  hosts: docker_vm
  become: true
  vars:
    repo_url: https://github.com/cworoud-bit/Mon-CV.git
    repo_branch: activite-4
    app_dir: /opt/devsecops

  tasks:
    - name: Installer git
      ansible.builtin.apt:
        name: git
        state: present
        update_cache: true

    - name: Récupérer le code du projet
      ansible.builtin.git:
        repo: "{{ repo_url }}"
        dest: "{{ app_dir }}"
        version: "{{ repo_branch }}"
        force: true

    - name: Construire et démarrer api et frontend
      community.docker.docker_compose_v2:
        project_src: "{{ app_dir }}"
        services:
          - api
          - frontend
        build: always
        state: present
```

Commande utilisée :

```bash
ansible-playbook -i inventory deploy-portfolio.yml -K
```

![Portfolio accessible](screenshots/43-portfolio-vagrant.png)

### 44. Vagrant lance automatiquement Ansible

Chaîne obtenue : `vagrant up` → création de la VM → configuration Ansible → installation de Docker → déploiement du Portfolio.

`Vagrantfile` :

```ruby
Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/jammy64"
  config.vm.hostname = "devsecops-vm"
  config.vm.boot_timeout = 900

  config.vm.network "private_network", ip: "192.168.56.10"
  config.vm.network "forwarded_port", guest: 3000, host: 3000,
                    host_ip: "127.0.0.1", auto_correct: true

  config.vm.provider "virtualbox" do |vb|
    vb.name = "devsecops-vm"
    vb.memory = 3072
    vb.cpus = 2
  end

  # Après la création de la VM : Ansible (dans la VM) installe Docker et déploie le Portfolio
  config.vm.provision "ansible_local" do |ansible|
    ansible.playbook = "ansible/site.yml"
    ansible.compatibility_mode = "2.0"
  end
end
```

Le provisioner `ansible_local` installe Ansible dans la VM : aucune installation d'Ansible n'est nécessaire sous Windows. Le playbook `ansible/site.yml` installe Docker, clone le dépôt (branche `activite-4`), lance `docker compose up -d --build api frontend` (avec `retries` en cas d'échec réseau), puis attend que le Portfolio réponde sur le port 3000.

```powershell
vagrant up
```

Résultat : `PLAY RECAP : ok=11 changed=4 unreachable=0 failed=0`.

![vagrant up avec le PLAY RECAP](screenshots/44-vagrant-up.png)

### 45. Test de reconstruction complète

```powershell
vagrant destroy -f
vagrant up
```

La VM est détruite puis recréée, et le Portfolio est redéployé automatiquement, sans intervention manuelle, sur `http://localhost:3000`.

![vagrant destroy puis vagrant up](screenshots/45-vagrant-destroy-up.png)




## Pipeline Jenkins DevSecOps

| Étape | Outil | Rôle |
|---|---|---|
| Checkout | Git | Récupère la branche et le SHA court |
| Scan des secrets | Gitleaks | Échoue si un secret est détecté |
| SAST | Semgrep | Analyse du code frontend et API |
| Tests | Node test runner / Vitest | Tests frontend et API |
| Audit des dépendances | npm audit | Échoue si faille critique |
| Contrôle des dépendances | OWASP Dependency-Check | Échoue si CVSS ≥ 9 |
| Build | Docker | Images taguées avec le Git SHA |
| Scan des images | Trivy | Échoue si faille CRITICAL |

### Q61 : tests automatiques
Les tests du frontend et de l'API s'exécutent à chaque build.

![Stages Jenkins](screenshots/61-jenkins-tests.png)
![Tests frontend et API](screenshots/61-tests-frontend-api.png)

### Q62 : construction des images
![Build des images](screenshots/62-jenkins-build-images.png)

### Q63 : tag Git SHA
Les images sont taguées avec le SHA court du commit.

![Images taguées](screenshots/63-images-sha.png)

### Q64 : scan des secrets (Gitleaks)
![Gitleaks](screenshots/64-gitleaks-ok.png)

### Q65 : SAST (Semgrep)
![Semgrep](screenshots/65-semgrep.png)

### Q66 et Q67 : dépendances
`npm audit` a détecté une faille critique dans `next` 16.0.0 à 16.4.0, corrigée en 16.4.3.

![Dépendance vulnérable](screenshots/67-dependance-vulnerable.png)

OWASP Dependency-Check a détecté `deepmerge-ts` 7.1.5 (GHSA-ggr8-5vv4-36mx, CVSS 10.0), corrigé en 8.0.0 avec `overrides`.

![Dependency-Check](screenshots/dependency-check-critique.png)

### Q68 : scan des images (Trivy)
Trivy a détecté `tar` 6.2.1 dans npm (CVE-2026-59873, CRITICAL). Correction : npm retiré de l'image finale.

![Trivy : échec](screenshots/trivy-echec-critical.png)
![Trivy : réussi](screenshots/68-trivy-ok.png)

### Q69 : le pipeline échoue sur faille critique ou secret

Pipeline réussi :

![Pipeline réussi](screenshots/69-pipeline-reussi.png)
![Pipeline réussi (vue complète)](screenshots/pipeline-reussi.png)

Pipeline échoué (secret détecté par Gitleaks, sur une branche de test) :

![Pipeline échoué](screenshots/69-pipeline-echoue.png)
![Échec Gitleaks](screenshots/pipeline-echec-gitleaks.png)
![Secret détecté](screenshots/gitleaks-secret-detecte.png)

Pipeline échoué (faille critique détectée par Trivy) :

![Échec Trivy](screenshots/pipeline-echec-trivy.png)

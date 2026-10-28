export const projects = [
  {
    slug: "infra-ssh",
    title: "Infrastructure Ubuntu + SSH sécurisé",
    description: "VM Ubuntu Server 26.04 avec accès SSH par clé, mot de passe désactivé.",
    tags: ["Ubuntu", "SSH"]
  },
  {
    slug: "jenkins-cicd",
    title: "CI/CD avec Jenkins",
    description: "Installation de Jenkins en service, vérifié depuis la machine physique.",
    tags: ["Jenkins", "CI/CD"]
  },
  {
    slug: "docker-portfolio",
    title: "Conteneurisation avec Docker",
    description: "Dockerisation du portfolio et déploiement avec Docker Compose.",
    tags: ["Docker", "Nginx"]
  },
  {
    slug: "vagrant-automation",
    title: "Automatisation avec Vagrant",
    description: "Création reproductible de VM via Vagrantfile (provider Docker).",
    tags: ["Vagrant", "IaC"]
  },
  {
    slug: "ansible-automation",
    title: "Automatisation avec Ansible",
    description: "Playbooks pour installer des paquets et Docker sur plusieurs VM.",
    tags: ["Ansible", "IaC"]
  }
];

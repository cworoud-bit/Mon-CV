#!/usr/bin/env bash
# Supprime l'application du serveur (Ansible) puis l'infrastructure (Terraform)
set -euo pipefail
cd "$(dirname "$0")"

export TF_PLUGIN_CACHE_DIR="${TF_PLUGIN_CACHE_DIR:-$HOME/.terraform.d/plugin-cache}"
export ANSIBLE_HOST_KEY_CHECKING=False

if [ -f ansible/inventory.ini ]; then
  echo "==> Ansible : suppression de l'application"
  ansible-playbook -i ansible/inventory.ini ansible/destroy.yml || true
fi

echo "==> Terraform : suppression de l'infrastructure"
terraform -chdir=terraform destroy -auto-approve -input=false
rm -f ansible/inventory.ini
echo "Infrastructure supprimée."

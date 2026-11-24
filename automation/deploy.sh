#!/usr/bin/env bash
# Terraform (infrastructure) puis Ansible (configuration du serveur)
set -euo pipefail
cd "$(dirname "$0")"

export TF_PLUGIN_CACHE_DIR="${TF_PLUGIN_CACHE_DIR:-$HOME/.terraform.d/plugin-cache}"
export ANSIBLE_HOST_KEY_CHECKING=False

echo "==> 1/3 Terraform : création de l'infrastructure dans Floci"
terraform -chdir=terraform init -input=false
terraform -chdir=terraform apply -auto-approve -input=false

echo "==> 2/3 Inventaire Ansible généré à partir des sorties Terraform"
WORKER_IP=$(terraform -chdir=terraform output -raw worker_ip)
WORKER_USER=$(terraform -chdir=terraform output -raw worker_user)
cat > ansible/inventory.ini <<INV
[servers]
worker2 ansible_host=${WORKER_IP} ansible_user=${WORKER_USER}

[servers:vars]
ansible_python_interpreter=/usr/bin/python3
INV

echo "==> 3/3 Ansible : configuration du serveur"
ansible-playbook -i ansible/inventory.ini ansible/site.yml \
  -e bucket_name="$(terraform -chdir=terraform output -raw bucket_name)" \
  -e table_name="$(terraform -chdir=terraform output -raw table_name)"

echo "Terminé. Application : http://${WORKER_IP}:8088"

# Activité 6 : Cloud local avec Floci, Terraform et automatisation

## 22. Cloud local avec Floci

### 106. Installation de Floci

```bash
docker run -d --name floci -p 4566:4566 \
  -v /var/run/docker.sock:/var/run/docker.sock floci/floci
docker ps
```

Le socket Docker est monté pour que Floci puisse lancer les fonctions Lambda dans des conteneurs.

### 107. Configuration de l'AWS CLI

```bash
aws configure --profile floci      # test / test / us-east-1 / json
alias awsl='aws --endpoint-url http://localhost:4566'
export AWS_PROFILE=floci
awsl sts get-caller-identity
```

```json
{
    "UserId": "000000000000",
    "Account": "000000000000",
    "Arn": "arn:aws:iam::000000000000:root"
}
```

### 108. Bucket S3

```bash
awsl s3 mb s3://mon-bucket
```

```
make_bucket: mon-bucket
```

### 109. Envoi et récupération d'un fichier S3

```bash
echo "hello" > f.txt
awsl s3 cp f.txt s3://mon-bucket/
awsl s3 cp s3://mon-bucket/f.txt out.txt && cat out.txt
```

```
upload: ./f.txt to s3://mon-bucket/f.txt
download: s3://mon-bucket/f.txt to ./out.txt
hello
```

### 110. File SQS

```bash
awsl sqs create-queue --queue-name test-q
awsl sqs send-message --queue-url http://localhost:4566/000000000000/test-q --message-body "hi"
awsl sqs receive-message --queue-url http://localhost:4566/000000000000/test-q
```

![Envoi et lecture d'un message SQS](screenshots/send-receive.png)

### 111. Table DynamoDB

```bash
awsl dynamodb create-table --table-name users \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH --billing-mode PAY_PER_REQUEST
awsl dynamodb put-item --table-name users --item '{"id":{"S":"1"},"name":{"S":"Ali"}}'
awsl dynamodb put-item --table-name users --item '{"id":{"S":"2"},"name":{"S":"Sara"}}'
awsl dynamodb scan --table-name users
```

### 112. Fonction Lambda Node.js

`index.js` :

```js
exports.handler = async (e) => ({statusCode:200, body:"ok"})
```

```bash
zip fn.zip index.js
awsl lambda create-function --function-name hello --runtime nodejs20.x \
  --handler index.handler --zip-file fileb://fn.zip \
  --role arn:aws:iam::000000000000:role/r
awsl lambda invoke --function-name hello out.json && cat out.json
```

```
{"statusCode":200,"body":"ok"}
```

### 113. Secrets Manager

```bash
awsl secretsmanager create-secret --name demo --secret-string "valeur"
awsl secretsmanager get-secret-value --secret-id demo
```

Le champ `SecretString` renvoie `"valeur"`.

### 114. API Express vers Floci (S3 et SQS)

La route `POST /api/contact` de l'API enregistre le message dans PostgreSQL, envoie la pièce jointe dans S3 et publie une notification dans SQS.

```mermaid
flowchart LR
  C[Client / curl] -->|POST /api/contact| A[API Express :4000]
  A -->|INSERT| P[(PostgreSQL)]
  A -->|PutObject pièce jointe| S3[(S3 - Floci)]
  A -->|SendMessage notification| SQS[[SQS - Floci]]
```

```bash
curl -s -X POST http://localhost:4000/api/contact \
  -F name=Wrida -F email=w@test.com -F message="Message avec piece jointe" \
  -F "attachment=@/tmp/pj.txt;type=text/plain"
```

```json
{"status":"ok","message":"Message bien reçu","id":12,"attachmentKey":"1795209671814-pj.txt","notificationId":"93eb03d6-4dcf-43de-96d6-6d8651b136f3"}
```

Les messages reçus dans la file SQS `contact-queue` :

![Messages dans la file contact-queue](screenshots/114.png)

### 115. Floci dans Docker Compose

Le service `floci` est ajouté au `docker-compose.yml`, l'API utilise `AWS_ENDPOINT_URL=http://floci:4566`.

![docker compose ps](screenshots/115.png)

### 116. Floci comme service container dans GitHub Actions

Le job `integration` du workflow `ci.yml` lance Floci comme service container et exécute les tests d'intégration sans compte AWS.

![Vérification locale du job et de la variable](screenshots/116.png)
![Run CI réussi sur la branche activite-6](screenshots/116-floci.png)

### 117. Comparaison : Floci, LocalStack et AWS réel

Informations vérifiées le 20 novembre 2026.

| Critère | Floci | LocalStack | AWS réel |
|---|---|---|---|
| Licence | MIT, open source | Propriétaire (l'édition Community Apache 2.0 est arrêtée depuis le 23 mars 2026) | Service commercial |
| Compte / token | Non | Oui (compte + auth token) | Oui (compte AWS) |
| Services | Large catalogue (S3, SQS, DynamoDB, Lambda, Secrets Manager, IAM...) | Selon le plan (Hobby, Base, Ultimate, Enterprise) | Catalogue complet |
| Fidélité | Bonne pour le développement et les tests, émulation (ne reproduit pas tous les cas limites) | Bonne, plus avancée dans les offres payantes | Référence, comportement exact |
| Coût | Gratuit | Gratuit en usage non commercial (Hobby), payant dès 39 $/licence/mois | Paiement à l'usage |
| Usage en CI | Simple : service container GitHub Actions, sans secret | Nécessite un auth token (secret) et une licence pour un usage commercial | Compte, identifiants et facturation, risque de coûts |
| Persistance | En mémoire par défaut (état perdu au redémarrage) | Selon l'édition | Permanente |

**Conclusion :** pour ce TP et pour la CI, Floci est le choix le plus adapté : gratuit, sans compte, sans secret, et le même code (AWS SDK, Terraform) fonctionne en changeant seulement l'endpoint. L'AWS réel reste nécessaire pour valider le comportement final et la production.

## 23. Introduction à Terraform

### 118. Installation de Terraform

```bash
sudo apt update
sudo apt install terraform -y
terraform version
```

![terraform version](screenshots/118.png)

### 119. Premier projet Terraform

Le projet se trouve dans le dossier `terraform/` et contient quatre fichiers : `providers.tf`, `main.tf`, `variables.tf` et `outputs.tf`. Le provider AWS est configuré pour utiliser les endpoints de Floci, avec des identifiants fictifs.

`providers.tf` :

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Identifiants fictifs : Floci n'a pas besoin de vrais identifiants
provider "aws" {
  region     = var.region
  access_key = "test"
  secret_key = "test"

  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  s3_use_path_style           = true

  endpoints {
    s3             = var.endpoint
    sqs            = var.endpoint
    dynamodb       = var.endpoint
    sts            = var.endpoint
    iam            = var.endpoint
    lambda         = var.endpoint
    secretsmanager = var.endpoint
  }
}
```

`variables.tf` :

```hcl
variable "endpoint" {
  description = "URL de Floci (émulateur AWS local)"
  type        = string
  default     = "http://localhost:4566"
}

variable "region" {
  description = "Région AWS"
  type        = string
  default     = "us-east-1"
}

variable "bucket_name" {
  description = "Nom du bucket S3"
  type        = string
  default     = "tf-demo-bucket"
}

variable "queue_name" {
  description = "Nom de la file SQS"
  type        = string
  default     = "tf-demo-queue"
}

variable "table_name" {
  description = "Nom de la table DynamoDB"
  type        = string
  default     = "tf-demo-table"
}
```

`outputs.tf` :

```hcl
output "bucket_name" {
  description = "Nom du bucket S3 créé"
  value       = aws_s3_bucket.demo.bucket
}

output "queue_url" {
  description = "URL de la file SQS créée"
  value       = aws_sqs_queue.demo.url
}

output "table_name" {
  description = "Nom de la table DynamoDB créée"
  value       = aws_dynamodb_table.demo.name
}
```

Le fichier `main.tf` est présenté au point 121.

### 120. init, fmt, validate et plan

```bash
cd terraform
terraform init
terraform fmt
terraform validate
terraform plan
```

![terraform plan](screenshots/120.png)

Le premier `terraform init` est long : le provider AWS (`hashicorp/aws` v5) pèse plusieurs centaines de Mo et le réseau de la VM est lent. Le téléchargement a été laissé se terminer.

### 121. Création des ressources avec Terraform

`main.tf` :

```hcl
resource "aws_s3_bucket" "demo" {
  bucket = var.bucket_name
}

resource "aws_sqs_queue" "demo" {
  name = var.queue_name
}

resource "aws_dynamodb_table" "demo" {
  name         = var.table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }
}
```

```bash
terraform apply
terraform output
```

Terraform crée trois ressources dans Floci : un bucket S3, une file SQS et une table DynamoDB.

![terraform apply](screenshots/121.png)

### 122. Vérification avec l'AWS CLI

```bash
awsl s3 ls
awsl sqs list-queues
awsl dynamodb list-tables
```

Les trois ressources créées par Terraform (`tf-demo-bucket`, `tf-demo-queue`, `tf-demo-table`) sont bien présentes dans Floci.

![Vérification avec l'AWS CLI](screenshots/122.png)

### 123. Destruction des ressources

```bash
terraform destroy
```

Terraform supprime les trois ressources qu'il avait créées. Les ressources de l'API (`contact-attachments`, `contact-queue`) ne sont pas concernées, car elles ne sont pas gérées par Terraform.

![terraform destroy](screenshots/123.png)

## 24. Terraform avancé

### 124. Modules réutilisables

La configuration de l'exercice 121 est transformée en trois modules réutilisables, un par type de ressource. Chaque module reçoit ses paramètres par des variables et expose ses résultats par des sorties.

```
terraform/
├── basic/                  # projet de l'exercice 119 à 123
├── modules/
│   ├── storage/            # bucket S3
│   ├── queue/              # file SQS
│   └── database/           # table DynamoDB
└── envs/
    ├── dev/
    ├── staging/
    └── prod/
```

Chaque module contient `main.tf`, `variables.tf` et `outputs.tf`. Exemple, `modules/queue/main.tf` :

```hcl
resource "aws_sqs_queue" "this" {
  name                       = var.queue_name
  visibility_timeout_seconds = var.visibility_timeout_seconds
  message_retention_seconds  = var.message_retention_seconds

  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
```

![Arborescence et validation des modules](screenshots/124.png)

### 125. Configurations séparées : dev, staging et prod

Chaque environnement est un projet Terraform indépendant dans `envs/<env>/`, avec son propre état. Il appelle les mêmes modules, et seul le fichier `terraform.tfvars` change.

`envs/dev/main.tf` (identique pour les trois environnements) :

```hcl
module "storage" {
  source = "../../modules/storage"

  bucket_name = "${var.project}-${var.environment}-bucket"
  environment = var.environment
}

module "queue" {
  source = "../../modules/queue"

  queue_name                 = "${var.project}-${var.environment}-queue"
  environment                = var.environment
  visibility_timeout_seconds = var.queue_visibility_timeout
  message_retention_seconds  = var.queue_retention_seconds
}

module "database" {
  source = "../../modules/database"

  table_name  = "${var.project}-${var.environment}-table"
  environment = var.environment
}
```

Valeurs propres à chaque environnement :

| Environnement | `environment` | Timeout de visibilité SQS | Conservation des messages SQS |
|---|---|---|---|
| dev | `dev` | 30 s | 1 jour |
| staging | `staging` | 60 s | 4 jours |
| prod | `prod` | 120 s | 14 jours |

Les ressources sont nommées avec l'environnement (`portfolio-dev-bucket`, `portfolio-staging-queue`, `portfolio-prod-table`), ce qui permet de les déployer côte à côte dans Floci.

```bash
cd terraform/envs/dev
terraform init
terraform plan
terraform apply
```

![Déploiement de l'environnement dev](screenshots/125.png)

### 126. Le rôle du fichier Terraform State

Le fichier d'état (`terraform.tfstate`) est la mémoire de Terraform. Il fait le lien entre les ressources décrites dans le code et les ressources réellement créées : identifiants, ARN et attributs de chaque ressource.

À chaque `terraform plan`, Terraform compare trois choses : le code, l'état et l'infrastructure réelle. C'est cette comparaison qui lui permet de savoir ce qu'il doit créer, modifier ou détruire. Sans état, il ne saurait pas que le bucket existe déjà et chercherait à le recréer.

Deux points importants :

- Le fichier peut contenir des informations sensibles en clair. Il ne doit donc pas être versionné dans Git (il est dans le `.gitignore`).
- En local, il n'est pas partageable et pas protégé contre deux exécutions simultanées. C'est pourquoi on le stocke dans un backend distant avec verrouillage (exercices 127 et 128).

### 127. Backend distant S3 hébergé dans Floci

Le state de chaque environnement est stocké dans un bucket S3 de Floci, avec une clé par environnement (`dev/terraform.tfstate`, `staging/terraform.tfstate`, `prod/terraform.tfstate`).

```bash
awsl s3 mb s3://tfstate-portfolio
```

`envs/dev/backend.tf` :

```hcl
terraform {
  backend "s3" {
    bucket = "tfstate-portfolio"
    key    = "dev/terraform.tfstate"
    region = "us-east-1"

    endpoints = {
      s3  = "http://localhost:4566"
      sts = "http://localhost:4566"
    }

    # Identifiants fictifs : Floci n'a pas besoin de vrais identifiants
    access_key = "test"
    secret_key = "test"

    use_path_style              = true
    skip_credentials_validation = true
    skip_metadata_api_check     = true
    skip_requesting_account_id  = true
    skip_region_validation      = true

    # Verrouillage du state (128)
    use_lockfile = true
  }
}
```

Le state local de `dev` est migré vers le backend distant :

```bash
cd terraform/envs/dev
terraform init -migrate-state
awsl s3 ls s3://tfstate-portfolio --recursive
terraform plan
```

Le `terraform plan` qui suit la migration indique `No changes` : les ressources existantes sont bien retrouvées dans le state distant.

![Migration du state vers S3](screenshots/127.png)

### 128. Verrouillage du state

L'option `use_lockfile = true` active le verrouillage natif du backend S3 : pendant une opération, Terraform dépose un fichier `terraform.tfstate.tflock` à côté du state, avec une écriture conditionnelle. Si le fichier existe déjà, la seconde exécution est refusée.

Test : un premier terminal lance `terraform apply` et reste en attente de confirmation (le verrou est alors pris). Un second terminal lance `terraform plan` sur le même environnement :

```
Error: Error acquiring the state lock

Error message: operation error S3: PutObject, https response error StatusCode: 412 ...
PreconditionFailed: At least one of the pre-conditions you specified did not hold
Lock Info:
  Path:      tfstate-portfolio/dev/terraform.tfstate
  Operation: OperationTypeApply
```

Le fichier de verrou est visible dans le bucket :

```bash
awsl s3 ls s3://tfstate-portfolio/dev/
```

```
terraform.tfstate
terraform.tfstate.tflock
```

Dès que le premier terminal termine ou annule l'opération, le verrou disparaît et le `terraform plan` suivant fonctionne.

![Exécution simultanée bloquée par le verrou](screenshots/128.png)

### 129. Analyse du code Terraform dans le pipeline (Trivy IaC)

Un job `iac` est ajouté au workflow `.github/workflows/ci.yml`. Il analyse le dossier `terraform/` avec Trivy (`trivy config`) et échoue si une misconfiguration de sévérité HIGH ou CRITICAL est trouvée. Le projet d'introduction `basic/` (exercices 118 à 123) et le cache `.terraform` sont exclus du scan.

```yaml
  iac:
    name: Scan IaC (Trivy)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
      - name: Analyse du code Terraform (échec si HIGH ou CRITICAL)
        run: |
          docker run --rm -v "$PWD/terraform":/tf aquasec/trivy:latest \
            config /tf --severity HIGH,CRITICAL --exit-code 1 \
            --skip-dirs "**/.terraform" --skip-dirs "**/basic"
```

Le premier scan des modules a trouvé des problèmes réels, corrigés dans le code :

| Règle | Problème | Correction |
|---|---|---|
| AWS-0086, 0087, 0091, 0093 | Pas de blocage de l'accès public sur le bucket S3 | Ressource `aws_s3_bucket_public_access_block` avec les quatre options à `true` |
| AWS-0096 | File SQS non chiffrée | `sqs_managed_sse_enabled = true` |
| AWS-0132 | Bucket non chiffré avec une clé KMS gérée par le client | Exception volontaire et justifiée dans le code (`#trivy:ignore:AVD-AWS-0132`) : le chiffrement SSE-S3 par défaut suffit pour ce TP |

Après correction, le scan retourne `Failures: 0` et le code de sortie 0.

Un faux positif Gitleaks est apparu dans la même CI : la réponse JSON de l'API collée dans ce README (clé de pièce jointe horodatée et identifiant de message SQS) a été prise pour une clé d'API (règle `generic-api-key`). Ce n'est pas un secret. Le résultat est ignoré par son empreinte dans le fichier `.gitleaksignore`, avec un commentaire de justification, sans désactiver le scan.

![Pipeline avec le job Scan IaC (Trivy)](screenshots/129.png)

### 130. Mauvaise configuration volontaire détectée par le pipeline

Sur une branche de test (`test-iac-echec`), trois erreurs sont introduites volontairement dans les modules :

- un bucket S3 en lecture publique (`acl = "public-read"`)
- le blocage d'accès public désactivé (les quatre options à `false`)
- la file SQS sans chiffrement (`sqs_managed_sse_enabled = false`)

```hcl
resource "aws_s3_bucket_acl" "bad" {
  bucket = aws_s3_bucket.this.id
  acl    = "public-read"
}
```

Résultat : le job `Scan IaC (Trivy)` échoue et fait échouer le pipeline, alors que les autres contrôles (Gitleaks, Semgrep, npm audit, tests, tests d'intégration Floci) restent verts. C'est donc bien l'analyse du code d'infrastructure qui détecte le problème.

![Pipeline échoué à cause du scan IaC](screenshots/130.png)
![Détail des misconfigurations signalées par Trivy](screenshots/130-trivy-log.png)

La branche de test n'est jamais fusionnée : elle est supprimée après les captures, et la branche `activite-6` garde la configuration saine.

### 131. Test d'OpenTofu avec la même infrastructure

OpenTofu est installé avec snap, puis exécuté sur exactement le même code HCL que Terraform (mêmes modules, même environnement `dev`).

```bash
sudo snap install opentofu --classic
tofu version
```

Le projet est copié dans `opentofu/` (modules et environnement `dev`, sans le fichier `backend.tf`, donc avec un state local). La variable `project` est passée en ligne de commande pour que les ressources s'appellent `tofu-dev-...` et ne rentrent pas en conflit avec celles de Terraform (`portfolio-dev-...`) :

```bash
cd opentofu/envs/dev
tofu init
tofu validate
tofu plan -var="project=tofu"
tofu apply -var="project=tofu"
```

Résultat : `Apply complete! Resources: 4 added, 0 changed, 0 destroyed.` (bucket S3, blocage d'accès public, file SQS et table DynamoDB). Les ressources sont visibles dans Floci à côté de celles créées par Terraform.

![OpenTofu : version et apply](screenshots/131.png)
![Vérification dans Floci](screenshots/131-verification.png)

**Difficulté rencontrée :** OpenTofu télécharge ses providers depuis son propre registre (`registry.opentofu.org`) et n'utilise pas le cache de Terraform. Le provider AWS pèse plusieurs centaines de Mo et la connexion de la VM est lente. La solution a été de configurer un miroir local dans `~/.tofurc` (`filesystem_mirror`) pointant vers le provider déjà téléchargé par Terraform : `tofu init` s'exécute alors en quelques secondes, sans téléchargement.

**Comparaison avec Terraform :**

| Critère | Terraform | OpenTofu |
|---|---|---|
| Commande | `terraform` | `tofu` |
| Licence | BUSL (source disponible, usage commercial restreint) | MPL-2.0, open source (Linux Foundation) |
| Code HCL | Référence | Identique, aucune modification nécessaire |
| Registre de providers | `registry.terraform.io` | `registry.opentofu.org` |
| Fichiers générés | `.terraform/`, `.terraform.lock.hcl`, `terraform.tfstate` | Mêmes fichiers, même format de state |
| Résultat sur Floci | 4 ressources créées | 4 ressources créées, comportement identique |
| Fonctionnalité propre | | Chiffrement natif du state |

**Conclusion :** pour ce projet, OpenTofu est un remplaçant direct de Terraform : même code, même résultat. Le choix se fait donc surtout sur la licence et la gouvernance du projet.

### 132. Terragrunt : factoriser les configurations dev, staging et prod

Avec Terraform seul, chaque environnement (`envs/dev`, `envs/staging`, `envs/prod`) contient les mêmes fichiers recopiés : `providers.tf`, `backend.tf`, `variables.tf`, `main.tf` et `outputs.tf`. Terragrunt permet de les écrire une seule fois.

```
terragrunt/
├── root.hcl               # provider et backend générés pour tous les environnements
├── stack/                 # code Terraform commun (main.tf, variables.tf, outputs.tf)
├── modules/               # modules storage, queue et database
├── dev/terragrunt.hcl     # uniquement les valeurs propres à dev
├── staging/terragrunt.hcl
└── prod/terragrunt.hcl
```

`root.hcl` génère le provider et le backend S3 de Floci dans chaque environnement. La clé du state dépend du dossier de l'environnement :

```hcl
generate "backend" {
  path      = "backend.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<BACKEND
terraform {
  backend "s3" {
    bucket = "tfstate-portfolio"
    key    = "terragrunt/${path_relative_to_include()}/terraform.tfstate"
    ...
  }
}
BACKEND
}

inputs = {
  project = "tg"
}
```

Chaque environnement se résume à un petit fichier. Exemple, `dev/terragrunt.hcl` :

```hcl
include "root" {
  path = find_in_parent_folders("root.hcl")
}

terraform {
  source = "${get_parent_terragrunt_dir()}//stack"
}

inputs = {
  environment              = "dev"
  queue_visibility_timeout = 30
  queue_retention_seconds  = 86400
}
```

Installation (le binaire a été téléchargé depuis Windows puis copié sur la VM, car le réseau de la VM est très lent) :

```bash
sudo install -m 0755 /tmp/terragrunt /usr/local/bin/terragrunt
terragrunt --version
```

![terragrunt --version](screenshots/132-version.png)

Plan de l'environnement `dev`, puis application sur les trois environnements en une seule commande :

```bash
cd terragrunt/dev
terragrunt plan

cd ..
terragrunt run --all plan
terragrunt run --all apply
```

![terragrunt plan sur dev](screenshots/132-plan.png)
![terragrunt run --all apply](screenshots/132-apply.png)

Résultat : `Succeeded 3` (dev, staging, prod). Chaque environnement a ses propres ressources (`tg-dev-...`, `tg-staging-...`, `tg-prod-...`) et son propre state dans le bucket `tfstate-portfolio` (`terragrunt/dev/terraform.tfstate`, `terragrunt/staging/terraform.tfstate`, `terragrunt/prod/terraform.tfstate`).

![Ressources et states dans Floci](screenshots/132-verification.png)

**Bilan de la factorisation :**

| | Terraform seul | Terragrunt |
|---|---|---|
| Lignes pour 3 environnements | environ 399 (133 par environnement) | 191 au total |
| Fichiers répétés par environnement | 6 | 1 (`terragrunt.hcl`, 13 lignes) |
| Ajouter un environnement | copier tout le dossier (133 lignes) | créer un `terragrunt.hcl` de 13 lignes |
| Changer le provider ou le backend | modifier 3 fois | modifier `root.hcl` une seule fois |

**Difficulté rencontrée :** le premier `terragrunt plan` a mis environ 6 minutes, car chaque dossier de travail télécharge le provider AWS (plusieurs centaines de Mo) sur un réseau lent. Le fichier `.terraform.lock.hcl` de `dev` a donc été copié dans `staging` et `prod`.

### 133. Découverte de Pulumi (TypeScript) sur Floci

Pulumi décrit l'infrastructure avec un vrai langage de programmation. Ici, un bucket S3 et une file SQS sont créés dans Floci avec TypeScript.

```
pulumi/
├── Pulumi.yaml       # projet (runtime Node.js)
├── Pulumi.dev.yaml   # stack "dev"
├── package.json
├── tsconfig.json
└── index.ts          # l'infrastructure, en TypeScript
```

`index.ts` :

```ts
import * as aws from "@pulumi/aws";

const endpoint = "http://localhost:4566";

// Provider AWS pointé sur Floci, avec des identifiants fictifs
const floci = new aws.Provider("floci", {
  region: "us-east-1",
  accessKey: "test",
  secretKey: "test",
  skipCredentialsValidation: true,
  skipMetadataApiCheck: true,
  skipRequestingAccountId: true,
  s3UsePathStyle: true,
  endpoints: [{ s3: endpoint, sqs: endpoint, sts: endpoint, iam: endpoint }],
});

const bucket = new aws.s3.BucketV2(
  "demo-bucket",
  { bucket: "pulumi-demo-bucket" },
  { provider: floci }
);

const queue = new aws.sqs.Queue(
  "demo-queue",
  { name: "pulumi-demo-queue" },
  { provider: floci }
);

export const bucketName = bucket.bucket;
export const queueUrl = queue.url;
```

Installation et utilisation (l'état est stocké localement, sans compte Pulumi Cloud) :

```bash
pulumi version
pulumi login --local
pulumi stack init dev
pulumi install
pulumi preview
pulumi up --yes
```

![pulumi version](screenshots/133-version.png)
![pulumi preview](screenshots/133-preview.png)
![pulumi up](screenshots/133-up.png)

Résultat : `Resources: + 4 created` en 27 secondes (le stack, le provider, le bucket et la file). Les ressources sont visibles dans Floci :

![Vérification dans Floci](screenshots/133-verification.png)

**Comparaison Terraform, OpenTofu et Pulumi :**

| Critère | Terraform | OpenTofu | Pulumi |
|---|---|---|---|
| Langage | HCL (déclaratif) | HCL, identique à Terraform | TypeScript, Python, Go... (langage de programmation) |
| Commandes | `terraform plan` / `apply` | `tofu plan` / `apply` | `pulumi preview` / `up` |
| Licence | BUSL | MPL-2.0 | Open source (Apache 2.0) |
| State | Local ou backend distant (S3 de Floci avec verrouillage) | Même format que Terraform | Backend local (`pulumi login --local`) ou Pulumi Cloud, avec phrase secrète |
| Réutilisation du code | Modules | Modules (compatibles Terraform) | Fonctions, classes et paquets npm |
| Courbe d'apprentissage | Faible pour de la config simple | Identique à Terraform | Plus facile pour un développeur, plus lourd à installer |
| Résultat sur Floci | Ressources créées | Ressources créées, comportement identique | Ressources créées |

**Difficultés rencontrées :** Pulumi nécessite plus de téléchargements que Terraform : le CLI (environ 100 Mo, téléchargé depuis Windows puis copié sur la VM à cause du réseau lent), les paquets npm et le provider AWS (environ 750 Mo une fois décompressé). Le provider doit aussi être configuré explicitement avec les endpoints de Floci (`endpoints`, `s3UsePathStyle`).

**Conclusion :** pour une infrastructure simple et déclarative, Terraform ou OpenTofu restent plus légers. Pulumi est plus intéressant quand on veut de vraies boucles, des conditions ou des fonctions, ou réutiliser les compétences d'un développeur.


### 134. Terraform puis Ansible : création de l'infrastructure et configuration du serveur

Terraform crée les ressources dans Floci et expose le serveur cible dans ses sorties. Un script génère l'inventaire Ansible à partir de ces sorties, puis Ansible configure le serveur (`worker2`, VM VMware, Docker déjà installé à l'activité 3).

```mermaid
flowchart LR
  TF["Terraform<br/>S3 + DynamoDB"] -->|"apply"| FL[("Floci<br/>localhost:4566")]
  TF -->|"outputs : bucket, table, IP"| SH["deploy.sh<br/>génère inventory.ini"]
  SH --> AN["Ansible<br/>site.yml"]
  AN -->|"SSH"| W2["worker2 (VMware)<br/>Docker + nginx :8088"]
```

```
automation/
├── terraform/        # providers.tf, main.tf, variables.tf, outputs.tf
├── ansible/
│   ├── site.yml      # configuration du serveur
│   ├── destroy.yml   # suppression de l'application
│   └── templates/index.html.j2
├── deploy.sh         # Terraform -> inventaire -> Ansible
└── destroy.sh        # Ansible (suppression) -> Terraform destroy
```

Terraform crée un bucket S3 (avec blocage d'accès public) et une table DynamoDB, puis publie `bucket_name`, `table_name`, `worker_ip` et `worker_user`. `deploy.sh` écrit l'inventaire à partir de ces sorties :

```bash
WORKER_IP=$(terraform -chdir=terraform output -raw worker_ip)
cat > ansible/inventory.ini <<INV
[servers]
worker2 ansible_host=${WORKER_IP} ansible_user=${WORKER_USER}
INV
ansible-playbook -i ansible/inventory.ini ansible/site.yml \
  -e bucket_name="$(terraform -chdir=terraform output -raw bucket_name)" \
  -e table_name="$(terraform -chdir=terraform output -raw table_name)"
```

`site.yml` vérifie Docker, installe le SDK Python de Docker, génère une page à partir des valeurs de Terraform (modèle Jinja2), lance un conteneur `nginx:alpine` sur le port 8088 et teste que la page répond.

```bash
cd ~/mon-cv/automation
time ./deploy.sh
curl http://192.168.220.169:8088
```

![deploy.sh : Terraform puis Ansible](screenshots/134-deploy.png)

Résultat : Terraform `3 added`, Ansible `ok=7 changed=4 failed=0`. La page affiche le bucket `auto-demo-bucket` et la table `auto-demo-table` créés par Terraform :

![Page servie par worker2](screenshots/134-page.png)

**Prérequis sur le serveur :** accès SSH par clé pour `wrida` et `sudo` sans mot de passe (`/etc/sudoers.d/wrida`), pour que l'automatisation ne demande aucune saisie.

### 135. Suppression complète puis reconstruction par les scripts

```bash
time ./destroy.sh                       # Ansible supprime l'application, Terraform détruit l'infrastructure
curl -m 3 http://192.168.220.169:8088   # l'application ne répond plus
aws --profile floci --endpoint-url http://localhost:4566 s3 ls   # le bucket auto-demo-bucket a disparu
time ./deploy.sh                        # reconstruction
curl http://192.168.220.169:8088
```

![Suppression](screenshots/135-destroy.png)
![Reconstruction](screenshots/135-rebuild.png)

| Étape | Commande | Résultat | Durée |
|---|---|---|---|
| Première construction | `./deploy.sh` | 3 ressources, `ok=7 changed=4` | 2 min 1 s (installation de `python3-docker` et téléchargement de `nginx:alpine`) |
| Suppression | `./destroy.sh` | conteneur et fichiers supprimés, `3 destroyed`, `Connection refused` sur :8088 | 11,4 s |
| Reconstruction | `./deploy.sh` | 3 ressources, `ok=7 changed=3`, page identique | 14,8 s |

L'environnement est reconstruit uniquement avec les scripts, en environ 15 secondes, sans aucune intervention manuelle. La reconstruction est plus rapide que la première construction, car le paquet Python et l'image nginx étaient déjà présents sur le serveur.

**Difficultés rencontrées :** le premier `terraform init` retéléchargeait le provider AWS (plusieurs centaines de Mo) sur un réseau lent. La solution a été de réutiliser le cache de plugins (`TF_PLUGIN_CACHE_DIR`) et le fichier `.terraform.lock.hcl`. Ansible a aussi échoué une première fois avec `Missing sudo password` : le sudo sans mot de passe sur le serveur est nécessaire pour une automatisation complète.

## Problèmes rencontrés

- Le paquet `awscli` installé par `apt` affichait `badly formed help string` : remplacé par AWS CLI v2 (2.35.x).
- Lambda : le premier `invoke` échouait (timeout) car l'image `public.ecr.aws/lambda/nodejs:20` n'était pas encore téléchargée : `docker pull` préalable.
- Floci doit monter `/var/run/docker.sock` pour exécuter les fonctions Lambda.

# Configuration commune à tous les environnements.
# Terragrunt génère ici le provider et le backend : ils ne sont plus répétés dans chaque environnement.

terraform_binary = "terraform"

generate "providers" {
  path      = "providers.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<PROVIDERS
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
PROVIDERS
}

generate "backend" {
  path      = "backend.tf"
  if_exists = "overwrite_terragrunt"
  contents  = <<BACKEND
terraform {
  backend "s3" {
    bucket = "tfstate-portfolio"
    key    = "terragrunt/${path_relative_to_include()}/terraform.tfstate"
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

    use_lockfile = true
  }
}
BACKEND
}

# Valeurs communes à tous les environnements
inputs = {
  project = "tg"
}

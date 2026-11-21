terraform {
  backend "s3" {
    bucket = "tfstate-portfolio"
    key    = "prod/terraform.tfstate"
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

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

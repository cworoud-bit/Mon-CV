include "root" {
  path = find_in_parent_folders("root.hcl")
}

terraform {
  source = "${get_parent_terragrunt_dir()}//stack"
}

inputs = {
  environment              = "prod"
  queue_visibility_timeout = 120
  queue_retention_seconds  = 1209600
}

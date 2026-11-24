include "root" {
  path = find_in_parent_folders("root.hcl")
}

terraform {
  source = "${get_parent_terragrunt_dir()}//stack"
}

inputs = {
  environment              = "staging"
  queue_visibility_timeout = 60
  queue_retention_seconds  = 345600
}

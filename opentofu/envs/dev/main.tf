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

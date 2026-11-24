output "bucket_name" {
  description = "Nom du bucket S3"
  value       = module.storage.bucket_name
}

output "queue_url" {
  description = "URL de la file SQS"
  value       = module.queue.queue_url
}

output "table_name" {
  description = "Nom de la table DynamoDB"
  value       = module.database.table_name
}

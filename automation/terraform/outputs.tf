output "bucket_name" {
  description = "Nom du bucket S3 créé"
  value       = aws_s3_bucket.app.bucket
}

output "table_name" {
  description = "Nom de la table DynamoDB créée"
  value       = aws_dynamodb_table.app.name
}

output "worker_ip" {
  description = "Adresse IP du serveur à configurer"
  value       = var.worker_ip
}

output "worker_user" {
  description = "Utilisateur SSH du serveur"
  value       = var.worker_user
}

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

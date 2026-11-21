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

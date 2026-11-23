variable "bucket_name" {
  description = "Nom du bucket S3"
  type        = string
}

variable "environment" {
  description = "Environnement (dev, staging, prod)"
  type        = string
}

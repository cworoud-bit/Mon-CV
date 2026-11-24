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
  description = "Nom du bucket S3 de l'application"
  type        = string
  default     = "auto-demo-bucket"
}

variable "table_name" {
  description = "Nom de la table DynamoDB de l'application"
  type        = string
  default     = "auto-demo-table"
}

variable "worker_ip" {
  description = "Adresse IP du serveur à configurer avec Ansible (VM VMware)"
  type        = string
  default     = "192.168.220.169"
}

variable "worker_user" {
  description = "Utilisateur SSH du serveur"
  type        = string
  default     = "wrida"
}

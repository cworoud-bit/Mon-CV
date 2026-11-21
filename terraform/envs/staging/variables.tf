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

variable "project" {
  description = "Nom du projet, utilisé dans le nom des ressources"
  type        = string
  default     = "portfolio"
}

variable "environment" {
  description = "Environnement (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "L'environnement doit être dev, staging ou prod."
  }
}

variable "queue_visibility_timeout" {
  description = "Durée d'invisibilité d'un message SQS (secondes)"
  type        = number
}

variable "queue_retention_seconds" {
  description = "Durée de conservation des messages SQS (secondes)"
  type        = number
}

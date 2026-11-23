variable "queue_name" {
  description = "Nom de la file SQS"
  type        = string
}

variable "environment" {
  description = "Environnement (dev, staging, prod)"
  type        = string
}

variable "visibility_timeout_seconds" {
  description = "Durée d'invisibilité d'un message lu"
  type        = number
  default     = 30
}

variable "message_retention_seconds" {
  description = "Durée de conservation des messages"
  type        = number
  default     = 345600
}

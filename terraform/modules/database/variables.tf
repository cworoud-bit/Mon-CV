variable "table_name" {
  description = "Nom de la table DynamoDB"
  type        = string
}

variable "environment" {
  description = "Environnement (dev, staging, prod)"
  type        = string
}

variable "hash_key" {
  description = "Clé de partition (type chaîne)"
  type        = string
  default     = "id"
}

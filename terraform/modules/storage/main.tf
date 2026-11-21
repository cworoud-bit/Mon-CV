# Trivy AWS-0132 : le chiffrement SSE-KMS avec une clé gérée par le client
# n'est pas retenu pour ce TP (chiffrement SSE-S3 par défaut sur le bucket).
#trivy:ignore:AVD-AWS-0132
resource "aws_s3_bucket" "this" {
  bucket = var.bucket_name

  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_s3_bucket_public_access_block" "this" {
  bucket = aws_s3_bucket.this.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

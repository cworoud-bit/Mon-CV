import * as aws from "@pulumi/aws";

const endpoint = "http://localhost:4566";

// Provider AWS pointé sur Floci, avec des identifiants fictifs
const floci = new aws.Provider("floci", {
  region: "us-east-1",
  accessKey: "test",
  secretKey: "test",
  skipCredentialsValidation: true,
  skipMetadataApiCheck: true,
  skipRequestingAccountId: true,
  s3UsePathStyle: true,
  endpoints: [
    {
      s3: endpoint,
      sqs: endpoint,
      sts: endpoint,
      iam: endpoint,
    },
  ],
});

// Bucket S3
const bucket = new aws.s3.BucketV2(
  "demo-bucket",
  { bucket: "pulumi-demo-bucket" },
  { provider: floci }
);

// File SQS
const queue = new aws.sqs.Queue(
  "demo-queue",
  { name: "pulumi-demo-queue" },
  { provider: floci }
);

export const bucketName = bucket.bucket;
export const queueUrl = queue.url;

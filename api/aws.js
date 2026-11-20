const {
  S3Client, CreateBucketCommand, HeadBucketCommand, PutObjectCommand,
} = require("@aws-sdk/client-s3");
const {
  SQSClient, CreateQueueCommand, SendMessageCommand,
} = require("@aws-sdk/client-sqs");

const ENDPOINT = process.env.AWS_ENDPOINT_URL || "http://localhost:4566";
const BUCKET = process.env.S3_BUCKET || "contact-attachments";
const QUEUE = process.env.SQS_QUEUE || "contact-queue";

const cfg = {
  region: process.env.AWS_REGION || "us-east-1",
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "test",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "test",
  },
};

const s3 = new S3Client({ ...cfg, forcePathStyle: true });
const sqs = new SQSClient(cfg);

let queueUrl;

async function ensureResources() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
  }
  const q = await sqs.send(new CreateQueueCommand({ QueueName: QUEUE }));
  queueUrl = q.QueueUrl;
}

async function uploadAttachment(file) {
  const key = `${Date.now()}-${file.originalname.replace(/[^\w.-]/g, "_")}`;
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET, Key: key, Body: file.buffer, ContentType: file.mimetype,
  }));
  return key;
}

async function notify(payload) {
  if (!queueUrl) await ensureResources();
  const r = await sqs.send(new SendMessageCommand({
    QueueUrl: queueUrl, MessageBody: JSON.stringify(payload),
  }));
  return r.MessageId;
}

module.exports = { ensureResources, uploadAttachment, notify };

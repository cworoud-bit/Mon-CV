const test = require("node:test");
const assert = require("node:assert");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { SQSClient, ReceiveMessageCommand } = require("@aws-sdk/client-sqs");
const aws = require("../../aws");

const ENDPOINT = process.env.AWS_ENDPOINT_URL || "http://localhost:4566";
const cfg = {
  region: "us-east-1",
  endpoint: ENDPOINT,
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
};
const s3 = new S3Client({ ...cfg, forcePathStyle: true });
const sqs = new SQSClient(cfg);

test("la pièce jointe est stockée dans S3 puis relue", async () => {
  await aws.ensureResources();
  const key = await aws.uploadAttachment({
    originalname: "pj.txt",
    mimetype: "text/plain",
    buffer: Buffer.from("piece jointe"),
  });
  const obj = await s3.send(new GetObjectCommand({ Bucket: "contact-attachments", Key: key }));
  assert.strictEqual(await obj.Body.transformToString(), "piece jointe");
});

test("la notification est envoyée dans SQS puis lue", async () => {
  const marker = `test-${Date.now()}`;
  const id = await aws.notify({ marker });
  assert.ok(id);
  const res = await sqs.send(
    new ReceiveMessageCommand({
      QueueUrl: `${ENDPOINT}/000000000000/contact-queue`,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 2,
    })
  );
  assert.ok((res.Messages || []).some((m) => m.Body.includes(marker)));
});

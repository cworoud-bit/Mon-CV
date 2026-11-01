process.env.CONTACT_RATE_LIMIT = "5";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../app");

test("le 6e envoi en une minute reçoit 429 avec Retry-After", async () => {
  for (let i = 0; i < 5; i++) {
    const res = await request(app).post("/api/contact").send({ name: "W" });
    assert.equal(res.status, 400);
  }
  const res = await request(app).post("/api/contact").send({ name: "W" });
  assert.equal(res.status, 429);
  assert.equal(res.body.code, "TOO_MANY_REQUESTS");
  assert.ok(res.headers["retry-after"]);
});

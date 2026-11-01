process.env.CONTACT_RATE_LIMIT = "1000";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../app");

const valid = { name: "Wrida", email: "wrida@example.com", message: "Message de test assez long." };

// --- Point 58 : routes de base ---
test("GET /api/health renvoie 200 et status ok", async () => {
  const res = await request(app).get("/api/health");
  assert.equal(res.status, 200);
  assert.equal(res.body.status, "ok");
});

test("GET /api/skills renvoie un tableau non vide", async () => {
  const res = await request(app).get("/api/skills");
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body) && res.body.length > 0);
});

test("une route inconnue renvoie 404 au format JSON", async () => {
  const res = await request(app).get("/api/inexistant");
  assert.equal(res.status, 404);
  assert.equal(res.body.code, "NOT_FOUND");
});

test("Helmet ajoute les en-têtes de sécurité et masque X-Powered-By", async () => {
  const res = await request(app).get("/api/health");
  assert.equal(res.headers["x-content-type-options"], "nosniff");
  assert.ok(res.headers["content-security-policy"]);
  assert.equal(res.headers["x-powered-by"], undefined);
});

// --- Point 59 : entrées invalides et tentatives d'injection ---
const invalidBodies = {
  "corps vide": {},
  "nom trop court": { ...valid, name: "W" },
  "email invalide": { ...valid, email: "pas-un-email" },
  "message trop court": { ...valid, message: "court" },
  "message trop long": { ...valid, message: "x".repeat(2001) },
  "champ inconnu (mass assignment)": { ...valid, role: "admin" },
  "nom de type objet (injection NoSQL)": { ...valid, name: { $ne: null } },
  "email de type tableau": { ...valid, email: ["a@b.com"] },
  "injection SQL dans l'email": { ...valid, email: "a@b.com' OR '1'='1" },
  "script dans l'email": { ...valid, email: "<script>alert(1)</script>" },
};

for (const [nom, body] of Object.entries(invalidBodies)) {
  test(`POST /api/contact refuse : ${nom}`, async () => {
    const res = await request(app).post("/api/contact").send(body);
    assert.equal(res.status, 400);
    assert.equal(res.body.code, "VALIDATION_ERROR");
  });
}

test("POST /api/contact refuse un JSON mal formé", async () => {
  const res = await request(app)
    .post("/api/contact")
    .set("Content-Type", "application/json")
    .send('{"name":');
  assert.equal(res.status, 400);
  assert.equal(res.body.code, "INVALID_JSON");
});

test("POST /api/contact refuse un corps qui n'est pas du JSON", async () => {
  const res = await request(app).post("/api/contact").set("Content-Type", "text/plain").send("bonjour");
  assert.equal(res.status, 400);
  assert.equal(res.body.code, "VALIDATION_ERROR");
});

test("POST /api/contact refuse un corps trop volumineux", async () => {
  const res = await request(app).post("/api/contact").send({ ...valid, message: "x".repeat(20000) });
  assert.equal(res.status, 413);
  assert.equal(res.body.code, "PAYLOAD_TOO_LARGE");
});

process.env.CONTACT_RATE_LIMIT = "1000";

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const app = require("../../app");
const prisma = require("../../db");

const marker = `integration-${Date.now()}`;
let server;
let sendContact;

function formData(values) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
}

before(async () => {
  assert.ok(process.env.DATABASE_URL, "DATABASE_URL doit être défini (voir le README)");
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  // Le frontend appelle l'API via la variable API_URL, comme dans Docker Compose
  process.env.API_URL = `http://127.0.0.1:${server.address().port}`;
  ({ sendContact } = await import("../../../devsecops-portfolio/app/actions.js"));
});

after(async () => {
  await prisma.contactMessage.deleteMany({ where: { name: { startsWith: marker } } });
  await prisma.$disconnect();
  await new Promise((resolve) => server.close(resolve));
});

test("frontend -> API -> PostgreSQL : un message valide est enregistré", async () => {
  const name = `${marker}-ok`;
  const result = await sendContact(null, formData({
    name,
    email: "Integration@Example.com",
    message: "Message envoyé par le test d'intégration.",
  }));
  assert.equal(result.ok, true);

  const row = await prisma.contactMessage.findFirst({ where: { name } });
  assert.ok(row, "la ligne doit exister dans PostgreSQL");
  assert.equal(row.email, "integration@example.com"); // normalisé par Zod
});

test("une donnée invalide est refusée et rien n'est écrit en base", async () => {
  const name = `${marker}-invalide`;
  const result = await sendContact(null, formData({
    name,
    email: "pas-un-email",
    message: "Message envoyé par le test d'intégration.",
  }));
  assert.equal(result.ok, false);
  assert.ok(result.errors.email);

  const count = await prisma.contactMessage.count({ where: { name } });
  assert.equal(count, 0);
});

test("une tentative d'injection SQL est stockée comme du texte, la table survit", async () => {
  const name = `${marker}-sql'); DROP TABLE contact_messages;--`;
  const result = await sendContact(null, formData({
    name,
    email: "sql@example.com",
    message: "Tentative d'injection SQL dans le nom.",
  }));
  assert.equal(result.ok, true);

  const row = await prisma.contactMessage.findFirst({ where: { name } });
  assert.ok(row, "le texte exact doit être enregistré tel quel");
  const total = await prisma.contactMessage.count(); // échouerait si la table avait disparu
  assert.ok(total >= 1);
});

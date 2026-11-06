const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { z } = require("zod");

const profile = require("./data/profile");
const projects = require("./data/projects");
const skills = require("./data/skills");

class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const contactSchema = z.strictObject({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(120),
  message: z.string().trim().min(10).max(2000),
});

const tooMany = (req, res) =>
  res.status(429).json({
    status: "error",
    code: "TOO_MANY_REQUESTS",
    message: "Trop de requêtes, réessayez plus tard.",
  });

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: tooMany,
});

const contactLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.CONTACT_RATE_LIMIT) || 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: tooMany,
});

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : false,
  })
);
app.use(express.json({ limit: "10kb" }));
app.use("/api", apiLimiter);

app.get("/api/health", (req, res) =>
  res.json({
    status: "ok",
    service: "devsecops-api",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
);
app.get("/api/profile", (req, res) => res.json(profile));
app.get("/api/projects", (req, res) => res.json(projects));
app.get("/api/skills", (req, res) => res.json(skills));

app.post("/api/contact", contactLimiter, async (req, res) => {
  const data = contactSchema.parse(req.body);
  const prisma = require("./db"); // chargé à la demande (facilite les tests)
  const entry = await prisma.contactMessage.create({ data });
  res.status(201).json({ status: "ok", message: "Message bien reçu", id: entry.id });
});
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    code: "NOT_FOUND",
    message: `Route ${req.method} ${req.originalUrl} introuvable`,
  });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.name === "ZodError") {
    return res.status(400).json({
      status: "error",
      code: "VALIDATION_ERROR",
      message: "Données invalides",
      details: err.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
    });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ status: "error", code: "INVALID_JSON", message: "JSON mal formé" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ status: "error", code: "PAYLOAD_TOO_LARGE", message: "Requête trop volumineuse" });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ status: "error", code: err.code, message: err.message });
  }
  console.error(err);
  res.status(500).json({ status: "error", code: "INTERNAL_ERROR", message: "Erreur interne du serveur" });
});

module.exports = app;

const express = require("express");
const cors = require("cors");

const profile = require("./data/profile");
const projects = require("./data/projects");
const skills = require("./data/skills");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "devsecops-api",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get("/api/profile", (req, res) => res.json(profile));
app.get("/api/projects", (req, res) => res.json(projects));
app.get("/api/skills", (req, res) => res.json(skills));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API démarrée sur le port ${PORT}`);
});

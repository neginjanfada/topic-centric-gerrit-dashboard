import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const PORT = process.env.PORT || 3001;
const BASE = (process.env.GERRIT_BASE_URL || "").replace(/\/$/, "");

/**
 * Build Gerrit URL
 */
function gerritUrl(path) {
  const hasAuth = !!(process.env.GERRIT_USER && process.env.GERRIT_TOKEN);
  const prefix = hasAuth ? "/a" : "";
  return `${BASE}${prefix}${path}`;
}

/**
 * Build Authorization header
 */
function authHeader() {
  const { GERRIT_USER, GERRIT_TOKEN } = process.env;
  if (!GERRIT_USER || !GERRIT_TOKEN) return {};
  const basic = Buffer.from(`${GERRIT_USER}:${GERRIT_TOKEN}`).toString(
    "base64",
  );
  return { Authorization: `Basic ${basic}` };
}

/**
 * Generic Gerrit GET helper
 */
async function gerritGet(path) {
  const res = await fetch(gerritUrl(path), {
    headers: {
      Accept: "application/json",
      ...authHeader(),
    },
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Gerrit ${res.status}: ${text}`);
  }

  // Strip Gerrit XSSI prefix
  const cleaned = text.replace(/^\)\]\}'\n/, "");
  return JSON.parse(cleaned);
}

/**
 * Health check
 */
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

/**
 * Get changes by topic
 */
app.get("/api/changes", async (req, res) => {
  try {
    const topic = (req.query.topic || "").trim();
    if (!topic) return res.status(400).json({ error: "Missing ?topic=" });

    const q = encodeURIComponent(`topic:"${topic}"`);
    const data = await gerritGet(`/changes/?q=${q}&n=50&pp=0`);

    res.json({ topic, changes: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * NEW: Dashboard endpoint (clean architecture)
 * This will later include metrics, contributors, activity, etc.
 */
app.get("/api/dashboard", async (req, res) => {
  try {
    const topic = (req.query.topic || "").trim();
    if (!topic) return res.status(400).json({ error: "Missing ?topic=" });

    const q = encodeURIComponent(`topic:"${topic}"`);
    const changes = await gerritGet(`/changes/?q=${q}&n=50&pp=0`);

    // For now we just return changes.
    // Next step we will compute metrics here.
    res.json({ topic, changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get single change detail
 */
app.get("/api/changes/:id", async (req, res) => {
  try {
    const id = encodeURIComponent(req.params.id);
    const data = await gerritGet(
      `/changes/?q=${q}&n=50&pp=0&o=DETAILED_ACCOUNTS`,
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});

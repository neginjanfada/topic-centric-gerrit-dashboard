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

// If you set user/token, we’ll use /a/ + Basic Auth.
// Gerrit REST responses start with an XSSI prefix ")]}'" that must be stripped.  [oai_citation_attribution:1‡gerrit-review.googlesource.com](https://gerrit-review.googlesource.com/Documentation/rest-api.html)
function gerritUrl(path) {
  const hasAuth = !!(process.env.GERRIT_USER && process.env.GERRIT_TOKEN);
  const prefix = hasAuth ? "/a" : "";
  return `${BASE}${prefix}${path}`;
}

function authHeader() {
  const { GERRIT_USER, GERRIT_TOKEN } = process.env;
  if (!GERRIT_USER || !GERRIT_TOKEN) return {};
  const basic = Buffer.from(`${GERRIT_USER}:${GERRIT_TOKEN}`).toString(
    "base64",
  );
  return { Authorization: `Basic ${basic}` };
}

async function gerritGet(path) {
  const res = await fetch(gerritUrl(path), {
    headers: {
      Accept: "application/json",
      ...authHeader(),
    },
  });

  const text = await res.text();

  if (!res.ok) {
    // Gerrit often returns plaintext error bodies
    throw new Error(`Gerrit ${res.status}: ${text}`);
  }

  // Strip XSSI prefix line: )]}'
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
 * Search changes by topic
 * Example: /api/changes?topic=feature/user-authentication-v2
 *
 * Uses Gerrit /changes/ endpoint.  [oai_citation_attribution:2‡gerrit-review.googlesource.com](https://gerrit-review.googlesource.com/Documentation/rest-api.html)
 */
app.get("/api/changes", async (req, res) => {
  try {
    const topic = (req.query.topic || "").trim();
    if (!topic) return res.status(400).json({ error: "Missing ?topic=" });

    // q=topic:"..." is the common query pattern for Gerrit searches.
    // We request compact JSON with pp=0 (more efficient).  [oai_citation_attribution:3‡gerrit-review.googlesource.com](https://gerrit-review.googlesource.com/Documentation/rest-api.html)
    const q = encodeURIComponent(`topic:"${topic}"`);
    const data = await gerritGet(`/changes/?q=${q}&n=50&pp=0`);

    res.json({ topic, changes: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * (Optional) Get one change detail
 */
app.get("/api/changes/:id", async (req, res) => {
  try {
    const id = encodeURIComponent(req.params.id);
    const data = await gerritGet(`/changes/${id}/detail?pp=0`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});

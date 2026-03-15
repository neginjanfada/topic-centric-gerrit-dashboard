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

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function formatOwner(change) {
  return (
    change?.owner?.name ||
    change?.owner?.username ||
    change?.owner?.email ||
    `User ${change?.owner?._account_id ?? ""}`.trim() ||
    "Unknown"
  );
}

function initialsFromName(name) {
  if (!name || name === "Unknown") return "U";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function toDateMs(value) {
  const ms = value ? new Date(value).getTime() : NaN;
  return Number.isNaN(ms) ? null : ms;
}

/**
 * Search Gerrit with standard options
 */
async function searchChanges(query) {
  const q = encodeURIComponent(query);

  const data = await gerritGet(
    `/changes/?q=${q}&n=100&pp=0` +
      `&o=DETAILED_ACCOUNTS` +
      `&o=LABELS` +
      `&o=DETAILED_LABELS` +
      `&o=SUBMIT_REQUIREMENTS`,
  );

  return safeArray(data);
}

/**
 * Fetch topic changes with fallback strategy:
 * 1) exact topic search
 * 2) commit message search
 * 3) subject search
 */
async function fetchTopicChanges(topic) {
  // First attempt: strict topic search
  let data = await searchChanges(`topic:"${topic}"`);
  if (data.length > 0) {
    return {
      changes: data,
      searchMode: "topic",
    };
  }

  console.log(`No topic results for "${topic}". Trying message search...`);

  // Second attempt: commit message search
  data = await searchChanges(`message:${topic}`);
  if (data.length > 0) {
    return {
      changes: data,
      searchMode: "message",
    };
  }

  console.log(`No message results for "${topic}". Trying subject search...`);

  // Third attempt: subject search
  data = await searchChanges(`subject:${topic}`);
  return {
    changes: data,
    searchMode: data.length > 0 ? "subject" : "none",
  };
}

/**
 * Topic overview metrics
 */
function buildMetrics(changes) {
  const totalChanges = changes.length;
  const openChanges = changes.filter((c) => c.status === "NEW").length;
  const mergedChanges = changes.filter((c) => c.status === "MERGED").length;
  const abandonedChanges = changes.filter(
    (c) => c.status === "ABANDONED",
  ).length;

  const repositories = new Set(changes.map((c) => c.project).filter(Boolean))
    .size;
  const branches = new Set(changes.map((c) => c.branch).filter(Boolean)).size;

  const mergeRate =
    totalChanges === 0 ? 0 : Math.round((mergedChanges / totalChanges) * 100);

  return {
    totalChanges,
    openChanges,
    mergedChanges,
    abandonedChanges,
    repositories,
    branches,
    mergeRate,
  };
}

/**
 * Recent activity from latest updated changes
 */
function buildRecentActivity(changes) {
  return changes
    .slice()
    .sort((a, b) =>
      String(b.updated || "").localeCompare(String(a.updated || "")),
    )
    .slice(0, 8)
    .map((c) => {
      let action = "updated";
      if (c.status === "MERGED") action = "merged";
      else if (c.status === "ABANDONED") action = "abandoned";
      else if (c.status === "NEW") action = "updated";

      return {
        who: formatOwner(c),
        action,
        id: c._number ? `#${c._number}` : c.id,
        time: c.updated ? c.updated.slice(0, 16).replace("T", " ") : "—",
        status: c.status || "UNKNOWN",
      };
    });
}

/**
 * Top contributors
 */
function buildContributors(changes) {
  const byOwner = new Map();

  for (const c of changes) {
    const key = c?.owner?._account_id || formatOwner(c);

    if (!byOwner.has(key)) {
      byOwner.set(key, {
        name: formatOwner(c),
        total: 0,
        merged: 0,
        open: 0,
        abandoned: 0,
      });
    }

    const row = byOwner.get(key);
    row.total += 1;
    if (c.status === "MERGED") row.merged += 1;
    if (c.status === "NEW") row.open += 1;
    if (c.status === "ABANDONED") row.abandoned += 1;
  }

  return Array.from(byOwner.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((row) => ({
      initials: initialsFromName(row.name),
      name: row.name,
      total: row.total,
      merged: row.merged,
      open: row.open,
      abandoned: row.abandoned,
      meta: `${row.total} changes • ${row.merged} merged`,
    }));
}

/**
 * Review queue = oldest NEW changes first
 */
function buildReviewQueue(changes) {
  const now = Date.now();

  return changes
    .filter((c) => c.status === "NEW")
    .map((c) => {
      const createdMs = toDateMs(c.created) ?? now;
      return {
        id: c._number ? `#${c._number}` : `#${c.id}`,
        subject: c.subject || "—",
        repo: c.project || "—",
        ageDays: Math.max(
          0,
          Math.floor((now - createdMs) / (1000 * 60 * 60 * 24)),
        ),
      };
    })
    .sort((a, b) => b.ageDays - a.ageDays)
    .slice(0, 6);
}

/**
 * Velocity
 * Exact review timings need richer per-change review/message data,
 * so some fields remain null for now.
 */
function buildVelocity(changes) {
  const merged = changes.filter((c) => c.status === "MERGED");

  let mergesPerDay = null;

  if (merged.length > 0) {
    const createdTimes = merged
      .map((c) => toDateMs(c.created))
      .filter((x) => x != null);
    const updatedTimes = merged
      .map((c) => toDateMs(c.updated))
      .filter((x) => x != null);

    if (createdTimes.length > 0 && updatedTimes.length > 0) {
      const minCreated = Math.min(...createdTimes);
      const maxUpdated = Math.max(...updatedTimes);
      const days = Math.max(
        1,
        Math.ceil((maxUpdated - minCreated) / (1000 * 60 * 60 * 24)),
      );
      mergesPerDay = Number((merged.length / days).toFixed(2));
    }
  }

  return {
    medianReviewDuration: null,
    medianTimeToFirstReview: null,
    mergesPerDay,
  };
}

/**
 * Builds from Gerrit labels / submit requirements
 */
function buildBuilds(changes) {
  let total = 0;
  let success = 0;
  let failures = 0;

  const buildLikeLabelNames = [
    "verified",
    "ci",
    "build",
    "presubmit",
    "cq",
    "commit-queue",
    "kokoro",
    "trybot",
  ];

  const buildLikeRequirementNames = [
    "verified",
    "ci",
    "build",
    "presubmit",
    "cq",
    "commit-queue",
    "kokoro",
    "trybot",
  ];

  for (const c of changes) {
    let countedThisChange = false;
    let isSuccess = false;
    let isFailure = false;

    // Try labels first
    const labels = c.labels || {};
    for (const [labelName, labelInfo] of Object.entries(labels)) {
      const name = labelName.toLowerCase();
      const looksLikeBuild = buildLikeLabelNames.some((x) => name.includes(x));
      if (!looksLikeBuild) continue;

      countedThisChange = true;

      const value =
        typeof labelInfo?.value === "number"
          ? labelInfo.value
          : typeof labelInfo?.approved?.value === "number"
            ? labelInfo.approved.value
            : labelInfo?.approved
              ? 1
              : labelInfo?.rejected
                ? -1
                : null;

      if (value != null) {
        if (value > 0) isSuccess = true;
        if (value < 0) isFailure = true;
      }
    }

    // Then try submit requirements
    const submitRequirements = Array.isArray(c.submit_requirements)
      ? c.submit_requirements
      : [];

    for (const sr of submitRequirements) {
      const name = String(sr?.name || "").toLowerCase();
      const looksLikeBuild = buildLikeRequirementNames.some((x) =>
        name.includes(x),
      );
      if (!looksLikeBuild) continue;

      countedThisChange = true;

      const status = String(sr?.status || "").toUpperCase();
      if (
        status === "SATISFIED" ||
        status === "OVERRIDDEN" ||
        status === "FORCED"
      ) {
        isSuccess = true;
      }
      if (
        status === "UNSATISFIED" ||
        status === "ERROR" ||
        status === "RULE_ERROR"
      ) {
        isFailure = true;
      }
    }

    if (!countedThisChange) continue;

    total += 1;
    if (isSuccess) success += 1;
    else if (isFailure) failures += 1;
  }

  return {
    total,
    success,
    failures,
    avgJobTime: null,
  };
}

/**
 * Health check
 */
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

/**
 * Raw changes endpoint
 */
app.get("/api/changes", async (req, res) => {
  try {
    const topic = (req.query.topic || "").trim();
    if (!topic) return res.status(400).json({ error: "Missing ?topic=" });

    const { changes, searchMode } = await fetchTopicChanges(topic);

    res.json({
      topic,
      searchMode,
      changes,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Full dashboard endpoint
 */
app.get("/api/dashboard", async (req, res) => {
  try {
    const topic = (req.query.topic || "").trim();
    if (!topic) return res.status(400).json({ error: "Missing ?topic=" });

    const { changes, searchMode } = await fetchTopicChanges(topic);

    const metrics = buildMetrics(changes);
    const activity = buildRecentActivity(changes);
    const contributors = buildContributors(changes);
    const reviewQueue = buildReviewQueue(changes);
    const velocity = buildVelocity(changes);
    const builds = buildBuilds(changes);

    const buildDebug = changes.slice(0, 5).map((c) => ({
      id: c._number,
      subject: c.subject,
      labelNames: Object.keys(c.labels || {}),
      submitRequirementNames: Array.isArray(c.submit_requirements)
        ? c.submit_requirements.map((sr) => `${sr.name}:${sr.status}`)
        : [],
    }));

    res.json({
      topic,
      searchMode,
      changes,
      metrics,
      activity,
      contributors,
      reviewQueue,
      velocity,
      builds,
      buildDebug,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Single change detail
 */
app.get("/api/changes/:id", async (req, res) => {
  try {
    const id = encodeURIComponent(req.params.id);
    const data = await gerritGet(
      `/changes/${id}/detail?pp=0&o=DETAILED_ACCOUNTS&o=LABELS&o=DETAILED_LABELS&o=SUBMIT_REQUIREMENTS`,
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});

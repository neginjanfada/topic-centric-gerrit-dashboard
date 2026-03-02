import { useEffect, useMemo, useState } from "react";
import "./App.css";
import ChartsGrid from "./components/ChartsGrid";
import VelocityCard from "./components/VelocityCard";
import ReviewQueue from "./components/ReviewQueue"; // ✅ NEW

function StatCard({ label, value, icon }) {
  return (
    <div className="statCard">
      <div className="statText">
        <div className="statLabel">{label}</div>
        <div className="statValue">{value}</div>
      </div>
      <div className="statIcon">{icon}</div>
    </div>
  );
}

function TopicOverviewCard({ topic, metrics }) {
  return (
    <div className="card">
      <div className="sectionHeader">
        <div>
          <div className="sectionTitle">Topic Overview</div>
          <div className="sectionSubtitle">Summary and repository metrics</div>
        </div>
      </div>

      <div className="topicName">
        <div className="topicNameLabel">TOPIC</div>
        <div className="topicNameValue">{topic || "—"}</div>
      </div>

      <div className="overviewGrid">
        <div className="miniStat">
          <div className="miniLabel">Changes</div>
          <div className="miniValue">{metrics.totalChanges}</div>
        </div>

        <div className="miniStat">
          <div className="miniLabel">Repositories</div>
          <div className="miniValue">{metrics.repositories}</div>
        </div>

        <div className="miniStat">
          <div className="miniLabel">Branches</div>
          <div className="miniValue">{metrics.branches}</div>
        </div>

        <div className="miniStat">
          <div className="miniLabel">Open Changes</div>
          <div className="miniValue">{metrics.openChanges}</div>
        </div>

        <div className="miniStat">
          <div className="miniLabel">Merged</div>
          <div className="miniValue">{metrics.mergedChanges}</div>
        </div>

        <div className="miniStat">
          <div className="miniLabel">Abandoned</div>
          <div className="miniValue">{metrics.abandonedChanges}</div>
        </div>

        <div className="miniStat span2">
          <div className="miniLabel">Merge Rate</div>
          <div className="miniValue">{metrics.mergeRate}%</div>
        </div>
      </div>
    </div>
  );
}

function TopicSummaryCard() {
  return (
    <div className="card">
      <div className="cardHeaderRow">
        <div>
          <div className="sectionTitle">Topic Summary (AI)</div>
          <div className="sectionSubtitle">Auto-generated overview</div>
        </div>
        <button className="primaryBtn">Generate</button>
      </div>

      <div className="summaryBox">
        <div className="summaryCol">
          <div className="summaryLabel">GOAL</div>
          <div className="summaryText">
            Implements authentication v2 with OAuth2, MFA, and improved session
            management.
          </div>
        </div>

        <div className="summaryCol">
          <div className="summaryLabel">KEY CHANGES</div>
          <ul className="summaryList">
            <li>OAuth2 (Google, GitHub)</li>
            <li>Multi-factor auth (TOTP/SMS)</li>
            <li>Redis session service</li>
            <li>Security preferences schema</li>
            <li>v2 API migration</li>
          </ul>
        </div>

        <div className="summaryCol">
          <div className="summaryLabel">BLOCKERS</div>
          <ul className="summaryList">
            <li>#54321: Redis cluster approval pending</li>
            <li>Security audit required</li>
            <li>DBA review needed</li>
          </ul>
        </div>

        <div className="summaryCol">
          <div className="summaryLabel">READ ORDER</div>
          <div className="summaryText">
            #54312 → #54315 → #54318 → API changes
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentActivity({ changes = [] }) {
  const items = useMemo(() => {
    // take latest updated changes as “recent activity”
    const sorted = [...changes].sort((a, b) =>
      String(b.updated || "").localeCompare(String(a.updated || ""))
    );

    return sorted.slice(0, 8).map((c) => {
      const who = c.owner?.name || c.owner?.username || "Someone";
      const id = c._number ? `#${c._number}` : c.id;
      const status = c.status || "UPDATED";

      // simple action label based on status
      const action =
        status === "MERGED"
          ? "merged"
          : status === "ABANDONED"
          ? "abandoned"
          : "updated";

      // show date/time (simple for now)
      const time = c.updated ? c.updated.slice(0, 16).replace("T", " ") : "—";

      return { who, action, id, time };
    });
  }, [changes]);

  return (
    <div className="card">
      <div className="sectionHeader">
        <div>
          <div className="sectionTitle">Recent Activity</div>
          <div className="sectionSubtitle">Latest events and updates</div>
        </div>
      </div>

      <div className="activityScroll">
        {items.length === 0 ? (
          <div className="muted">No activity yet.</div>
        ) : (
          items.map((it, idx) => (
            <div className="activityItem" key={idx}>
              <div className="activityMain">
                <span className="bold">{it.who}</span> {it.action}{" "}
                <span className="link">{it.id}</span>
              </div>
              <div className="muted">{it.time}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TopContributors({ changes = [] }) {
  const contributors = useMemo(() => {
    const map = {};

    changes.forEach((c) => {
      const owner = c.owner?.name || c.owner?.username || "Unknown";
      if (!map[owner]) {
        map[owner] = {
          name: owner,
          total: 0,
          merged: 0,
          open: 0,
        };
      }

      map[owner].total += 1;

      if (c.status === "MERGED") map[owner].merged += 1;
      if (c.status === "NEW") map[owner].open += 1;
    });

    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [changes]);

  return (
    <div className="card">
      <div className="sectionHeader">
        <div>
          <div className="sectionTitle">Top Contributors</div>
          <div className="sectionSubtitle">
            Based on number of changes in this topic
          </div>
        </div>
      </div>

      <div className="contributorsList">
        {contributors.length === 0 ? (
          <div className="muted">No contributors found.</div>
        ) : (
          contributors.map((p, idx) => (
            <div className="contribRow" key={idx}>
              <div className="avatar">
                {p.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="contribInfo">
                <div className="bold">{p.name}</div>
                <div className="muted">
                  {p.total} changes • {p.merged} merged
                </div>
              </div>
              <div className="contribTotal">
                <div className="bold">{p.total}</div>
                <div className="muted">total</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
function ChangesTable({ changes }) {
  const rows = changes.slice(0, 10).map((c) => ({
    key: c.id,
    number: c._number ? `#${c._number}` : c.id,
    subject: c.subject || "—",
    repo: c.project || "—",
    status: c.status || "—",
    revisions: "—",
    ci: "—",
    timeline:
      c.created && c.updated
        ? `${c.created.slice(0, 10)} → ${c.updated.slice(0, 10)}`
        : "—",
  }));

  return (
    <div className="card">
      <div className="cardHeaderRow">
        <div className="sectionTitle">Changes &amp; Timeline</div>
        <div className="muted">{changes.length} changes</div>
      </div>

      <div className="tableWrap">
        <table className="table">
          <thead>
            <tr>
              <th>Change ID</th>
              <th>Subject</th>
              <th>Repository</th>
              <th>Status</th>
              <th>Revisions</th>
              <th>CI</th>
              <th>Timeline</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <td className="link">{r.number}</td>
                <td>{r.subject}</td>
                <td className="mono">{r.repo}</td>
                <td>
                  <span
                    className={`pill ${
                      r.status === "MERGED" ? "pillGreen" : "pillAmber"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="bold">{r.revisions}</td>
                <td>{r.ci}</td>
                <td className="mono">{r.timeline}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function App() {
  const [topicInput, setTopicInput] = useState("test");
  const [topic, setTopic] = useState("test");
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(false);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;

    fetch(`http://localhost:3001/api/dashboard?topic=${encodeURIComponent(topic)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setChanges(data.changes || []);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [topic]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTopic(topicInput.trim() || "test");
  };

  const metrics = useMemo(() => {
    const totalChanges = changes.length;

    const openChanges = changes.filter((c) => c.status === "NEW").length;
    const mergedChanges = changes.filter((c) => c.status === "MERGED").length;
    const abandonedChanges = changes.filter((c) => c.status === "ABANDONED").length;

    const repos = new Set(changes.map((c) => c.project).filter(Boolean));
    const branches = new Set(changes.map((c) => c.branch).filter(Boolean));

    const mergeRate =
      totalChanges === 0 ? 0 : Math.round((mergedChanges / totalChanges) * 100);

    const buildTotal = 0;
    const buildSuccess = 0;
    const buildFailure = 0;
    const avgJobTime = null;

    return {
      totalChanges,
      openChanges,
      mergedChanges,
      abandonedChanges,
      repositories: repos.size,
      branches: branches.size,
      mergeRate,
      buildTotal,
      buildSuccess,
      buildFailure,
      avgJobTime,
    };
  }, [changes]);

  return (
    <div className="page">
      <div className="topbar">
        <h1 className="title">Topic-Centric Gerrit Dashboard</h1>

        <div className="topbarRight">
          <form className="searchBox" onSubmit={handleSearchSubmit}>
            <span className="searchIcon">🔍</span>
            <input
              className="searchInput"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="Enter Gerrit topic name..."
            />
          </form>

          <button
            type="button"
            className="themeBtn"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>
      </div>

      <div className="statsRow">
        <StatCard
          label="Review Velocity"
          value={loading ? "…" : `${metrics.mergedChanges}/${metrics.totalChanges}`}
          icon="📈"
        />
        <StatCard label="Open Changes" value={loading ? "…" : metrics.openChanges} icon="👥" />
        <StatCard label="Merged" value={loading ? "…" : metrics.mergedChanges} icon="⚡" />
        <StatCard label="Merge Rate" value={loading ? "…" : `${metrics.mergeRate}%`} icon="📈" />
      </div>

      <div className="content">
        <div className="leftCol">
          <TopicOverviewCard topic={topic} metrics={metrics} />
          <TopicSummaryCard />
          <ChartsGrid changes={changes} />
          <ChangesTable changes={changes} />
        </div>

        <div className="rightCol">
          <VelocityCard metrics={metrics} />
          <RecentActivity changes={changes} />
          <TopContributors changes={changes} />

          {/* ✅ NEW useful card under Top Contributors */}
          <ReviewQueue changes={changes} />
        </div>
      </div>
    </div>
  );
}
export default function VelocityCard({ metrics }) {
  // Placeholder CI/build metrics for now (until you connect real CI data)
  const build = {
    total: metrics?.buildTotal ?? 0,
    success: metrics?.buildSuccess ?? 0,
    failure: metrics?.buildFailure ?? 0,
  };

  // NEW: Average job time (placeholder)
  // Later you can compute it from build start/end timestamps.
  const avgJobTime = metrics?.avgJobTime ?? "—";

  const items = [
    { label: "Median Review Duration", value: "—" },
    { label: "Median Time to First Review", value: "—" },
    { label: "Merges Per Day", value: "—" },
    { label: "Open Changes", value: metrics?.openChanges ?? 0 },

    // Build / CI section
    { label: "Builds", value: build.total },
    { label: "Build Success", value: build.success },
    { label: "Build Failures", value: build.failure },

    // NEW
    { label: "Avg Job Time", value: avgJobTime },
  ];

  return (
    <div className="card">
      <div className="cardTitle">Velocity</div>

      <div className="listBox">
        <div className="velocity-list">
          {items.map((it) => (
            <div className="velocity-row" key={it.label}>
              <div className="velocity-label">{it.label}</div>
              <div className="velocity-value">{it.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
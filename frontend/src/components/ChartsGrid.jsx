import "./ChartsGrid.css";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

function Card({ title, children }) {
  return (
    <div className="chartCard">
      <div className="chartTitle">{title}</div>
      <div className="chartBody">{children}</div>
    </div>
  );
}

function formatDay(iso) {
  return iso ? iso.slice(0, 10) : "";
}

function buildStatusData(changes) {
  const order = ["NEW", "MERGED", "ABANDONED", "DRAFT"];
  const counts = new Map(order.map((s) => [s, 0]));

  for (const c of changes) {
    const s = c.status || "UNKNOWN";
    counts.set(s, (counts.get(s) || 0) + 1);
  }

  // Keep only statuses that appear (but preserve the order)
  return order
    .map((name) => ({ name, value: counts.get(name) || 0 }))
    .filter((x) => x.value > 0);
}

function buildRepoData(changes) {
  const map = new Map();
  for (const c of changes) {
    const repo = c.project || "Unknown";
    map.set(repo, (map.get(repo) || 0) + 1);
  }
  const arr = Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  arr.sort((a, b) => b.value - a.value);
  return arr.slice(0, 6);
}

function buildTimeSeriesDaily(changes) {
  const byDay = new Map();
  for (const c of changes) {
    const d = formatDay(c.created);
    if (!d) continue;
    byDay.set(d, (byDay.get(d) || 0) + 1);
  }
  return Array.from(byDay.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function NiceTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value;
  return (
    <div className="chartTooltip">
      <div className="chartTooltipLabel">{label}</div>
      <div className="chartTooltipValue">{v}</div>
    </div>
  );
}

export default function ChartsGrid({ changes = [] }) {
  const hasData = changes.length > 0;

  const statusData = buildStatusData(changes);
  const repoData = buildRepoData(changes);
  const timeData = buildTimeSeriesDaily(changes);

  const axisTick = { fill: "var(--muted)", fontSize: 12 };
  const axisLine = { stroke: "var(--border)" };

  return (
    <div className="chartsGrid">
      <Card title="Status Breakdown">
        {!hasData ? (
          <div className="chartEmpty">No data yet. Search a topic to see charts.</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={statusData} margin={{ top: 12, right: 8, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="var(--grid)" strokeDasharray="4 6" vertical={false} />
              <XAxis
                dataKey="name"
                tick={axisTick}
                axisLine={axisLine}
                tickLine={false}
                tickMargin={10}
              />
              <YAxis
                allowDecimals={false}
                tick={axisTick}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip content={<NiceTooltip />} />
              <Bar dataKey="value" fill="var(--chart1)" radius={[12, 12, 12, 12]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card title="Changes Over Time">
        {!hasData ? (
          <div className="chartEmpty">No data yet. Search a topic to see charts.</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={timeData} margin={{ top: 12, right: 10, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="var(--grid)" strokeDasharray="4 6" vertical={false} />
              <XAxis
                dataKey="date"
                tick={axisTick}
                axisLine={axisLine}
                tickLine={false}
                tickMargin={10}
                minTickGap={24}
              />
              <YAxis
                allowDecimals={false}
                tick={axisTick}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip content={<NiceTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--chart1)"
                strokeWidth={3}
                dot={{ r: 3, strokeWidth: 2, stroke: "var(--chart1)", fill: "var(--card)" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card title="Top Repositories">
        {!hasData ? (
          <div className="chartEmpty">No data yet. Search a topic to see charts.</div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={repoData}
              layout="vertical"
              margin={{ top: 10, right: 10, left: 10, bottom: 6 }}
            >
              <CartesianGrid stroke="var(--grid)" strokeDasharray="4 6" horizontal={false} />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={axisTick}
                axisLine={axisLine}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={axisTick}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<NiceTooltip />} />
              <Bar dataKey="value" fill="var(--chart2)" radius={[12, 12, 12, 12]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}
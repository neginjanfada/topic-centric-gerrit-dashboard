import "./ChartsGrid.css";

export default function ChartsGrid() {
  return (
    <section className="chartsGrid">
      <ChartCard
        title="Review Time Trend"
        placeholder="Line chart placeholder"
      />
      <ChartCard
        title="Change Status Distribution"
        placeholder="Donut chart placeholder"
      />
      <ChartCard
        title="Review Activity Over Time"
        placeholder="Area chart placeholder"
      />
      <ChartCard
        title="Changes by Repository"
        placeholder="Bar chart placeholder"
      />
    </section>
  );
}

function ChartCard({ title, placeholder }) {
  return (
    <div className="chartCard">
      <h3 className="chartTitle">{title}</h3>

      <div className="chartBody">
        <div className="chartGridBackground" />
        <span className="chartPlaceholder">{placeholder}</span>
      </div>
    </div>
  );
}
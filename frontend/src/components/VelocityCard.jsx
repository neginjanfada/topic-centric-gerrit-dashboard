import React from "react";

function val(x) {
  if (x === null || x === undefined) return "—";
  if (Number.isNaN(x)) return "—";
  return x;
}

export default function VelocityCard({ metrics }) {
  return (
    <div className="card velocityCard">
      <div className="cardTitle">Velocity</div>

      <div className="velocitySection">
        <div className="velocitySectionHeader">
          <div className="velocitySectionTitle">REVIEW METRICS</div>
        </div>

        <div className="velocity-list">
          <div className="velocity-row">
            <div className="velocity-label">Median Review Duration</div>
            <div className="velocity-value">—</div>
          </div>

          <div className="velocity-row">
            <div className="velocity-label">Median Time to First Review</div>
            <div className="velocity-value">—</div>
          </div>

          <div className="velocity-row">
            <div className="velocity-label">Merges Per Day</div>
            <div className="velocity-value">—</div>
          </div>

          <div className="velocity-row">
            <div className="velocity-label">Open Changes</div>
            <div className="velocity-value">
              {val(metrics?.openChanges)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
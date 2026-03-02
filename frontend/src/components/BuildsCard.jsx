import React from "react";

function val(x) {
  if (x === null || x === undefined) return "—";
  if (Number.isNaN(x)) return "—";
  return x;
}

export default function BuildsCard({ metrics }) {
  return (
    <div className="card">
      <div className="cardHeaderRow">
        <div className="cardTitle">Builds</div>
        <div className="muted">
          Total: {val(metrics?.buildTotal)}
        </div>
      </div>

      <div className="buildGrid">
        <div className="buildBox">
          <div className="buildLabel">Success</div>
          <div className="buildValue">
            {val(metrics?.buildSuccess)}
          </div>
        </div>

        <div className="buildBox">
          <div className="buildLabel">Failures</div>
          <div className="buildValue">
            {val(metrics?.buildFailure)}
          </div>
        </div>

        <div className="buildBox">
          <div className="buildLabel">Avg Job Time</div>
          <div className="buildValue">
            {val(metrics?.avgJobTime)}
          </div>
        </div>
      </div>
    </div>
  );
}
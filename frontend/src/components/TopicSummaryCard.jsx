import "./Card.css";

export default function TopicSummaryCard() {
  return (
    <div className="card">
      <div className="cardHeader">
        <h2>Topic Summary (AI)</h2>
        <button className="primaryBtn">Generate</button>
      </div>

      <div className="summaryGrid">
        <div>
          <h4>Goal</h4>
          <p>
            Implements authentication v2 with OAuth2, MFA, and improved session
            management.
          </p>
        </div>

        <div>
          <h4>Key Changes</h4>
          <ul>
            <li>OAuth2 (Google, GitHub)</li>
            <li>Multi-factor auth (TOTP/SMS)</li>
            <li>Redis session service</li>
            <li>Security preferences schema</li>
            <li>v2 API migration</li>
          </ul>
        </div>

        <div>
          <h4>Blockers</h4>
          <ul>
            <li>#54321 Redis cluster approval pending</li>
            <li>Security audit required</li>
            <li>DBA review needed</li>
          </ul>
        </div>

        <div>
          <h4>Read Order</h4>
          <p>#54312 → #54315 → #54318 → API changes</p>
        </div>
      </div>
    </div>
  );
}
import { Complaint } from '../types';

interface CommunityInsightsProps {
  complaints: Complaint[];
}

export default function CommunityInsights({ complaints }: CommunityInsightsProps) {
  // Category distribution
  const catCounts: Record<string, number> = {};
  complaints.forEach((c) => {
    catCounts[c.category] = (catCounts[c.category] || 0) + 1;
  });

  const catLabels: Record<string, string> = {
    garbage: '🗑️ Garbage',
    pothole: '🕳️ Potholes',
    drainage: '🌊 Drainage',
    streetlight: '💡 Street Lights',
    'water-supply': '💧 Water Supply',
    other: '📌 Other',
  };

  // Top locality
  const localityCounts: Record<string, number> = {};
  complaints.forEach((c) => {
    localityCounts[c.locality] = (localityCounts[c.locality] || 0) + 1;
  });
  const topLocalities = Object.entries(localityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const resolutionRate = complaints.length > 0
    ? Math.round((complaints.filter(c => c.status === 'resolved').length / complaints.length) * 100)
    : 0;

  const totalUpvotes = complaints.reduce((sum, c) => sum + c.upvotes, 0);

  return (
    <div className="insights-section">
      <div className="insights-header">
        <h3>🏘️ Community Insights</h3>
        <span className="ai-demo-badge">AI-Powered Analysis (Demo)</span>
      </div>

      <div className="insights-grid">
        <div className="insight-card">
          <h4>Issue Distribution</h4>
          <div className="bar-chart">
            {Object.entries(catCounts).map(([cat, count]) => (
              <div key={cat} className="bar-row">
                <span className="bar-label">{catLabels[cat] || cat}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${(count / complaints.length) * 100}%` }}
                  />
                </div>
                <span className="bar-count">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="insight-card">
          <h4>Key Metrics</h4>
          <div className="metrics-list">
            <div className="metric-row">
              <span>Resolution Rate</span>
              <span className="metric-value">{resolutionRate}%</span>
            </div>
            <div className="metric-row">
              <span>Community Engagement</span>
              <span className="metric-value">{totalUpvotes} upvotes</span>
            </div>
            <div className="metric-row">
              <span>Avg. Response Time</span>
              <span className="metric-value">~18 hours</span>
            </div>
            <div className="metric-row">
              <span>Active Wards</span>
              <span className="metric-value">{Object.keys(localityCounts).length}</span>
            </div>
          </div>
        </div>

        <div className="insight-card">
          <h4>🔥 Hotspot Areas</h4>
          <div className="hotspot-list">
            {topLocalities.map(([locality, count], i) => (
              <div key={locality} className="hotspot-row">
                <span className="hotspot-rank">#{i + 1}</span>
                <span className="hotspot-name">{locality}</span>
                <span className="hotspot-count">{count} issues</span>
              </div>
            ))}
          </div>

          <div className="ai-insight-box">
            <span className="ai-icon">🤖</span>
            <p>AI Recommendation: Allocate additional sanitation and road maintenance resources to Ward 15 and Ward 7 based on complaint density and severity patterns.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

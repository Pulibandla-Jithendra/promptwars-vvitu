import { useState, useMemo } from 'react';
import { Complaint, ComplaintCategory, DashboardStats } from './types';
import { sampleComplaints } from './data/sampleComplaints';
import StatsCards from './components/StatsCards';
import CategoryFilter from './components/CategoryFilter';
import ComplaintCard from './components/ComplaintCard';
import ComplaintDetail from './components/ComplaintDetail';
import ComplaintForm from './components/ComplaintForm';
import CommunityInsights from './components/CommunityInsights';
import './App.css';

function App() {
  const [complaints, setComplaints] = useState<Complaint[]>(sampleComplaints);
  const [selectedCategory, setSelectedCategory] = useState<ComplaintCategory | 'all'>('all');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  const [showInsights, setShowInsights] = useState(false);

  const filteredComplaints = useMemo(() => {
    if (selectedCategory === 'all') return complaints;
    return complaints.filter((c) => c.category === selectedCategory);
  }, [complaints, selectedCategory]);

  const stats: DashboardStats = useMemo(() => ({
    total: complaints.length,
    resolved: complaints.filter((c) => c.status === 'resolved').length,
    inProgress: complaints.filter((c) => c.status === 'in-progress').length,
    critical: complaints.filter((c) => c.priority === 'critical').length,
  }), [complaints]);

  const handleNewComplaint = (complaint: Complaint) => {
    setComplaints((prev) => [complaint, ...prev]);
    setShowForm(false);
    setShowSuccess(complaint.id);
    setTimeout(() => setShowSuccess(null), 5000);
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-icon">🏛️</div>
            <div>
              <h1 className="app-title">NammaWard AI</h1>
              <p className="app-subtitle">AI-Powered Civic Issue Tracker</p>
            </div>
          </div>
          <div className="header-right">
            <button
              className="insights-btn"
              onClick={() => setShowInsights(!showInsights)}
            >
              📊 {showInsights ? 'Hide' : 'Show'} Insights
            </button>
            <button className="report-btn" onClick={() => setShowForm(true)}>
              ➕ Report Issue
            </button>
          </div>
        </div>
      </header>

      {/* Disclaimer banner */}
      <div className="disclaimer-banner">
        ⚠️ <strong>Prototype Demo</strong> — This is a hackathon project showcasing AI-powered civic governance.
        Not connected to any municipal authority. All data is fictional.
      </div>

      {/* Success toast */}
      {showSuccess && (
        <div className="success-toast">
          ✅ Complaint <strong>{showSuccess}</strong> submitted successfully! AI analysis complete.
        </div>
      )}

      <main className="main-content">
        {/* Stats */}
        <StatsCards stats={stats} />

        {/* Community Insights (collapsible) */}
        {showInsights && <CommunityInsights complaints={complaints} />}

        {/* Filter + List */}
        <section className="complaints-section">
          <div className="section-header">
            <h2>📋 Recent Complaints</h2>
            <span className="complaint-count">{filteredComplaints.length} issues</span>
          </div>

          <CategoryFilter selected={selectedCategory} onChange={setSelectedCategory} />

          <div className="complaints-grid">
            {filteredComplaints.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🔍</span>
                <p>No complaints found in this category</p>
              </div>
            ) : (
              filteredComplaints.map((complaint) => (
                <ComplaintCard
                  key={complaint.id}
                  complaint={complaint}
                  onClick={setSelectedComplaint}
                />
              ))
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <p>
            <strong>NammaWard AI</strong> — Built with ❤️ for PromptWars x Creative Community, VVITU
          </p>
          <p className="footer-note">
            🤖 AI-powered civic governance prototype | Made by{' '}
            <a href="https://github.com/Pulibandla-Jithendra" target="_blank" rel="noopener noreferrer">
              Jithendra Pulibandla
            </a>
          </p>
          <p className="footer-disclaimer">
            This is a demonstration prototype. No real municipal data is used or collected.
          </p>
        </div>
      </footer>

      {/* Modals */}
      {selectedComplaint && (
        <ComplaintDetail
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
        />
      )}

      {showForm && (
        <ComplaintForm
          onSubmit={handleNewComplaint}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

export default App;

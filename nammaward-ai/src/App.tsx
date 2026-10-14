import { useState, useMemo } from 'react';
import { Complaint, ComplaintCategory, DashboardStats } from './types';
import { useAuth } from './context/AuthContext';
import { useComplaints } from './context/ComplaintContext';
import StatsCards from './components/StatsCards';
import CategoryFilter from './components/CategoryFilter';
import ComplaintCard from './components/ComplaintCard';
import ComplaintDetail from './components/ComplaintDetail';
import ComplaintForm from './components/ComplaintForm';
import CommunityInsights from './components/CommunityInsights';
import LoginPage from './components/LoginPage';
import StaffDashboard from './components/StaffDashboard';
import './App.css';

function CitizenDashboard() {
  const { user, logout } = useAuth();
  const { complaints, addComplaint } = useComplaints();
  const [selectedCategory, setSelectedCategory] = useState<ComplaintCategory | 'all'>('all');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [showMyComplaints, setShowMyComplaints] = useState(false);

  const displayedComplaints = useMemo(() => {
    let list = complaints;
    if (showMyComplaints && user) {
      list = list.filter(c => c.submittedBy === user.id);
    }
    if (selectedCategory !== 'all') {
      list = list.filter(c => c.category === selectedCategory);
    }
    return list;
  }, [complaints, selectedCategory, showMyComplaints, user]);

  const stats: DashboardStats = useMemo(() => ({
    total: complaints.length,
    resolved: complaints.filter((c) => c.status === 'resolved').length,
    inProgress: complaints.filter((c) => c.status === 'in-progress').length,
    critical: complaints.filter((c) => c.priority === 'critical').length,
    awaitingConfirmation: complaints.filter((c) => c.status === 'awaiting-confirmation').length,
    disputed: complaints.filter((c) => c.status === 'disputed').length,
  }), [complaints]);

  const handleNewComplaint = (complaint: Complaint) => {
    addComplaint(complaint);
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
              <p className="app-subtitle">👋 Hi, {user?.name}</p>
            </div>
          </div>
          <div className="header-right">
            <button className="insights-btn" onClick={() => setShowInsights(!showInsights)}>
              📊 Insights
            </button>
            <button className="report-btn" onClick={() => setShowForm(true)}>
              ➕ Report
            </button>
            <button className="logout-btn" onClick={logout} aria-label="Sign out">🚪</button>
          </div>
        </div>
      </header>

      {/* Disclaimer banner */}
      <div className="disclaimer-banner">
        ⚠️ <strong>Prototype Demo</strong> — Hackathon project. Not connected to any municipal authority. All data is fictional.
      </div>

      {/* Success toast */}
      {showSuccess && (
        <div className="success-toast" role="status" aria-live="polite">
          ✅ Complaint <strong>{showSuccess}</strong> submitted successfully. Rule-based demo triage added.
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
            <h2>📋 {showMyComplaints ? 'My Complaints' : 'Recent Complaints'}</h2>
            <div className="section-actions">
              <button
                className={`toggle-btn ${showMyComplaints ? 'active' : ''}`}
                onClick={() => setShowMyComplaints(!showMyComplaints)}
              >
                {showMyComplaints ? '🌐 All' : '👤 Mine'}
              </button>
              <span className="complaint-count">{displayedComplaints.length} issues</span>
            </div>
          </div>

          <CategoryFilter selected={selectedCategory} onChange={setSelectedCategory} />

          <div className="complaints-grid">
            {displayedComplaints.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🔍</span>
                <p>{showMyComplaints ? "You haven't submitted any complaints yet" : 'No complaints found in this category'}</p>
                {showMyComplaints && (
                  <button className="report-btn" onClick={() => setShowForm(true)} style={{ marginTop: '1rem' }}>
                    ➕ Report Your First Issue
                  </button>
                )}
              </div>
            ) : (
              displayedComplaints.map((complaint) => (
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

function App() {
  const { isAuthenticated, isRole } = useAuth();

  if (!isAuthenticated) return <LoginPage />;
  if (isRole('staff')) return <StaffDashboard />;
  return <CitizenDashboard />;
}

export default App;

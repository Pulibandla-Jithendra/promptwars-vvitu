import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useComplaints } from '../context/ComplaintContext';
import { Complaint, ComplaintCategory, ComplaintStatus, DashboardStats, StaffProgressStatus } from '../types';
import { StatusBadge, PriorityBadge } from './StatusBadge';
import CameraCapture from './CameraCapture';

const statusOptions: { value: StaffProgressStatus; label: string }[] = [
  { value: 'submitted', label: '📥 Submitted' },
  { value: 'under-review', label: '🔍 Under Review' },
  { value: 'in-progress', label: '🔄 In Progress' },
  { value: 'escalated', label: '🚨 Escalated' },
];

const filterStatusOptions: { value: ComplaintStatus; label: string }[] = [
  ...statusOptions,
  { value: 'awaiting-confirmation', label: '👀 Awaiting Citizen Review' },
  { value: 'disputed', label: '↩️ Citizen Disputed' },
  { value: 'resolved', label: '✅ Citizen Confirmed' },
];

export default function StaffDashboard() {
  const { user, logout } = useAuth();
  const { complaints, updateStatus, proposeResolution, toggleUrgent } = useComplaints();
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const selectedComplaint = complaints.find(c => c.id === selectedComplaintId) || null;
  const [filterStatus, setFilterStatus] = useState<ComplaintStatus | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<ComplaintCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [newStatus, setNewStatus] = useState<StaffProgressStatus>('under-review');
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolutionPhoto, setResolutionPhoto] = useState<string | undefined>();

  const stats: DashboardStats = useMemo(() => ({
    total: complaints.length,
    submitted: complaints.filter(c => c.status === 'submitted').length,
    underReview: complaints.filter(c => c.status === 'under-review' || c.status === 'disputed').length,
    inProgress: complaints.filter(c => c.status === 'in-progress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    critical: complaints.filter(c => c.priority === 'critical' || c.flaggedUrgent).length,
  }), [complaints]);

  const filtered = useMemo(() => {
    return complaints.filter(c => {
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;
      if (filterCategory !== 'all' && c.category !== filterCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return c.id.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) || c.locality.toLowerCase().includes(q);
      }
      return true;
    });
  }, [complaints, filterStatus, filterCategory, searchQuery]);

  const handleStatusUpdate = () => {
    if (!selectedComplaint) return;
    updateStatus(selectedComplaint.id, newStatus, {
      note: reviewNote || `Status changed to ${newStatus}`,
      by: user?.name || 'Staff',
      at: new Date().toISOString(),
      statusChange: newStatus,
    });
    setReviewNote('');
  };

  const handleProposeResolution = () => {
    if (!selectedComplaint || !resolutionNote.trim()) return;
    proposeResolution(selectedComplaint.id, resolutionNote, resolutionPhoto, user?.name || 'Staff');
    setResolutionNote('');
    setResolutionPhoto(undefined);
  };

  return (
    <div className="app">
      <header className="app-header staff-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo-icon">🏛️</div>
            <div>
              <h1 className="app-title">NammaWard AI</h1>
              <p className="app-subtitle">🏢 Municipal Staff Dashboard</p>
            </div>
          </div>
          <div className="header-right">
            <span className="staff-name">👤 {user?.name}</span>
            <button className="logout-btn" onClick={logout}>🚪 Logout</button>
          </div>
        </div>
      </header>

      <div className="disclaimer-banner">
        ⚠️ <strong>Prototype Demo</strong> — Staff actions are simulated. Real deployment requires server-side authorization and audit logging.
      </div>

      <main className="main-content">
        {/* Staff Stats */}
        <div className="stats-grid staff-stats">
          <div className="stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
            <div className="stat-icon" style={{ background: '#eff6ff' }}>📋</div>
            <div className="stat-info"><span className="stat-value">{stats.total}</span><span className="stat-label">Total</span></div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
            <div className="stat-icon" style={{ background: '#f5f3ff' }}>📥</div>
            <div className="stat-info"><span className="stat-value">{stats.submitted}</span><span className="stat-label">New</span></div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
            <div className="stat-icon" style={{ background: '#fffbeb' }}>🔍</div>
                  <div className="stat-info"><span className="stat-value">{stats.underReview}</span><span className="stat-label">Reviewing / disputed</span></div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
            <div className="stat-icon" style={{ background: '#eff6ff' }}>🔄</div>
            <div className="stat-info"><span className="stat-value">{stats.inProgress}</span><span className="stat-label">In Progress</span></div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid #22c55e' }}>
            <div className="stat-icon" style={{ background: '#f0fdf4' }}>✅</div>
            <div className="stat-info"><span className="stat-value">{stats.resolved}</span><span className="stat-label">Resolved</span></div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid #0ea5e9' }}>
            <div className="stat-icon" style={{ background: '#f0f9ff' }}>👀</div>
            <div className="stat-info"><span className="stat-value">{complaints.filter(c => c.status === 'awaiting-confirmation').length}</span><span className="stat-label">Awaiting citizen</span></div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
            <div className="stat-icon" style={{ background: '#fef2f2' }}>🚨</div>
            <div className="stat-info"><span className="stat-value">{stats.critical}</span><span className="stat-label">Critical</span></div>
          </div>
        </div>

        {/* Filters */}
        <div className="staff-filters">
          <input
            type="text"
            placeholder="🔍 Search by ID, title or locality..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="staff-search"
          />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="staff-select">
            <option value="all">All Statuses</option>
            {filterStatusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as any)} className="staff-select">
            <option value="all">All Categories</option>
            <option value="garbage">🗑️ Garbage</option>
            <option value="pothole">🕳️ Potholes</option>
            <option value="drainage">🌊 Drainage</option>
            <option value="streetlight">💡 Street Lights</option>
            <option value="water-supply">💧 Water Supply</option>
            <option value="other">📌 Other</option>
          </select>
        </div>

        {/* Complaint Queue */}
        <div className="staff-queue">
          <h2>📋 Complaint Queue ({filtered.length})</h2>
          <div className="staff-table-wrapper">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Locality</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>📷</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className={c.flaggedUrgent ? 'urgent-row' : ''}>
                    <td className="complaint-id">{c.id}</td>
                    <td className="td-title">{c.title.substring(0, 40)}{c.title.length > 40 ? '...' : ''}</td>
                    <td>{c.category}</td>
                    <td>{c.locality.substring(0, 20)}{c.locality.length > 20 ? '...' : ''}</td>
                    <td><PriorityBadge priority={c.priority} /></td>
                    <td><StatusBadge status={c.status} /></td>
                    <td>{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>{c.photoDataUrl || c.staffNotes?.some(note => note.photoDataUrl) ? '📷' : '—'}</td>
                    <td>
                      <button className="view-btn" onClick={() => {
                        setSelectedComplaintId(c.id);
                        setNewStatus(c.status === 'disputed' || c.status === 'awaiting-confirmation' || c.status === 'resolved' ? 'under-review' : c.status);
                        setReviewNote('');
                        setResolutionNote('');
                        setResolutionPhoto(undefined);
                      }}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="empty-state"><span className="empty-icon">📭</span><p>No complaints match your filters</p></div>}
        </div>
      </main>

      {/* Staff Detail Modal */}
      {selectedComplaint && (
        <div className="modal-overlay" onClick={() => setSelectedComplaintId(null)}>
          <div className="modal-content staff-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedComplaintId(null)}>✕</button>

            <div className="modal-header">
              <span className="complaint-id">{selectedComplaint.id}</span>
              <div className="modal-badges">
                <StatusBadge status={selectedComplaint.status} />
                <PriorityBadge priority={selectedComplaint.priority} />
                {selectedComplaint.flaggedUrgent && <span className="badge badge-escalated">🚩 URGENT</span>}
              </div>
            </div>

            <h2 className="modal-title">{selectedComplaint.title}</h2>
            <p className="modal-locality">📍 {selectedComplaint.locality}</p>
            <p className="modal-time">🕐 {new Date(selectedComplaint.createdAt).toLocaleString('en-IN')}</p>

            <div className="modal-section">
              <h4>Description</h4>
              <p>{selectedComplaint.description}</p>
            </div>

            {selectedComplaint.aiSummary && (
              <div className="ai-analysis-panel">
                <div className="ai-panel-header">
                  <span className="ai-icon">🤖</span><h4>AI Analysis</h4>
                  <span className="ai-demo-badge">Rule-based demo</span>
                </div>
                <p className="ai-value">{selectedComplaint.aiSummary}</p>
                {selectedComplaint.aiSuggestion && <p className="ai-suggestion">{selectedComplaint.aiSuggestion}</p>}
              </div>
            )}

            <div className="modal-section">
              <h4>📝 Complaint History & Evidence</h4>
              <div className="notes-history">
                <div className="note-item">
                  <div className="note-meta"><strong>Original report · {selectedComplaint.submittedBy}</strong><span>{new Date(selectedComplaint.createdAt).toLocaleString('en-IN')}</span><StatusBadge status="submitted" /></div>
                  <p>{selectedComplaint.description}</p>
                  {selectedComplaint.photoDataUrl && <img src={selectedComplaint.photoDataUrl} alt="Original citizen evidence" className="staff-evidence-img" />}
                </div>
                {selectedComplaint.staffNotes?.map((n, i) => (
                  <div key={i} className="note-item">
                    <div className="note-meta">
                      <strong>{n.by}</strong>
                      <span>{new Date(n.at).toLocaleString('en-IN')}</span>
                      {n.statusChange && <StatusBadge status={n.statusChange} />}
                    </div>
                    <p>{n.note}</p>
                    {n.photoDataUrl && <img src={n.photoDataUrl} alt="Resolution after-photo evidence" className="staff-evidence-img" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Staff Actions */}
            {selectedComplaint.status !== 'awaiting-confirmation' && selectedComplaint.status !== 'resolved' && (
              <div className="staff-actions">
                <h4>⚡ Staff Actions</h4>
                <div className="action-row">
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as StaffProgressStatus)} className="staff-select">
                    {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <button
                    className={`urgent-btn ${selectedComplaint.flaggedUrgent ? 'flagged' : ''}`}
                    onClick={() => toggleUrgent(selectedComplaint.id)}
                  >
                    🚩 {selectedComplaint.flaggedUrgent ? 'Unflag' : 'Flag Urgent'}
                  </button>
                </div>
                <textarea
                  placeholder="Add a review note (optional)..."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  rows={2}
                  className="review-note-input"
                />
                <button className="submit-btn" onClick={handleStatusUpdate}>
                  ✅ Update Status
                </button>
              </div>
            )}

            {['under-review', 'in-progress', 'disputed'].includes(selectedComplaint.status) && (
              <div className="staff-actions resolution-proposal">
                <h4>📸 Propose Resolution for Citizen Review</h4>
                <p>Describe the work completed. The complaint will remain open until its citizen confirms or disputes the proposed resolution.</p>
                <textarea
                  placeholder="Resolution note (required): what was inspected or repaired?"
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  rows={3}
                  className="review-note-input"
                />
                <CameraCapture label="📸 After-photo evidence (optional)" onCapture={setResolutionPhoto} onRemove={() => setResolutionPhoto(undefined)} currentPhoto={resolutionPhoto} />
                <button className="submit-btn" onClick={handleProposeResolution} disabled={!resolutionNote.trim()}>
                  👀 Send to Citizen for Review
                </button>
              </div>
            )}
            {selectedComplaint.status === 'awaiting-confirmation' && (
              <div className="resolution-status-note">Waiting for the reporting citizen to confirm or dispute this resolution.</div>
            )}
            {selectedComplaint.status === 'resolved' && (
              <div className="resolution-status-note">The reporting citizen confirmed that the issue appears fixed.</div>
            )}
          </div>
        </div>
      )}

      <footer className="app-footer">
        <div className="footer-content">
          <p><strong>NammaWard AI</strong> — Staff Dashboard | PromptWars x Creative Community, VVITU</p>
          <p className="footer-disclaimer">Prototype demo. All actions are simulated. Real deployment requires server-side authorization.</p>
        </div>
      </footer>
    </div>
  );
}

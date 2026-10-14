import { Complaint } from '../types';
import { StatusBadge, PriorityBadge } from './StatusBadge';

interface ComplaintDetailProps {
  complaint: Complaint;
  onClose: () => void;
}

export default function ComplaintDetail({ complaint, onClose }: ComplaintDetailProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        
        <div className="modal-header">
          <span className="complaint-id">{complaint.id}</span>
          <div className="modal-badges">
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
          </div>
        </div>

        <h2 className="modal-title">{complaint.title}</h2>
        <p className="modal-locality">📍 {complaint.locality}</p>
        <p className="modal-time">🕐 Reported: {new Date(complaint.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        
        <div className="modal-section">
          <h4>Description</h4>
          <p>{complaint.description}</p>
        </div>

        {complaint.aiSummary && (
          <div className="ai-analysis-panel">
            <div className="ai-panel-header">
              <span className="ai-icon">🤖</span>
              <h4>AI Analysis</h4>
              <span className="ai-demo-badge">Demo Mode</span>
            </div>
            
            <div className="ai-grid">
              <div className="ai-item">
                <span className="ai-label">Category</span>
                <span className="ai-value">{complaint.aiCategory}</span>
              </div>
              <div className="ai-item">
                <span className="ai-label">Priority Assessment</span>
                <span className="ai-value"><PriorityBadge priority={complaint.aiPriority || complaint.priority} /></span>
              </div>
            </div>

            <div className="ai-item">
              <span className="ai-label">Summary</span>
              <p className="ai-value">{complaint.aiSummary}</p>
            </div>

            <div className="ai-item">
              <span className="ai-label">Recommended Action</span>
              <p className="ai-value ai-suggestion">{complaint.aiSuggestion}</p>
            </div>
          </div>
        )}

        <div className="modal-actions">
          <span className="complaint-upvotes-large">👍 {complaint.upvotes} residents affected</span>
        </div>
      </div>
    </div>
  );
}

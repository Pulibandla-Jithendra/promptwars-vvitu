import { useState } from 'react';
import { Complaint, ComplaintHistoryKind } from '../types';
import { useAuth } from '../context/AuthContext';
import { useComplaints } from '../context/ComplaintContext';
import { StatusBadge, PriorityBadge } from './StatusBadge';
import { useDialogAccessibility } from '../hooks/useDialogAccessibility';

interface ComplaintDetailProps {
  complaint: Complaint;
  onClose: () => void;
}

const historyLabels: Record<ComplaintHistoryKind, string> = {
  'staff-update': 'Staff update',
  'resolution-proposal': 'Resolution proposed',
  'citizen-confirmation': 'Citizen confirmed',
  'citizen-dispute': 'Citizen disputed',
};

export default function ComplaintDetail({ complaint, onClose }: ComplaintDetailProps) {
  const { user } = useAuth();
  const dialogRef = useDialogAccessibility<HTMLDivElement>(true, onClose);
  const { complaints, reviewResolution } = useComplaints();
  const current = complaints.find(c => c.id === complaint.id) || complaint;
  const [reviewNote, setReviewNote] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const canReview = user?.role === 'citizen'
    && current.submittedBy === user.id
    && current.status === 'awaiting-confirmation';

  const submitReview = (confirmed: boolean) => {
    if (!user) return;
    if (!confirmed && !reviewNote.trim()) {
      setReviewMessage('Please describe why the issue still exists so staff can investigate.');
      return;
    }
    reviewResolution(current.id, confirmed, reviewNote, user.name);
    setReviewMessage(confirmed
      ? 'Your confirmation has been added to the complaint history.'
      : 'Your dispute has been sent back to the staff review queue.');
    setReviewNote('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div ref={dialogRef} className="modal-content" role="dialog" aria-modal="true" aria-label="Complaint details" tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" aria-label="Close complaint details" onClick={onClose}>✕</button>

        <div className="modal-header">
          <span className="complaint-id">{current.id}</span>
          <div className="modal-badges">
            <StatusBadge status={current.status} />
            <PriorityBadge priority={current.priority} />
          </div>
        </div>

        <h2 className="modal-title">{current.title}</h2>
        <p className="modal-locality">📍 {current.locality}</p>
        <p className="modal-time">🕐 Reported: {new Date(current.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>

        <div className="modal-section">
          <h4>Original report</h4>
          <p>{current.description}</p>
          {current.photoDataUrl && <img src={current.photoDataUrl} alt="Citizen's original complaint evidence" className="staff-evidence-img" />}
        </div>

        {current.aiSummary && (
          <div className="ai-analysis-panel">
            <div className="ai-panel-header">
              <span className="ai-icon">🤖</span>
              <h4>AI Analysis</h4>
              <span className="ai-demo-badge">Rule-based demo</span>
            </div>
            <div className="ai-grid">
              <div className="ai-item">
                <span className="ai-label">Category</span>
                <span className="ai-value">{current.aiCategory}</span>
              </div>
              <div className="ai-item">
                <span className="ai-label">Priority estimate</span>
                <span className="ai-value"><PriorityBadge priority={current.aiPriority || current.priority} /></span>
              </div>
            </div>
            <div className="ai-item">
              <span className="ai-label">Summary</span>
              <p className="ai-value">{current.aiSummary}</p>
            </div>
            <div className="ai-item">
              <span className="ai-label">Suggested action</span>
              <p className="ai-value ai-suggestion">{current.aiSuggestion}</p>
            </div>
          </div>
        )}

        <div className="modal-section">
          <h4>📝 Complaint history</h4>
          <div className="notes-history">
            <div className="note-item">
              <div className="note-meta">
                <strong>Complaint submitted · {current.submittedBy}</strong>
                <span>{new Date(current.createdAt).toLocaleString('en-IN')}</span>
                <StatusBadge status="submitted" />
              </div>
              <p>Original description and any attached photo are preserved above.</p>
            </div>
            {current.staffNotes?.map((event, index) => (
              <div key={`${event.at}-${index}`} className="note-item">
                <div className="note-meta">
                  <strong>{historyLabels[event.kind || 'staff-update']} · {event.by}</strong>
                  <span>{new Date(event.at).toLocaleString('en-IN')}</span>
                  {event.statusChange && <StatusBadge status={event.statusChange} />}
                </div>
                <p>{event.note}</p>
                {event.photoDataUrl && <img src={event.photoDataUrl} alt="Photo attached to this complaint history event" className="staff-evidence-img" />}
              </div>
            ))}
          </div>
        </div>

        {canReview && (
          <div className="staff-actions citizen-review-actions">
            <h4>👀 Does the reported problem appear fixed?</h4>
            <p>Review the staff note and optional after-photo. Your response will be added to this complaint's history.</p>
            <textarea
              aria-label="Review note"
              placeholder="If the issue still exists, describe what remains (required to dispute)."
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={3}
              className="review-note-input"
            />
            {reviewMessage && <p className="review-message" role="status">{reviewMessage}</p>}
            <div className="review-response-actions">
              <button className="submit-btn" onClick={() => submitReview(true)}>✅ Confirm it appears fixed</button>
              <button className="urgent-btn" onClick={() => submitReview(false)}>↩️ It still exists</button>
            </div>
          </div>
        )}
        {!canReview && reviewMessage && <p className="review-message" role="status">{reviewMessage}</p>}

        <div className="modal-actions">
          <span className="complaint-upvotes-large">👍 {current.upvotes} reports of affected residents (demo value)</span>
        </div>
      </div>
    </div>
  );
}

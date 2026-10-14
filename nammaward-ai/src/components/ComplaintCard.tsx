import { Complaint } from '../types';
import { StatusBadge, PriorityBadge } from './StatusBadge';

const categoryIcons: Record<string, string> = {
  garbage: '🗑️',
  pothole: '🕳️',
  drainage: '🌊',
  streetlight: '💡',
  'water-supply': '💧',
  other: '📌',
};

interface ComplaintCardProps {
  complaint: Complaint;
  onClick: (complaint: Complaint) => void;
}

export default function ComplaintCard({ complaint, onClick }: ComplaintCardProps) {
  const timeAgo = getTimeAgo(complaint.createdAt);

  return (
    <div className="complaint-card" onClick={() => onClick(complaint)}>
      <div className="complaint-header">
        <span className="complaint-id">{complaint.id}</span>
        <StatusBadge status={complaint.status} />
      </div>
      <div className="complaint-body">
        <div className="complaint-category-icon">{categoryIcons[complaint.category] || '📌'}</div>
        <div className="complaint-content">
          <h3 className="complaint-title">{complaint.title}</h3>
          <p className="complaint-desc">{complaint.description.substring(0, 120)}...</p>
          <div className="complaint-meta">
            <span className="complaint-locality">📍 {complaint.locality}</span>
            <span className="complaint-time">🕐 {timeAgo}</span>
          </div>
        </div>
      </div>
      <div className="complaint-footer">
        <PriorityBadge priority={complaint.priority} />
        <span className="complaint-upvotes">🧪 Demo count: {complaint.upvotes}</span>
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  return 'Just now';
}

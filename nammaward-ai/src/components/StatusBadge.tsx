import { ComplaintStatus, Priority } from '../types';

const statusConfig: Record<ComplaintStatus, { label: string; className: string }> = {
  'submitted': { label: 'Submitted', className: 'badge-submitted' },
  'in-progress': { label: 'In Progress', className: 'badge-progress' },
  'resolved': { label: 'Resolved', className: 'badge-resolved' },
  'escalated': { label: 'Escalated', className: 'badge-escalated' },
};

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  'low': { label: 'Low', className: 'priority-low' },
  'medium': { label: 'Medium', className: 'priority-medium' },
  'high': { label: 'High', className: 'priority-high' },
  'critical': { label: 'Critical', className: 'priority-critical' },
};

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  const config = statusConfig[status];
  return <span className={`badge ${config.className}`}>{config.label}</span>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config = priorityConfig[priority];
  return <span className={`badge ${config.className}`}>{config.label}</span>;
}

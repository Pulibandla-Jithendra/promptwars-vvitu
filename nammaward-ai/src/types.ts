export type ComplaintStatus = 'submitted' | 'in-progress' | 'resolved' | 'escalated';
export type ComplaintCategory = 'garbage' | 'pothole' | 'drainage' | 'streetlight' | 'water-supply' | 'other';
export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  locality: string;
  status: ComplaintStatus;
  priority: Priority;
  createdAt: string;
  upvotes: number;
  aiSummary?: string;
  aiCategory?: string;
  aiPriority?: Priority;
  aiSuggestion?: string;
}

export interface DashboardStats {
  total: number;
  resolved: number;
  inProgress: number;
  critical: number;
}

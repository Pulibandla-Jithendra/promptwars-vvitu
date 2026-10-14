export type ComplaintStatus = 'submitted' | 'under-review' | 'in-progress' | 'resolved' | 'escalated';
export type ComplaintCategory = 'garbage' | 'pothole' | 'drainage' | 'streetlight' | 'water-supply' | 'other';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type UserRole = 'citizen' | 'staff';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  ward?: string;
}

export interface StaffNote {
  note: string;
  by: string;
  at: string;
  statusChange?: ComplaintStatus;
}

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
  submittedBy: string;
  photoUrl?: string;
  photoDataUrl?: string;
  aiSummary?: string;
  aiCategory?: string;
  aiPriority?: Priority;
  aiSuggestion?: string;
  staffNotes?: StaffNote[];
  flaggedUrgent?: boolean;
}

export interface DashboardStats {
  total: number;
  resolved: number;
  inProgress: number;
  critical: number;
  submitted?: number;
  underReview?: number;
}

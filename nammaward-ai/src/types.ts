export type ComplaintStatus = 'submitted' | 'under-review' | 'in-progress' | 'awaiting-confirmation' | 'disputed' | 'resolved' | 'escalated';
export type StaffProgressStatus = 'submitted' | 'under-review' | 'in-progress' | 'escalated';
export type ComplaintCategory = 'garbage' | 'pothole' | 'drainage' | 'streetlight' | 'water-supply' | 'other';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type UserRole = 'citizen' | 'staff';
export type ComplaintHistoryKind = 'staff-update' | 'resolution-proposal' | 'citizen-confirmation' | 'citizen-dispute';

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
  kind?: ComplaintHistoryKind;
  photoDataUrl?: string;
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
  awaitingConfirmation?: number;
  disputed?: number;
}

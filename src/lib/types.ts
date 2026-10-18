export type UserRole = 'citizen' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  phone?: string;
  role: UserRole;
  email: string;
  created_at: string;
  updated_at?: string;
}

export type ReportCategory =
  | 'pothole'
  | 'trash'
  | 'water_leak'
  | 'other';

export type ReportStatus =
  | 'submitted'
  | 'under_review'
  | 'in_progress'
  | 'resolved'
  | 'rejected';

export type ReportPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface CivicReport {
  id: string;
  reference_id: string;
  user_id: string | null;
  title: string;
  description: string;
  category: ReportCategory;
  status: ReportStatus;
  priority: ReportPriority;
  latitude: number;
  longitude: number;
  address: string;
  neighborhood: string;
  image_url?: string;
  assigned_department?: string;
  admin_notes?: string;
  upvotes: number;
  created_at: string;
  updated_at: string;
  submitter_name?: string;
}

export interface StatusTimelineEvent {
  status: ReportStatus;
  timestamp: string;
  note: string;
  author: string;
}

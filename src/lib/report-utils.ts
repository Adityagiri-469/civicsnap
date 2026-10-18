import type { CivicReport, ReportCategory, ReportStatus } from './types';

export function formatReferenceId(number: number, year = 2026): string {
  const padded = String(number).padStart(5, '0');
  return `CS-${year}-${padded}`;
}

export function getStatusBadgeInfo(status: ReportStatus): {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  description: string;
} {
  switch (status) {
    case 'submitted':
      return {
        label: 'Submitted',
        bgClass: 'bg-amber-50',
        textClass: 'text-amber-800',
        borderClass: 'border-amber-200',
        description: 'Received by municipal intake queue'
      };
    case 'under_review':
      return {
        label: 'Under Review',
        bgClass: 'bg-blue-50',
        textClass: 'text-blue-800',
        borderClass: 'border-blue-200',
        description: 'Assigned to inspector for verification'
      };
    case 'in_progress':
      return {
        label: 'In Progress',
        bgClass: 'bg-purple-50',
        textClass: 'text-purple-800',
        borderClass: 'border-purple-200',
        description: 'Work crew or department dispatched'
      };
    case 'resolved':
      return {
        label: 'Resolved',
        bgClass: 'bg-emerald-50',
        textClass: 'text-emerald-800',
        borderClass: 'border-emerald-200',
        description: 'Issue inspected and fixed'
      };
    case 'rejected':
      return {
        label: 'Closed / Out of Scope',
        bgClass: 'bg-slate-100',
        textClass: 'text-slate-700',
        borderClass: 'border-slate-300',
        description: 'Private property or duplicate entry'
      };
    default:
      return {
        label: 'Unknown',
        bgClass: 'bg-slate-50',
        textClass: 'text-slate-600',
        borderClass: 'border-slate-200',
        description: 'Status update pending'
      };
  }
}

export function getCategoryInfo(category: ReportCategory): {
  label: string;
  department: string;
  color: string;
} {
  switch (category) {
    case 'pothole':
      return { label: 'Pothole & Pavement', department: 'Public Works / Streets', color: '#f59e0b' };
    case 'trash':
      return { label: 'Illegal Dumping & Trash', department: 'Sanitation Dept', color: '#10b981' };
    case 'water_leak':
      return { label: 'Water Leak & Drainage', department: 'Water & Sewer Utility', color: '#06b6d4' };
    case 'other':
    default:
      return { label: 'Other Civic Issues', department: 'General City Services', color: '#64748b' };
  }
}

export function filterReports(
  reports: CivicReport[],
  filters: {
    query?: string;
    category?: string;
    status?: string;
    userId?: string | null;
    onlyMine?: boolean;
  }
): CivicReport[] {
  return reports.filter(r => {
    // User ownership filter
    if (filters.onlyMine) {
      if (!filters.userId || r.user_id !== filters.userId) {
        return false;
      }
    } else if (filters.userId && filters.onlyMine === false) {
      // not restricted
    }

    // Category filter
    if (filters.category && filters.category !== 'all' && r.category !== filters.category) {
      return false;
    }

    // Status filter
    if (filters.status && filters.status !== 'all' && r.status !== filters.status) {
      return false;
    }

    // Text query
    if (filters.query && filters.query.trim()) {
      const q = filters.query.toLowerCase().trim();
      const match =
        r.reference_id.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q) ||
        r.neighborhood.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });
}

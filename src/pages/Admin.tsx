import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Shield,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  User,
  MapPin,
  ExternalLink,
  Edit3,
  X,
  Save,
  Search,
  Check,
  RotateCcw
} from 'lucide-react';
import { useCivic } from '../lib/store';
import { StatusBadge, CategoryBadge } from '../components';
import { getStatusBadgeInfo } from '../lib/report-utils';
import type { CivicReport, ReportStatus } from '../lib/types';

const DEPARTMENTS = [
  'Public Works / Streets',
  'Sanitation Dept',
  'Municipal Electrical',
  'Water & Sewer Utility',
  'Code Enforcement',
  'Traffic Engineering',
  'General City Services'
];

export const Admin: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const { reports, user, updateReportStatus } = useCivic();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Active editing modal state
  const [editingReport, setEditingReport] = useState<CivicReport | null>(null);
  const [newStatus, setNewStatus] = useState<ReportStatus>('submitted');
  const [newDepartment, setNewDepartment] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // If URL has /admin/:id, open that report immediately
  useEffect(() => {
    if (id) {
      const match = reports.find(
        r => r.reference_id.toUpperCase() === id.toUpperCase() || r.id === id
      );
      if (match) {
        openEditModal(match);
      }
    }
  }, [id, reports]);

  const openEditModal = (report: CivicReport) => {
    setEditingReport(report);
    setNewStatus(report.status);
    setNewDepartment(report.assigned_department || DEPARTMENTS[0]);
    setNewNotes(report.admin_notes || '');
    setSaveSuccess(null);
    setSaveError(null);
  };

  const closeEditModal = () => {
    setEditingReport(null);
    setSaveSuccess(null);
    setSaveError(null);
  };

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReport) return;

    setIsSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const result = await updateReportStatus(
        editingReport.id,
        newStatus,
        newNotes,
        newDepartment
      );

      if (result.success) {
        setSaveSuccess(`Report ${editingReport.reference_id} updated successfully!`);
        setTimeout(() => {
          closeEditModal();
        }, 1200);
      } else {
        setSaveError(result.error || 'Failed to update report');
      }
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      if (filterStatus !== 'all' && r.status !== filterStatus) return false;
      if (filterDepartment !== 'all' && r.assigned_department !== filterDepartment) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          r.reference_id.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.address.toLowerCase().includes(q) ||
          r.neighborhood.toLowerCase().includes(q) ||
          (r.submitter_name && r.submitter_name.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [reports, filterStatus, filterDepartment, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: reports.length,
      pending: reports.filter(r => r.status === 'submitted').length,
      inProgress: reports.filter(r => r.status === 'in_progress' || r.status === 'under_review').length,
      resolved: reports.filter(r => r.status === 'resolved').length
    };
  }, [reports]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Municipal Operations Console
              </h1>
              <p className="text-xs text-slate-500">
                Authorized Staff Access: <strong className="text-slate-800">{user?.name}</strong> ({user?.email})
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-600" />
            Role: Municipal Admin
          </span>
          <Link
            to="/explore"
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Public Explorer
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-3xl font-extrabold text-slate-900">{stats.total}</div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
            Total City Incidents
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-3xl font-extrabold text-amber-600">{stats.pending}</div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
            Intake Queue (Pending)
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-3xl font-extrabold text-purple-600">{stats.inProgress}</div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
            Active Work Orders
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-3xl font-extrabold text-emerald-600">{stats.resolved}</div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
            Closed & Resolved
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference, address, title..."
              className="block w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="block w-full py-2 px-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Departments</option>
              {DEPARTMENTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full py-2 px-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Closed / Out of Scope</option>
            </select>
          </div>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-bold">
              <tr>
                <th className="px-5 py-3.5">Reference & Date</th>
                <th className="px-5 py-3.5">Issue & Category</th>
                <th className="px-5 py-3.5">Location & Neighborhood</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.map(report => (
                <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="font-mono font-bold text-slate-900 block">
                      {report.reference_id}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </td>

                  <td className="px-5 py-4 max-w-xs">
                    <div className="font-bold text-slate-900 truncate">{report.title}</div>
                    <div className="mt-1">
                      <CategoryBadge category={report.category} />
                    </div>
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="text-slate-800 font-medium">{report.address}</div>
                    <div className="text-[11px] text-slate-500">{report.neighborhood}</div>
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap">
                    <StatusBadge status={report.status} size="sm" />
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap text-slate-600 font-medium">
                    {report.assigned_department || 'Unassigned'}
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(report)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold border border-amber-300 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                      Manage
                    </button>

                    <Link
                      to={`/report/${report.reference_id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium border border-slate-200 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over / Modal for Report Status Management */}
      {editingReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white mr-2">
                  {editingReport.reference_id}
                </span>
                <span className="text-sm font-bold text-slate-900">
                  Update Municipal Workflow
                </span>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{saveSuccess}</span>
              </div>
            )}

            {saveError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-300 text-red-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>{saveError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUpdate} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <p className="font-bold text-slate-900 mb-1">{editingReport.title}</p>
                <p className="text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {editingReport.address}, {editingReport.neighborhood}
                </p>
              </div>

              {/* Status Select */}
              <div>
                <label htmlFor="admin-status-select" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Workflow Status
                </label>
                <select
                  id="admin-status-select"
                  name="status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ReportStatus)}
                  className="block w-full py-2.5 px-3 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="submitted">Submitted (Intake Queue)</option>
                  <option value="under_review">Under Review (Inspection Assigned)</option>
                  <option value="in_progress">In Progress (Work Crew Dispatched)</option>
                  <option value="resolved">Resolved (Completed & Verified)</option>
                  <option value="rejected">Closed / Out of Scope</option>
                </select>
              </div>

              {/* Department Assignment */}
              <div>
                <label htmlFor="admin-department-select" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Assigned Municipal Department
                </label>
                <select
                  id="admin-department-select"
                  name="department"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="block w-full py-2.5 px-3 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Admin / Dispatch Notes */}
              <div>
                <label htmlFor="admin-notes-textarea" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Public Dispatch / Resolution Note
                </label>
                <textarea
                  id="admin-notes-textarea"
                  name="adminNotes"
                  rows={3}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Work crew dispatched under work order #PW-102. Expected completion by Friday."
                  className="block w-full py-2 px-3 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Apply Municipal Update</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

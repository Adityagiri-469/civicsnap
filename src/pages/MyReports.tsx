import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Plus,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useCivic } from '../lib/store';
import { filterReports } from '../lib/report-utils';
import { StatusBadge, CategoryBadge } from '../components';
import type { ReportStatus } from '../lib/types';

export const MyReports: React.FC = () => {
  const { user, reports } = useCivic();
  const [activeTab, setActiveTab] = useState<string>('all');

  // Filter reports submitted by THIS user!
  const myReports = useMemo(() => {
    if (!user) return [];
    return reports.filter(r => r.user_id === user.id);
  }, [reports, user]);

  const displayedReports = useMemo(() => {
    if (activeTab === 'all') return myReports;
    return myReports.filter(r => r.status === activeTab);
  }, [myReports, activeTab]);

  const stats = useMemo(() => {
    return {
      total: myReports.length,
      submitted: myReports.filter(r => r.status === 'submitted').length,
      inProgress: myReports.filter(r => r.status === 'in_progress' || r.status === 'under_review').length,
      resolved: myReports.filter(r => r.status === 'resolved').length
    };
  }, [myReports]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              My Submitted Reports
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Citizen
            </span>
          </div>
          <p className="text-sm text-slate-600">
            Track real-time progress on neighborhood issues logged from your account ({user?.email})
          </p>
        </div>

        <Link
          to="/report"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          File New Issue
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-2xl font-extrabold text-slate-900">{stats.total}</div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
            Total Filed
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-2xl font-extrabold text-amber-600">{stats.submitted}</div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
            In Intake Queue
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-2xl font-extrabold text-purple-600">{stats.inProgress}</div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
            Under Active Repair
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-2xl font-extrabold text-emerald-600">{stats.resolved}</div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
            Completed / Fixed
          </div>
        </div>
      </div>

      {/* Tab Filter */}
      <div className="border-b border-slate-200 flex gap-6 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'all'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All Issues ({myReports.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('in_progress')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'in_progress'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          In Progress ({myReports.filter(r => r.status === 'in_progress').length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('submitted')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'submitted'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Intake Queue ({myReports.filter(r => r.status === 'submitted').length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('resolved')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'resolved'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Resolved ({myReports.filter(r => r.status === 'resolved').length})
        </button>
      </div>

      {/* Reports List */}
      {displayedReports.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-2xs">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No reports found in this view</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {myReports.length === 0
              ? 'You have not submitted any civic reports yet. Help your neighborhood by reporting a street or utility problem today.'
              : 'No reports match the selected status tab.'}
          </p>
          <div className="mt-6">
            <Link
              to="/report"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              File a Neighborhood Report
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedReports.map(report => (
            <div
              key={report.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                  <img
                    src={report.image_url}
                    alt={report.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                      {report.reference_id}
                    </span>
                    <StatusBadge status={report.status} size="sm" />
                    <CategoryBadge category={report.category} />
                  </div>

                  <h3 className="text-base font-bold text-slate-900 hover:text-emerald-600 transition-colors">
                    <Link to={`/report/${report.reference_id}`}>{report.title}</Link>
                  </h3>

                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{report.address}, {report.neighborhood}</span>
                    <span className="text-slate-300">•</span>
                    <span>Filed on {new Date(report.created_at).toLocaleDateString()}</span>
                  </p>

                  {report.admin_notes && (
                    <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 max-w-xl">
                      <strong className="text-slate-700">Municipal Dispatch: </strong>
                      {report.admin_notes}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                <Link
                  to={`/report/${report.reference_id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
                >
                  <span>Track Status</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

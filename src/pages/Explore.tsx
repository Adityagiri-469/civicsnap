import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  MapPin,
  ThumbsUp,
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { useCivic } from '../lib/store';
import { filterReports, getStatusBadgeInfo } from '../lib/report-utils';
import { StatusBadge, CategoryBadge } from '../components';
import { CivicMap } from '../components/CivicMap';
import type { CivicReport, ReportCategory, ReportStatus } from '../lib/types';

export const Explore: React.FC = () => {
  const { reports, upvoteReport } = useCivic();

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<CivicReport | null>(null);

  const filteredReports = useMemo(() => {
    return filterReports(reports, {
      query,
      category: selectedCategory,
      status: selectedStatus
    });
  }, [reports, query, selectedCategory, selectedStatus]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            City Issue Explorer
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Real-time public transparency for infrastructure requests across municipal districts
          </p>
        </div>

        <Link
          to="/report"
          className="self-start md:self-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-all"
        >
          + Report an Issue
        </Link>
      </div>

      {/* Interactive Map View */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <CivicMap
          mode="view"
          reports={filteredReports}
          selectedReportId={selectedReport?.id}
          onSelectReport={(r) => setSelectedReport(r)}
          heightClass="h-96"
        />

        {/* Selected Pin Mini Banner */}
        {selectedReport && (
          <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {selectedReport.reference_id}
                </span>
                <StatusBadge status={selectedReport.status} size="sm" />
              </div>
              <h3 className="font-bold text-sm text-white">{selectedReport.title}</h3>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                {selectedReport.address}, {selectedReport.neighborhood}
              </p>
            </div>

            <Link
              to={`/report/${selectedReport.reference_id}`}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 transition-colors"
            >
              Inspect Details →
            </Link>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search Field */}
          <div className="relative md:col-span-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reference, street, or keyword..."
              className="block w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full py-2.5 px-3 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Categories</option>
              <option value="pothole">Pothole & Pavement</option>
              <option value="trash">Illegal Dumping & Trash</option>
              <option value="water_leak">Water Leak & Drainage</option>
              <option value="other">Other Civic Issues</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="block w-full py-2.5 px-3 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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

        {/* Status Quick Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pt-2 border-t border-slate-100">
          <span className="text-slate-400 font-semibold uppercase tracking-wider shrink-0 mr-1">
            Status:
          </span>
          {['all', 'submitted', 'under_review', 'in_progress', 'resolved'].map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition-colors ${
                selectedStatus === st
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'All' : getStatusBadgeInfo(st as ReportStatus).label}
            </button>
          ))}
          <span className="ml-auto text-slate-400 font-medium shrink-0">
            Showing {filteredReports.length} results
          </span>
        </div>
      </div>

      {/* Reports Grid */}
      {filteredReports.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No issues found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search terms or filter criteria to see other neighborhood reports.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map(r => (
            <div
              key={r.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="relative h-44 bg-slate-100 overflow-hidden">
                <img
                  src={r.image_url}
                  alt={r.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-slate-950/85 text-white backdrop-blur-xs">
                    {r.reference_id}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <StatusBadge status={r.status} size="sm" />
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <CategoryBadge category={r.category} />
                    <span className="text-[11px] text-slate-400">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base line-clamp-1 mb-1">
                    {r.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {r.description}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate max-w-[170px]">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{r.address}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => upvoteReport(r.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 transition-colors"
                      title="Endorse this civic issue"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>{r.upvotes}</span>
                    </button>

                    <Link
                      to={`/report/${r.reference_id}`}
                      className="px-3 py-1 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

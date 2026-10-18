import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Calendar,
  Building,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ThumbsUp,
  Shield,
  FileText,
  ExternalLink
} from 'lucide-react';
import { useCivic } from '../lib/store';
import { StatusBadge, CategoryBadge } from '../components';
import { CivicMap } from '../components/CivicMap';
import { getGoogleMapsUrl } from '../lib/geo';

export const Detail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getReportByReferenceId, upvoteReport, user } = useCivic();

  const report = id ? getReportByReferenceId(id) : undefined;

  if (!report) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Report Not Found</h2>
        <p className="text-sm text-slate-500 mt-2">
          We could not find an incident matching reference code &ldquo;{id}&rdquo;.
        </p>
        <div className="mt-6">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Public Explorer
          </Link>
        </div>
      </div>
    );
  }

  const steps = [
    { key: 'submitted', label: 'Report Submitted', done: true },
    { key: 'under_review', label: 'Inspector Review', done: report.status !== 'submitted' },
    { key: 'in_progress', label: 'Crew Dispatched', done: report.status === 'in_progress' || report.status === 'resolved' },
    { key: 'resolved', label: 'Issue Resolved', done: report.status === 'resolved' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/explore"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Explorer
        </Link>

        {user?.role === 'admin' && (
          <Link
            to={`/admin/${report.reference_id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-amber-600" />
            Manage in Admin Console
          </Link>
        )}
      </div>

      {/* Main Detail Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-slate-900 text-white">
                {report.reference_id}
              </span>
              <StatusBadge status={report.status} />
              <CategoryBadge category={report.category} />
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                report.priority === 'urgent'
                  ? 'bg-red-100 text-red-800'
                  : report.priority === 'high'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-slate-100 text-slate-700'
              }`}>
                {report.priority} Priority
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {report.title}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => upvoteReport(report.id)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-bold text-sm border border-slate-200 transition-all shadow-2xs"
            >
              <ThumbsUp className="w-4 h-4 text-emerald-600" />
              <span>{report.upvotes} Upvotes</span>
            </button>
          </div>
        </div>

        {/* Progress Tracker / Lifecycle Timeline */}
        <div className="py-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
            Resolution Workflow Timeline
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {steps.map((step, idx) => (
              <div
                key={step.key}
                className={`p-3 rounded-xl border text-center transition-all ${
                  step.done
                    ? 'border-emerald-300 bg-emerald-50/70 text-emerald-900'
                    : 'border-slate-200 bg-slate-50 text-slate-400'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider mb-1">
                  Step {idx + 1}
                </div>
                <div className="text-xs font-bold flex items-center justify-center gap-1">
                  {step.done && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  <span>{step.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Photo and Map Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Citizen Photo Evidence
            </h3>
            <div className="rounded-xl overflow-hidden border border-slate-200 h-64 bg-slate-100">
              <img
                src={report.image_url}
                alt={report.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Geographic Location
              </h3>
              <a
                href={getGoogleMapsUrl(report.latitude, report.longitude)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                title="View exact incident coordinates in Google Maps"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <CivicMap
              mode="view"
              latitude={report.latitude}
              longitude={report.longitude}
              reports={[report]}
              selectedReportId={report.id}
              heightClass="h-64"
            />
          </div>
        </div>

        {/* Description & Municipal Notes */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Incident Description
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
              {report.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Physical Address
              </div>
              <div className="text-sm font-semibold text-slate-900">{report.address}</div>
              <div className="text-xs text-slate-500">{report.neighborhood}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                Assigned Municipal Authority
              </div>
              <div className="text-sm font-semibold text-slate-900">
                {report.assigned_department || 'Municipal Intake / Public Works'}
              </div>
              <div className="text-xs text-slate-500">
                Logged on {new Date(report.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          {report.admin_notes && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-800">
                <Shield className="w-4 h-4 text-amber-600" />
                Official Municipal Dispatch Note
              </div>
              <p className="text-sm text-amber-900 leading-relaxed font-medium">
                {report.admin_notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

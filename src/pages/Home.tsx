import React from 'react';
import { Link } from 'react-router-dom';
import {
  Camera,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Activity,
  AlertTriangle,
  Users,
  Sparkles
} from 'lucide-react';
import { useCivic } from '../lib/store';
import { StatusBadge, CategoryBadge } from '../components';

export const Home: React.FC = () => {
  const { reports, user } = useCivic();

  const totalReports = reports.length;
  const resolvedReports = reports.filter(r => r.status === 'resolved').length;
  const inProgressReports = reports.filter(r => r.status === 'in_progress').length;
  const recentReports = reports.slice(0, 3);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-900 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-emerald-500/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official Municipal 311 Citizen Portal</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            See a Problem in Your City?{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Snap It, Report It, Fix It.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            CivicSnap bridges neighborhood residents and city work crews. File potholes, faulty lights, and illegal dumping with verified tracking from report to resolution.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/report"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base shadow-lg shadow-emerald-500/30 hover:scale-[1.02] transition-all"
            >
              <Camera className="w-5 h-5" />
              Report an Issue Now
            </Link>

            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-white border border-slate-700 font-semibold text-base hover:scale-[1.02] transition-all"
            >
              <MapPin className="w-5 h-5 text-emerald-400" />
              Explore Issue Map
            </Link>
          </div>

          {/* Key Metrics Bar */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-slate-800/80">
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">{totalReports}</div>
              <div className="text-xs font-medium text-slate-400 mt-1">Total Incidents Logged</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{resolvedReports}</div>
              <div className="text-xs font-medium text-slate-400 mt-1">Public Issues Resolved</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-400">{inProgressReports}</div>
              <div className="text-xs font-medium text-slate-400 mt-1">Crews Active in Field</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="text-2xl sm:text-3xl font-extrabold text-teal-400">48h</div>
              <div className="text-xs font-medium text-slate-400 mt-1">Average Response SLA</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Simple 3-Step Process
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
            How Civic Action Happens
          </h2>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">
            From the moment you snap a photo on your block, municipal dispatch monitors the workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl mb-4">
              1
            </div>
            <h3 className="text-lg font-bold text-slate-900">Snap & Pin</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Take a photo of the road hazard, graffiti, or fallen tree. CivicSnap captures the GPS coordinates and street address.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl mb-4">
              2
            </div>
            <h3 className="text-lg font-bold text-slate-900">Intake & Dispatch</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              City engineers and department coordinators review the case, schedule repair trucks, and post live inspection notes.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xl mb-4">
              3
            </div>
            <h3 className="text-lg font-bold text-slate-900">Track & Resolve</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Receive status updates in &ldquo;My Reports&rdquo; until completion, and see your neighborhood improvements verified on the map.
            </p>
          </div>
        </div>
      </section>

      {/* Recent Public Reports Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Recent Neighborhood Reports
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Public tracking for issues logged across city districts
            </p>
          </div>

          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
          >
            <span>View All Reports</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentReports.map(report => (
            <div
              key={report.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="relative h-48 bg-slate-100 overflow-hidden">
                <img
                  src={report.image_url}
                  alt={report.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3">
                  <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-slate-950/80 text-white backdrop-blur-xs">
                    {report.reference_id}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <StatusBadge status={report.status} size="sm" />
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="mb-2">
                    <CategoryBadge category={report.category} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base line-clamp-1">
                    {report.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {report.description}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1 truncate max-w-[180px]">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {report.neighborhood}
                  </span>

                  <Link
                    to={`/report/${report.reference_id}`}
                    className="font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    View Status →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Municipal Staff Notice Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-950">
                Are you a Municipal Worker or City Official?
              </h3>
              <p className="text-sm text-amber-800 mt-1 max-w-2xl leading-relaxed">
                The Municipal Admin Console allows authorized departments to dispatch work crews, change case statuses, assign priority tags, and post public resolution notices.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            {user?.role === 'admin' ? (
              <Link
                to="/admin"
                className="px-5 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 transition-colors shadow-sm"
              >
                Open Admin Dashboard
              </Link>
            ) : (
              <Link
                to="/login?redirect=/admin"
                className="px-5 py-2.5 rounded-xl bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 transition-colors shadow-sm"
              >
                Admin Sign In
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

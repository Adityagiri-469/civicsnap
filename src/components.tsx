import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  Camera,
  MapPin,
  Shield,
  User,
  LogOut,
  Menu,
  X,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronDown,
  PhoneCall
} from 'lucide-react';
import { useCivic } from './lib/store';
import { getStatusBadgeInfo, getCategoryInfo } from './lib/report-utils';
import type { ReportCategory, ReportStatus } from './lib/types';

// ==========================================
// NAVBAR COMPONENT
// ==========================================
export const Navbar: React.FC = () => {
  const { user, logout, isSupabaseLive } = useCivic();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
    navigate('/');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-emerald-50 text-emerald-700 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors">
                Civic<span className="text-emerald-600">Snap</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                City 311
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/explore" className={navLinkClass}>
              Explore Issues
            </NavLink>
            <NavLink to="/report" className={navLinkClass}>
              Report Issue
            </NavLink>

            {/* My Reports - visible when logged in */}
            {user && (
              <NavLink to="/my-reports" className={navLinkClass}>
                My Reports
              </NavLink>
            )}

            {/* Admin Portal link - visible only if admin */}
            {user?.role === 'admin' && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-amber-100 text-amber-900'
                      : 'text-amber-800 hover:bg-amber-50 hover:text-amber-900'
                  }`
                }
              >
                <Shield className="w-4 h-4 text-amber-600" />
                Admin Dashboard
              </NavLink>
            )}
          </nav>

          {/* Right Section / Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {!user ? (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm hover:shadow transition-all"
                >
                  Create Account
                </Link>
              </>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left"
                  aria-expanded={userDropdownOpen}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    user.role === 'admin'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    {user.name ? user.name.slice(0, 2).toUpperCase() : 'CS'}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                      {user.name}
                    </span>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                      user.role === 'admin' ? 'text-amber-700' : 'text-emerald-700'
                    }`}>
                      {user.role === 'admin' ? 'Municipal Admin' : 'Citizen'}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-sm font-bold text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          user.role === 'admin'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}>
                          {user.role === 'admin' ? 'Municipal Admin' : 'Verified Citizen'}
                        </span>
                        {!isSupabaseLive && (
                          <span className="text-[10px] text-slate-400">(Demo Mode)</span>
                        )}
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/my-reports"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-slate-400" />
                        My Reports
                      </Link>

                      <Link
                        to="/report"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Camera className="w-4 h-4 text-slate-400" />
                        File New Report
                      </Link>

                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-amber-800 bg-amber-50/50 hover:bg-amber-50 font-medium transition-colors"
                        >
                          <Shield className="w-4 h-4 text-amber-600" />
                          Municipal Admin Console
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-1 mt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2">
          {user && (
            <div className="p-3 bg-slate-50 rounded-xl mb-3 border border-slate-200">
              <p className="text-sm font-bold text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
              <div className="mt-1">
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  user.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {user.role === 'admin' ? 'Municipal Admin' : 'Citizen'}
                </span>
              </div>
            </div>
          )}

          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
          >
            Home
          </Link>
          <Link
            to="/explore"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
          >
            Explore Issues
          </Link>
          <Link
            to="/report"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
          >
            Report an Issue
          </Link>

          {user && (
            <Link
              to="/my-reports"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-100"
            >
              My Reports
            </Link>
          )}

          {user?.role === 'admin' && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-semibold text-amber-900 bg-amber-50"
            >
              Admin Dashboard
            </Link>
          )}

          <div className="pt-3 border-t border-slate-200">
            {!user ? (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg bg-emerald-600 text-sm font-semibold text-white shadow-sm"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 px-4 rounded-lg bg-red-50 text-red-700 text-sm font-semibold flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

// ==========================================
// FOOTER COMPONENT
// ==========================================
export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                <Camera className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">CivicSnap</span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              CivicSnap empowers neighborhood residents and municipal authorities to collaborate on faster, transparent public infrastructure resolutions.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-amber-300 bg-amber-950/70 border border-amber-800/80 px-3.5 py-2.5 rounded-xl max-w-md shadow-inner">
              <PhoneCall className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                For urgent emergencies (fire, medical, police), call <strong className="text-amber-200 font-bold underline underline-offset-2">112</strong> (India Emergency Services) immediately.
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-3">
              Citizen Actions
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link to="/report" className="hover:text-white transition-colors">
                  Report a Problem
                </Link>
              </li>
              <li>
                <Link to="/explore" className="hover:text-white transition-colors">
                  Live Public Map
                </Link>
              </li>
              <li>
                <Link to="/my-reports" className="hover:text-white transition-colors">
                  My Tracked Reports
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Citizen Portal Sign In
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-3">
              Municipal Services
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link to="/admin" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  Admin Console
                </Link>
              </li>
              <li>
                <span className="text-slate-500">Public Works Dispatch</span>
              </li>
              <li>
                <span className="text-slate-500">Sanitation & Debris Intake</span>
              </li>
              <li>
                <span className="text-slate-500">Traffic Engineering</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} CivicSnap. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Emergency Helpline: 112 (India)
            </span>
            <span>Civic Grievance Redressal</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

// ==========================================
// PROTECTED ROUTE (FOR CITIZENS / ANY AUTH)
// ==========================================
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useCivic();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// ==========================================
// ADMIN PROTECTED ROUTE (MUNICIPAL ADMINS ONLY)
// ==========================================
export const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useCivic();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Verifying administrator credentials...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> Redirect to login with intended admin destination
  if (!user) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
        state={{
          from: location,
          warning: 'Municipal administrator authentication required to access this portal.'
        }}
        replace
      />
    );
  }

  // Logged in as citizen -> STRICTLY BLOCKED! Redirect to unauthorized notice or home
  if (user.role !== 'admin') {
    return (
      <div className="min-h-[70vh] max-w-2xl mx-auto px-4 py-16 text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-6 shadow-sm">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">
          Access Restricted: Municipal Admin Only
        </h1>
        <p className="mt-3 text-slate-600 leading-relaxed max-w-lg">
          You are currently signed in as <strong className="text-slate-900">{user.email}</strong> with a <span className="font-semibold text-emerald-700">Citizen</span> role.
          The municipal dashboard is restricted strictly to authorized city staff.
        </p>

        <div className="mt-6 p-4 rounded-xl bg-slate-100 border border-slate-200 text-left max-w-md w-full">
          <p className="text-xs text-slate-600">
            If you require municipal administrative access, please contact your municipal system administrator to assign the appropriate permissions to your account.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/my-reports"
            className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors shadow-sm"
          >
            Go to My Citizen Reports
          </Link>
          <Link
            to="/"
            className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-100 transition-colors"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// ==========================================
// STATUS BADGE COMPONENT
// ==========================================
export const StatusBadge: React.FC<{ status: ReportStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md'
}) => {
  const info = getStatusBadgeInfo(status);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${info.bgClass} ${info.textClass} ${info.borderClass} ${sizeClasses}`}
      title={info.description}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {info.label}
    </span>
  );
};

// ==========================================
// CATEGORY BADGE COMPONENT
// ==========================================
export const CategoryBadge: React.FC<{ category: ReportCategory }> = ({ category }) => {
  const info = getCategoryInfo(category);
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: info.color }} />
      {info.label}
    </span>
  );
};


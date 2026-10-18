import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Camera,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  ArrowRight,
  ShieldAlert,
  Info,
  Check,
  Sparkles,
  LocateFixed,
  Loader2,
  ExternalLink,
  PhoneCall
} from 'lucide-react';
import { useCivic } from '../lib/store';
import type { ReportCategory, ReportPriority } from '../lib/types';
import { CivicMap } from '../components/CivicMap';
import { EvidenceCapture, EvidenceMetadata } from '../components/EvidenceCapture';
import { getUserCurrentLocation, reverseGeocode, getGoogleMapsUrl } from '../lib/geo';

const CATEGORIES: Array<{ id: ReportCategory; label: string; icon: string; desc: string }> = [
  { id: 'pothole', label: 'Pothole & Pavement', icon: '🕳️', desc: 'Road cracks, craters, uneven street surfaces' },
  { id: 'trash', label: 'Illegal Dumping & Trash', icon: '🗑️', desc: 'Abandoned furniture, debris, overflowing bins' },
  { id: 'water_leak', label: 'Water Leak & Drainage', icon: '💧', desc: 'Broken mains, flooded gutters, clogged storm drains' },
  { id: 'other', label: 'Other Civic Issues', icon: '📋', desc: 'Parks, public benches, sidewalk obstructions' }
];

export const Report: React.FC = () => {
  const { user, addReport } = useCivic();
  const navigate = useNavigate();

  const [category, setCategory] = useState<ReportCategory>('pothole');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ReportPriority>('medium');
  const [latitude, setLatitude] = useState(37.7749);
  const [longitude, setLongitude] = useState(-122.4194);
  const [address, setAddress] = useState('1150 Market St');
  const [neighborhood, setNeighborhood] = useState('Civic Center');
  const [imageUrl, setImageUrl] = useState('');
  const [imageMetadata, setImageMetadata] = useState<EvidenceMetadata | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(null);

  // Current location GPS state
  const [isLocating, setIsLocating] = useState(false);
  const [locationFeedback, setLocationFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const handleLocationSelect = (lat: number, lng: number, addr: string, neigh: string) => {
    setLatitude(lat);
    setLongitude(lng);
    setAddress(addr);
    setNeighborhood(neigh);
  };

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    setLocationFeedback(null);
    try {
      const loc = await getUserCurrentLocation();
      setLatitude(loc.latitude);
      setLongitude(loc.longitude);

      const geocoded = await reverseGeocode(loc.latitude, loc.longitude);
      setAddress(geocoded.address);
      setNeighborhood(geocoded.neighborhood);

      if (loc.source === 'gps') {
        setLocationFeedback({
          type: 'success',
          message: `Current GPS location acquired! Coordinates: ${loc.latitude}, ${loc.longitude} (±${loc.accuracy}m)`
        });
      } else {
        setLocationFeedback({
          type: 'info',
          message: loc.note || `Location set to approx ${geocoded.neighborhood}. Click on the Google Map to pinpoint exactly.`
        });
      }
      setTimeout(() => setLocationFeedback(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to acquire location.';
      setLocationFeedback({ type: 'error', message: msg });
      setTimeout(() => setLocationFeedback(null), 6000);
    } finally {
      setIsLocating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide a descriptive title for this issue');
      return;
    }

    if (!description.trim()) {
      setError('Please provide incident details to assist municipal field technicians');
      return;
    }

    if (!imageUrl) {
      setError('Please capture or upload an evidence photo of the issue so city workers can inspect and verify the problem.');
      return;
    }

    setLoading(true);
    try {
      const res = await addReport({
        title,
        description,
        category,
        priority,
        latitude,
        longitude,
        address,
        neighborhood,
        image_url: imageUrl
      });

      if (res.success && res.report) {
        setSubmittedReportId(res.report.reference_id);
      } else {
        setError(res.error || 'Failed to submit report. Please try again.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (submittedReportId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Civic Report Submitted!
        </h1>
        <p className="mt-3 text-slate-600 max-w-md mx-auto">
          Your report has been entered into the municipal intake queue and assigned a permanent tracking reference.
        </p>

        <div className="mt-6 inline-block bg-slate-900 text-white font-mono text-xl font-bold px-6 py-3 rounded-xl tracking-wider shadow-md">
          {submittedReportId}
        </div>

        <div className="mt-8 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-left max-w-md mx-auto text-xs text-emerald-900 space-y-2">
          <div className="flex items-center gap-1.5 font-bold">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Associated with: {user ? `${user.name} (${user.email})` : 'Anonymous Citizen'}</span>
          </div>
          <p className="text-emerald-700">
            {user
              ? 'You can track repair dispatch updates in real time on your "My Reports" dashboard.'
              : 'Sign in to save future submissions directly to your citizen portfolio.'}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to={`/report/${submittedReportId}`}
            className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 shadow-sm transition-all"
          >
            View Report Details
          </Link>

          {user && (
            <Link
              to="/my-reports"
              className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-all"
            >
              My Submitted Reports
            </Link>
          )}

          <button
            type="button"
            onClick={() => {
              setSubmittedReportId(null);
              setTitle('');
              setDescription('');
              setImageUrl('');
              setImageMetadata(null);
            }}
            className="px-6 py-3 rounded-xl text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors"
          >
            File Another Issue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          File a Neighborhood Issue
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Submit photos, locations, and descriptions directly to municipal dispatch
        </p>

        {/* User state indicator */}
        <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          {user ? (
            <div className="flex items-center gap-2 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                Filing as authenticated citizen: <strong>{user.name}</strong> ({user.email})
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-600">
              <Info className="w-4 h-4 text-slate-400" />
              <span>
                Filing as guest.{' '}
                <Link to="/login?redirect=/report" className="font-semibold text-emerald-600 hover:underline">
                  Sign in
                </Link>{' '}
                to track this report under your citizen account.
              </span>
            </div>
          )}
        </div>

        {/* India 112 Emergency advisory */}
        <div className="mt-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200/90 flex items-center gap-2.5 text-xs text-amber-900 shadow-xs">
          <PhoneCall className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Emergency Advisory (India):</strong> For immediate life or safety emergencies (police, medical, fire), dial <strong className="underline text-amber-950 font-bold">112</strong> directly. This form is for civic infrastructure repairs.
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
        {/* Step 1: Category Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            1. Select Issue Category
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {CATEGORIES.map(c => {
              const isSelected = category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-2xl shrink-0">{c.icon}</span>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{c.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{c.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Capture Evidence */}
        <EvidenceCapture
          imageUrl={imageUrl}
          metadata={imageMetadata}
          onImageChange={(url, meta) => {
            setImageUrl(url);
            setImageMetadata(meta);
          }}
          onRemove={() => {
            setImageUrl('');
            setImageMetadata(null);
          }}
        />

        {/* Step 3: Geographic Location & Map */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              3. Pin Exact Geographic Location
            </label>

            {/* Quick GPS Geolocation Action Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-70 cursor-pointer"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Detecting GPS...</span>
                  </>
                ) : (
                  <>
                    <LocateFixed className="w-3.5 h-3.5" />
                    <span>Use My Current Location</span>
                  </>
                )}
              </button>

              <a
                href={getGoogleMapsUrl(latitude, longitude)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                title="Verify location on Google Maps"
              >
                <span>Google Maps</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          </div>

          {/* Location Feedback Toast */}
          {locationFeedback && (
            <div
              className={`mb-3 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
                locationFeedback.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                  : 'bg-red-50 border border-red-300 text-red-800'
              }`}
            >
              {locationFeedback.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{locationFeedback.message}</span>
            </div>
          )}

          <CivicMap
            mode="picker"
            latitude={latitude}
            longitude={longitude}
            onLocationSelect={handleLocationSelect}
          />

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="address" className="block text-xs font-semibold text-slate-600">
                  Detected Address / Cross Street
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  id="address"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="neighborhood" className="block text-xs font-semibold text-slate-600 mb-1">
                City District / Neighborhood
              </label>
              <input
                id="neighborhood"
                type="text"
                required
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="block w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Step 4: Issue Details */}
        <div className="space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            4. Incident Details & Priority
          </label>

          <div>
            <label htmlFor="title" className="block text-xs font-semibold text-slate-700 mb-1">
              Issue Summary / Headline
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Deep pothole causing flat tires in right lane"
              className="block w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-xs font-semibold text-slate-700 mb-1">
              Detailed Description for Dispatch Crew
            </label>
            <textarea
              id="description"
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe exact location markers, hazard severity, approximate dimensions, and immediate dangers..."
              className="block w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Citizen Assessed Urgency
            </label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high', 'urgent'] as ReportPriority[]).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                    priority === p
                      ? p === 'urgent'
                        ? 'bg-red-600 text-white'
                        : p === 'high'
                        ? 'bg-amber-600 text-white'
                        : 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Submitting to Municipal Intake...</span>
              </>
            ) : (
              <>
                <span>Submit Civic Report</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

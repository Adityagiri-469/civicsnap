import React, { useState, useEffect, useCallback } from 'react';
import {
  APIProvider,
  Map,
  Marker,
  InfoWindow,
  useMap
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  LocateFixed,
  ExternalLink,
  Loader2,
  Check,
  AlertCircle,
  Navigation
} from 'lucide-react';
import type { CivicReport } from '../lib/types';
import {
  GOOGLE_MAPS_API_KEY,
  NEIGHBORHOOD_PRESETS,
  getNearestNeighborhood,
  getUserCurrentLocation,
  reverseGeocode,
  getGoogleMapsUrl
} from '../lib/geo';

interface CivicMapProps {
  mode: 'picker' | 'view';
  latitude?: number;
  longitude?: number;
  onLocationSelect?: (lat: number, lng: number, address: string, neighborhood: string) => void;
  reports?: CivicReport[];
  selectedReportId?: string;
  onSelectReport?: (report: CivicReport) => void;
  heightClass?: string;
}

// Controller component to smoothly pan map when center coords change
const CameraPanController: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (map && typeof lat === 'number' && typeof lng === 'number') {
      map.panTo({ lat, lng });
    }
  }, [map, lat, lng]);
  return null;
};

export const CivicMap: React.FC<CivicMapProps> = ({
  mode,
  latitude = 37.7749,
  longitude = -122.4194,
  onLocationSelect,
  reports = [],
  selectedReportId,
  onSelectReport,
  heightClass = 'h-84'
}) => {
  const [currentLat, setCurrentLat] = useState(latitude);
  const [currentLng, setCurrentLng] = useState(longitude);
  const [activePreset, setActivePreset] = useState<string>('Civic Center');
  const [isLocating, setIsLocating] = useState(false);
  const [locationNotice, setLocationNotice] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);
  const [activeReportInfo, setActiveReportInfo] = useState<CivicReport | null>(null);

  // Sync internal coords with props
  useEffect(() => {
    if (typeof latitude === 'number' && typeof longitude === 'number') {
      setCurrentLat(latitude);
      setCurrentLng(longitude);
    }
  }, [latitude, longitude]);

  // Handle "Use My Current Location"
  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    setLocationNotice(null);

    try {
      const loc = await getUserCurrentLocation();
      setCurrentLat(loc.latitude);
      setCurrentLng(loc.longitude);
      setActivePreset('My Location');

      // Reverse geocode to get street name
      const geocoded = await reverseGeocode(loc.latitude, loc.longitude);

      if (onLocationSelect) {
        onLocationSelect(loc.latitude, loc.longitude, geocoded.address, geocoded.neighborhood);
      }

      if (loc.source === 'gps') {
        setLocationNotice({
          type: 'success',
          text: `GPS Location locked! (±${loc.accuracy}m)`
        });
      } else {
        setLocationNotice({
          type: 'info',
          text: loc.note || 'Location detected. You can also click on the map to adjust.'
        });
      }
      setTimeout(() => setLocationNotice(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to acquire location.';
      setLocationNotice({
        type: 'error',
        text: msg
      });
      setTimeout(() => setLocationNotice(null), 5000);
    } finally {
      setIsLocating(false);
    }
  };

  // Handle click on Google Map (picker mode)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMapClick = useCallback(async (event: any) => {
    if (mode !== 'picker' || !onLocationSelect) return;

    const latLng = event.detail?.latLng || (event.latLng ? { lat: event.latLng.lat(), lng: event.latLng.lng() } : null);
    if (!latLng) return;

    const newLat = parseFloat(Number(latLng.lat).toFixed(5));
    const newLng = parseFloat(Number(latLng.lng).toFixed(5));

    setCurrentLat(newLat);
    setCurrentLng(newLng);
    setActivePreset('Custom Pin');

    // Resolve address
    const geocoded = await reverseGeocode(newLat, newLng);
    onLocationSelect(newLat, newLng, geocoded.address, geocoded.neighborhood);
  }, [mode, onLocationSelect]);

  const handlePresetSelect = (preset: typeof NEIGHBORHOOD_PRESETS[0]) => {
    setActivePreset(preset.name);
    setCurrentLat(preset.lat);
    setCurrentLng(preset.lng);
    if (onLocationSelect) {
      onLocationSelect(preset.lat, preset.lng, preset.address, preset.name);
    }
  };

  const googleMapsUrl = getGoogleMapsUrl(currentLat, currentLng);

  // Status color mappings for markers
  const getStatusPinColor = (status: CivicReport['status']) => {
    switch (status) {
      case 'resolved':
        return '#10b981'; // emerald
      case 'in_progress':
        return '#f59e0b'; // amber
      case 'under_review':
        return '#3b82f6'; // blue
      case 'rejected':
        return '#64748b'; // slate
      case 'submitted':
      default:
        return '#ef4444'; // red
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className={`relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-md ${heightClass} w-full`}>
        {/* Top Header Controls overlay */}
        <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          {/* Badge */}
          <div className="pointer-events-auto flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-200/80 text-xs font-bold text-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Google Maps</span>
            {mode === 'picker' && (
              <span className="text-[10px] text-slate-500 font-normal ml-1">
                (Click map to position pin)
              </span>
            )}
          </div>

          {/* External Google Maps Link */}
          <div className="pointer-events-auto flex items-center gap-2">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-200 text-xs font-semibold text-slate-700 hover:text-emerald-700 flex items-center gap-1.5 transition-colors"
              title="Open coordinates in Google Maps"
            >
              <span>View in Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Floating Action Button: "Use My Current Location" */}
        {mode === 'picker' && (
          <div className="absolute bottom-4 left-3 z-10 pointer-events-auto flex flex-col gap-2 max-w-sm">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow-xl shadow-emerald-950/40 border border-emerald-400/40 transition-all disabled:opacity-75 cursor-pointer"
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Locating your position...</span>
                </>
              ) : (
                <>
                  <LocateFixed className="w-4 h-4 text-emerald-100" />
                  <span>Use My Current Location</span>
                </>
              )}
            </button>

            {/* Notification Toast */}
            {locationNotice && (
              <div
                className={`backdrop-blur-md px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg border animate-in fade-in slide-in-from-bottom-2 ${
                  locationNotice.type === 'success'
                    ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
                    : locationNotice.type === 'error'
                    ? 'bg-red-950/90 text-red-200 border-red-500/40'
                    : 'bg-slate-900/90 text-slate-200 border-slate-700'
                }`}
              >
                {locationNotice.type === 'success' && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                {locationNotice.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
                {locationNotice.type === 'info' && <Navigation className="w-4 h-4 text-sky-400 shrink-0" />}
                <span className="leading-snug">{locationNotice.text}</span>
              </div>
            )}
          </div>
        )}

        {/* Real Google Maps Component via @vis.gl/react-google-maps */}
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
          <Map
            style={{ width: '100%', height: '100%' }}
            defaultCenter={{ lat: currentLat, lng: currentLng }}
            defaultZoom={14}
            gestureHandling="greedy"
            disableDefaultUI={false}
            onClick={handleMapClick}
          >
            <CameraPanController lat={currentLat} lng={currentLng} />

            {/* Picker Mode: Draggable active pin */}
            {mode === 'picker' && (
              <Marker
                position={{ lat: currentLat, lng: currentLng }}
                title="Selected Issue Location"
                draggable={true}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onDragEnd={async (e: any) => {
                  if (e.latLng && onLocationSelect) {
                    const nLat = parseFloat(Number(e.latLng.lat()).toFixed(5));
                    const nLng = parseFloat(Number(e.latLng.lng()).toFixed(5));
                    setCurrentLat(nLat);
                    setCurrentLng(nLng);
                    const geocoded = await reverseGeocode(nLat, nLng);
                    onLocationSelect(nLat, nLng, geocoded.address, geocoded.neighborhood);
                  }
                }}
              />
            )}

            {/* View Mode: Multiple Report Markers */}
            {mode === 'view' && reports.map((r) => {
              const isSelected = selectedReportId === r.id;
              return (
                <Marker
                  key={r.id}
                  position={{ lat: r.latitude, lng: r.longitude }}
                  title={r.title}
                  onClick={() => {
                    setActiveReportInfo(r);
                    if (onSelectReport) onSelectReport(r);
                  }}
                  icon={{
                    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                    fillColor: getStatusPinColor(r.status),
                    fillOpacity: 1,
                    strokeColor: isSelected ? '#ffffff' : '#000000',
                    strokeWeight: isSelected ? 2 : 1,
                    scale: isSelected ? 1.6 : 1.3,
                    anchor: { x: 12, y: 22 } as google.maps.Point
                  }}
                />
              );
            })}

            {/* Info Window for selected report */}
            {mode === 'view' && activeReportInfo && (
              <InfoWindow
                position={{ lat: activeReportInfo.latitude, lng: activeReportInfo.longitude }}
                onCloseClick={() => setActiveReportInfo(null)}
              >
                <div className="p-2 text-slate-800 max-w-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-0.5">
                    {activeReportInfo.neighborhood}
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 mb-1 leading-snug">
                    {activeReportInfo.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 mb-2 line-clamp-2">
                    {activeReportInfo.description}
                  </p>
                  <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100">
                    <span className="font-medium text-slate-500 capitalize">
                      {activeReportInfo.status.replace('_', ' ')}
                    </span>
                    <span className="font-semibold text-emerald-600">
                      {activeReportInfo.category.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>

      {/* Preset Neighborhood Quick Select Bar (Picker Mode) */}
      {mode === 'picker' && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Quick Neighborhoods:</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {currentLat.toFixed(4)}, {currentLng.toFixed(4)}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {NEIGHBORHOOD_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activePreset === preset.name
                    ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500 font-semibold'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

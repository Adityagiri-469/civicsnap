import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  Trash2,
  Check,
  SwitchCamera,
  X,
  AlertTriangle,
  Loader2,
  FileImage,
  RefreshCw
} from 'lucide-react';

export interface EvidenceMetadata {
  name: string;
  sizeKb: number;
  timestamp: string;
}

interface EvidenceCaptureProps {
  imageUrl: string;
  metadata?: EvidenceMetadata | null;
  onImageChange: (dataUrl: string, metadata: EvidenceMetadata) => void;
  onRemove: () => void;
}

/**
 * Resizes and compresses an image to prevent huge localStorage payloads
 * while maintaining crisp resolution for city inspectors.
 */
export async function processImageFile(
  fileOrBlob: File | Blob,
  fallbackName = 'evidence_photo.jpg'
): Promise<{ dataUrl: string; sizeKb: number; name: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to parse image data'));
      img.onload = () => {
        const MAX_WIDTH = 1400;
        const MAX_HEIGHT = 1400;
        let { width, height } = img;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width > height) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          } else {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }

        // Clean rendering
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        // Approximate size in KB from base64 length
        const sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);
        const name =
          fileOrBlob instanceof File && fileOrBlob.name
            ? fileOrBlob.name
            : fallbackName;

        resolve({ dataUrl, sizeKb, name });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(fileOrBlob);
  });
}

export const EvidenceCapture: React.FC<EvidenceCaptureProps> = ({
  imageUrl,
  metadata,
  onImageChange,
  onRemove
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Live camera modal state (for laptops & desktops)
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera tracks cleanly
  const stopLiveCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  }, [cameraStream]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      stopLiveCamera();
    };
  }, [stopLiveCamera]);

  // Handle incoming file selection (from camera or file picker)
  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WEBP, etc.)');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const result = await processImageFile(file, file.name);
      onImageChange(result.dataUrl, {
        name: result.name,
        sizeKb: result.sizeKb,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error processing image';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // reset input value so re-selecting same file triggers onChange
    e.target.value = '';
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  // Launch live camera stream for laptops / desktops
  const openLiveCamera = async () => {
    setCameraError(null);
    setIsLiveCameraOpen(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      // Enumerate camera devices to check for multiple cameras
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setCameraDevices(videoInputs);
      } catch {
        // Enumerate might fail before permission; ignore
      }

      const constraints: MediaStreamConstraints = {
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId } }
          : {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: unknown) {
      console.warn('Live camera error:', err);
      const msg =
        err instanceof Error && err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in browser settings or use the file upload option.'
          : err instanceof Error
          ? err.message
          : 'Unable to start camera preview.';
      setCameraError(msg);
    }
  };

  // Attach stream when video element becomes available in modal
  useEffect(() => {
    if (isLiveCameraOpen && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(() => {});
    }
  }, [isLiveCameraOpen, cameraStream]);

  // Switch between front/back or different cameras
  const switchCamera = async () => {
    if (cameraDevices.length <= 1) return;
    const currentIndex = cameraDevices.findIndex((d) => d.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % cameraDevices.length;
    const nextDeviceId = cameraDevices[nextIndex].deviceId;
    setSelectedDeviceId(nextDeviceId);

    stopLiveCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: nextDeviceId } },
        audio: false
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error('Error switching camera:', err);
    }
  };

  // Snap photo from the live video stream
  const snapPhoto = async () => {
    if (!videoRef.current) return;

    try {
      const video = videoRef.current;
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Draw the video frame
      ctx.drawImage(video, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const result = await processImageFile(
          blob,
          `camera_evidence_${Date.now()}.jpg`
        );
        onImageChange(result.dataUrl, {
          name: result.name,
          sizeKb: result.sizeKb,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        closeLiveCamera();
      }, 'image/jpeg', 0.85);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to capture photo';
      setCameraError(msg);
    }
  };

  const closeLiveCamera = () => {
    stopLiveCamera();
    setIsLiveCameraOpen(false);
    setCameraError(null);
  };

  return (
    <div className="space-y-4">
      {/* Hidden system inputs */}
      {/* 1. Mobile Direct Camera Input (launches native rear camera app on mobile devices) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleInputChange}
      />

      {/* 2. Device File Input (browse phone gallery / laptop files) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />

      {/* Section Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
            2. Capture Evidence
          </label>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            Required for Municipal Dispatch
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Click a photo using your phone/laptop camera or upload evidence directly from your device storage.
        </p>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="ml-auto text-red-400 hover:text-red-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-600">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          <span className="text-xs font-semibold">Processing and optimizing evidence photo...</span>
        </div>
      )}

      {/* View 1: When Photo is Captured / Attached */}
      {!isProcessing && imageUrl ? (
        <div className="bg-slate-50 border-2 border-emerald-500/50 rounded-2xl overflow-hidden p-4 sm:p-5 transition-all shadow-xs">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            {/* Image Preview Container */}
            <div className="relative rounded-xl overflow-hidden border border-slate-300 w-full sm:w-64 h-52 bg-slate-900 shrink-0 flex items-center justify-center group shadow-inner">
              <img
                src={imageUrl}
                alt="Captured Civic Evidence"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2.5 left-2.5 bg-emerald-600/95 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                <Check className="w-3.5 h-3.5" />
                <span>Evidence Attached</span>
              </div>
            </div>

            {/* Evidence Metadata & Actions */}
            <div className="flex-1 flex flex-col justify-between h-full space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="p-1 rounded-md bg-emerald-100 text-emerald-700">
                    <FileImage className="w-4 h-4" />
                  </span>
                  <span className="font-bold text-sm text-slate-900 truncate">
                    {metadata?.name || 'civic_evidence.jpg'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
                  {metadata?.sizeKb ? (
                    <span className="bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded-md">
                      {metadata.sizeKb} KB
                    </span>
                  ) : null}
                  {metadata?.timestamp ? (
                    <span>Captured at {metadata.timestamp}</span>
                  ) : (
                    <span>Ready for field verification</span>
                  )}
                </div>

                <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                  This photo is attached to your report. Field crews will reference this evidence to dispatch appropriate equipment and verify the repair.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2.5">
                {/* Take photo again */}
                <button
                  type="button"
                  onClick={() => {
                    // If on desktop/laptop, offer live camera; on mobile, trigger camera input
                    if (/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
                      cameraInputRef.current?.click();
                    } else {
                      openLiveCamera();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Retake Photo</span>
                </button>

                {/* Upload different file */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Choose Another File</span>
                </button>

                {/* Remove photo */}
                <button
                  type="button"
                  onClick={onRemove}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 text-xs font-semibold transition-all cursor-pointer ml-auto"
                  title="Remove this photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* View 2: When No Photo is Attached (Upload / Capture Options) */}
      {!isProcessing && !imageUrl && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card A: Take Photo with Camera */}
          <div className="p-5 rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/20 transition-all flex flex-col justify-between group">
            <div className="mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Click Photo with Camera
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Use your phone or laptop camera to take a fresh photo of the pothole, trash pile, or water leak on the spot.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              {/* Native Mobile Camera Button (also opens camera on phone) */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Take Photo (Camera)</span>
              </button>

              {/* Laptop Live Webcam Modal Option */}
              <button
                type="button"
                onClick={openLiveCamera}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
              >
                <span>Open Live Webcam (Laptop)</span>
              </button>
            </div>
          </div>

          {/* Card B: Upload from Phone / Laptop Storage */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-5 rounded-2xl border-2 border-dashed transition-all flex flex-col justify-between group cursor-pointer ${
              isDragOver
                ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
                : 'border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Upload from Phone / Laptop
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Drag and drop your photo here or browse your gallery, downloads, or computer desktop files.
              </p>
            </div>

            <div className="pt-2">
              <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-98 text-white text-xs font-bold shadow-sm transition-all">
                <Upload className="w-4 h-4" />
                <span>Browse Files / Gallery</span>
              </div>
              <p className="text-[11px] text-center text-slate-400 mt-2">
                Supports JPG, PNG, WEBP, HEIC up to 25MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Live Camera Snapshot Modal (for Laptop / Desktop users) */}
      {isLiveCameraOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden max-w-xl w-full shadow-2xl border border-slate-700 flex flex-col">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm">Capture Live Evidence Photo</span>
              </div>
              <button
                type="button"
                onClick={closeLiveCamera}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Viewport */}
            <div className="relative bg-black aspect-video sm:aspect-4/3 flex items-center justify-center overflow-hidden">
              {cameraError ? (
                <div className="p-6 text-center text-white max-w-sm">
                  <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                  <p className="text-sm font-medium mb-4">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      closeLiveCamera();
                      fileInputRef.current?.click();
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                  >
                    Upload Photo from Files Instead
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Framing crosshair / guidelines */}
                  <div className="absolute inset-8 border-2 border-white/30 rounded-2xl pointer-events-none flex items-center justify-center">
                    <span className="text-[11px] font-semibold text-white/80 bg-black/40 px-3 py-1 rounded-full backdrop-blur-xs">
                      Frame the civic issue in center
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer Controls */}
            {!cameraError && (
              <div className="p-4 bg-slate-900 flex items-center justify-between gap-4">
                {/* Switch camera button (if multiple cameras exist) */}
                {cameraDevices.length > 1 ? (
                  <button
                    type="button"
                    onClick={switchCamera}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Switch Camera"
                  >
                    <SwitchCamera className="w-4 h-4" />
                    <span className="hidden sm:inline">Flip Camera</span>
                  </button>
                ) : (
                  <div className="w-16" />
                )}

                {/* Shutter Button */}
                <button
                  type="button"
                  onClick={snapPhoto}
                  className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-90 border-4 border-white text-slate-950 flex items-center justify-center shadow-lg transition-transform cursor-pointer"
                  title="Snap Evidence Photo"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-slate-950/30 flex items-center justify-center">
                    <Camera className="w-6 h-6 text-slate-950" />
                  </div>
                </button>

                {/* Cancel button */}
                <button
                  type="button"
                  onClick={closeLiveCamera}
                  className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

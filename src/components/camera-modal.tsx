'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';

export interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  onMeasure?: (file: File) => void;
}

export type DistanceStatus = 'too_far' | 'too_close' | 'optimal' | 'blurry' | 'searching';

export function CameraModal({ isOpen, onClose, onCapture, onMeasure }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState<string | null>(null);

  // Real-time distance and sharpness assistance
  const [distanceStatus, setDistanceStatus] = useState<DistanceStatus>('searching');
  const [distanceProgress, setDistanceProgress] = useState<number>(50);

  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setErrorMessage(null);

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      setStream(newStream);
      setHasPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err: unknown) {
      console.warn('Camera access failed:', err);
      setHasPermission(false);
      setErrorMessage('Camera access is not permitted or unavailable on this device.');
    }
  }, [facingMode, stream]);

  useEffect(() => {
    if (isOpen) {
      setCapturedFile(null);
      setCapturedPreviewUrl(null);
      setDistanceStatus('searching');
      startCamera();
    } else {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      if (capturedPreviewUrl) {
        URL.revokeObjectURL(capturedPreviewUrl);
        setCapturedPreviewUrl(null);
      }
      setCapturedFile(null);
      setDistanceStatus('searching');
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  // Real-time frame proximity & sharpness analyzer (runs every 200ms)
  useEffect(() => {
    if (!isOpen || capturedFile || !hasPermission) return;

    if (!analysisCanvasRef.current) {
      const c = document.createElement('canvas');
      c.width = 160;
      c.height = 120;
      analysisCanvasRef.current = c;
    }
    const aCanvas = analysisCanvasRef.current;
    const aCtx = aCanvas.getContext('2d', { willReadFrequently: true });
    if (!aCtx) return;

    const intervalId = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || video.videoWidth === 0) return;

      aCtx.drawImage(video, 0, 0, 160, 120);
      const imgData = aCtx.getImageData(0, 0, 160, 120);
      const data = imgData.data;

      // Grayscale conversion
      const gray = new Uint8Array(160 * 120);
      for (let i = 0, j = 0; i < data.length; i += 4, j++) {
        gray[j] = (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) >> 8;
      }

      // Compute gradient energy and edge bounding span
      let edgeCount = 0;
      let minX = 160, maxX = 0, minY = 120, maxY = 0;
      let sumGradCenter = 0;
      let centerCount = 0;

      // Skip 2px margin around edges to eliminate frame borders
      for (let y = 2; y < 118; y++) {
        const row = y * 160;
        for (let x = 2; x < 158; x++) {
          const idx = row + x;
          const gx = Math.abs(gray[idx + 1] - gray[idx - 1]);
          const gy = Math.abs(gray[idx + 160] - gray[idx - 160]);
          const mag = gx + gy;

          if (mag > 28) {
            edgeCount++;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }

          // Center region focus calculation (middle 50%)
          if (x >= 40 && x <= 120 && y >= 30 && y <= 90) {
            sumGradCenter += mag;
            centerCount++;
          }
        }
      }

      // If very few edges, commodity is not yet aligned
      if (edgeCount < 70) {
        setDistanceStatus('searching');
        setDistanceProgress(50);
        return;
      }

      const spanX = (maxX - minX) / 160;
      const spanY = (maxY - minY) / 120;
      const coverage = Math.max(spanX, spanY);
      const avgCenterSharpness = centerCount > 0 ? sumGradCenter / centerCount : 0;

      // Proximity heuristics:
      // Coverage < 0.35 => Too far away (text will be illegible)
      // Coverage > 0.88 or bleeding onto outer edges => Too close (edges clipped)
      // Coverage 0.35 - 0.88 with good sharpness => Ideal distance
      if (coverage < 0.36) {
        setDistanceStatus('too_far');
        setDistanceProgress(Math.max(10, Math.round(coverage * 80)));
      } else if (coverage > 0.88 || minX <= 3 || maxX >= 156 || minY <= 3 || maxY >= 116) {
        setDistanceStatus('too_close');
        setDistanceProgress(Math.min(95, Math.round(coverage * 100)));
      } else {
        if (avgCenterSharpness < 12) {
          setDistanceStatus('blurry');
          setDistanceProgress(Math.round(coverage * 100));
        } else {
          setDistanceStatus('optimal');
          setDistanceProgress(Math.round(coverage * 100));
        }
      }
    }, 200);

    return () => clearInterval(intervalId);
  }, [isOpen, capturedFile, hasPermission]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const url = URL.createObjectURL(blob);
        setCapturedFile(file);
        setCapturedPreviewUrl(url);
      }
    }, 'image/jpeg', 0.92);
  };

  const handleFilePicked = (file: File) => {
    const url = URL.createObjectURL(file);
    setCapturedFile(file);
    setCapturedPreviewUrl(url);
  };

  const handleConfirmDirectScan = () => {
    if (capturedFile) {
      onCapture(capturedFile);
      onClose();
    }
  };

  const handleConfirmMeasure = () => {
    if (capturedFile) {
      if (onMeasure) {
        onMeasure(capturedFile);
      } else {
        onCapture(capturedFile);
      }
      onClose();
    }
  };

  const handleRetake = () => {
    if (capturedPreviewUrl) {
      URL.revokeObjectURL(capturedPreviewUrl);
      setCapturedPreviewUrl(null);
    }
    setCapturedFile(null);
    startCamera();
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-between p-4 animate-in fade-in duration-200">
      {/* Top Controls Bar */}
      <div className="w-full max-w-md flex items-center justify-between text-white z-10 pt-2">
        <span className="text-sm font-semibold tracking-wide flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          Align Product Label
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Main Viewfinder Area */}
      <div className="relative w-full max-w-md flex-1 my-4 flex items-center justify-center overflow-hidden rounded-2xl bg-slate-900 border border-white/10">
        {capturedPreviewUrl ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-black/80 p-2">
            <img
              src={capturedPreviewUrl}
              alt="Captured product"
              className="max-h-full max-w-full object-contain rounded-xl shadow-md"
            />
            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-semibold text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Photo Captured
            </div>
          </div>
        ) : hasPermission === false ? (
          <div className="text-center px-6 py-8 text-white space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            </div>
            <p className="text-sm text-slate-300">{errorMessage}</p>
            <div>
              <label className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg cursor-pointer">
                Select from Device Files
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/*"
                  capture="environment"
                  tabIndex={-1}
                  style={{
                    position: 'fixed',
                    top: '-9999px',
                    left: '-9999px',
                    opacity: 0,
                    width: '1px',
                    height: '1px',
                    pointerEvents: 'none',
                  }}
                  onClick={(e) => {
                    (e.target as HTMLInputElement).value = '';
                  }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      handleFilePicked(f);
                    }
                  }}
                />
              </label>
            </div>
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
            {/* Real-time Distance & Proximity Framing Overlay */}
            <div
              className={`absolute inset-6 sm:inset-8 border-2 border-dashed rounded-2xl pointer-events-none flex flex-col justify-between p-3 transition-colors duration-200 ${
                distanceStatus === 'optimal'
                  ? 'border-emerald-400/80 bg-emerald-500/5'
                  : distanceStatus === 'too_far' || distanceStatus === 'too_close'
                  ? 'border-amber-400/80 bg-amber-500/5'
                  : distanceStatus === 'blurry'
                  ? 'border-amber-400/60'
                  : 'border-white/50'
              }`}
            >
              {/* Top Row: Brackets + Proximity Guidance Pill */}
              <div className="flex items-start justify-between">
                <span
                  className={`w-6 h-6 border-t-4 border-l-4 -mt-2 -ml-2 rounded-tl-sm transition-colors duration-200 ${
                    distanceStatus === 'optimal'
                      ? 'border-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                      : distanceStatus === 'too_far' || distanceStatus === 'too_close'
                      ? 'border-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                      : 'border-blue-400'
                  }`}
                />

                {/* Top Distance Gauge Pill */}
                <div className="flex flex-col items-center gap-1">
                  {distanceStatus === 'optimal' ? (
                    <div className="bg-emerald-600/95 text-white px-3.5 py-1 rounded-full text-xs font-bold shadow-lg shadow-emerald-600/40 border border-emerald-300 flex items-center gap-1.5 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-white" />
                      <span>✓ Ideal Distance — Hold Steady</span>
                    </div>
                  ) : distanceStatus === 'too_far' ? (
                    <div className="bg-amber-600/95 text-white px-3.5 py-1 rounded-full text-xs font-bold shadow-lg shadow-amber-600/40 border border-amber-300 flex items-center gap-1.5">
                      <span>🔍 Too Far — Move Phone Closer</span>
                    </div>
                  ) : distanceStatus === 'too_close' ? (
                    <div className="bg-amber-600/95 text-white px-3.5 py-1 rounded-full text-xs font-bold shadow-lg shadow-amber-600/40 border border-amber-300 flex items-center gap-1.5">
                      <span>↔ Too Close — Move Phone Back</span>
                    </div>
                  ) : distanceStatus === 'blurry' ? (
                    <div className="bg-amber-600/95 text-white px-3.5 py-1 rounded-full text-xs font-bold shadow-lg shadow-amber-600/40 border border-amber-300 flex items-center gap-1.5">
                      <span>📷 Blurry — Hold Steady</span>
                    </div>
                  ) : (
                    <div className="bg-black/60 backdrop-blur-xs text-white/90 px-3 py-1 rounded-full text-xs font-medium border border-white/20">
                      <span>Align Product Label</span>
                    </div>
                  )}

                  {/* 3-Point Proximity Bar */}
                  <div className="w-36 bg-black/60 backdrop-blur-xs px-2 py-1 rounded-full border border-white/10 flex items-center justify-between text-[9px] font-semibold text-slate-300">
                    <span className={distanceStatus === 'too_far' ? 'text-amber-300 font-bold' : 'text-slate-500'}>
                      Far
                    </span>
                    <span className={distanceStatus === 'optimal' ? 'text-emerald-300 font-bold' : 'text-slate-500'}>
                      ● Ideal
                    </span>
                    <span className={distanceStatus === 'too_close' ? 'text-amber-300 font-bold' : 'text-slate-500'}>
                      Close
                    </span>
                  </div>
                </div>

                <span
                  className={`w-6 h-6 border-t-4 border-r-4 -mt-2 -mr-2 rounded-tr-sm transition-colors duration-200 ${
                    distanceStatus === 'optimal'
                      ? 'border-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                      : distanceStatus === 'too_far' || distanceStatus === 'too_close'
                      ? 'border-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                      : 'border-blue-400'
                  }`}
                />
              </div>

              {/* Bottom Instructions / Subtitle */}
              <div className="flex items-end justify-between">
                <span
                  className={`w-6 h-6 border-b-4 border-l-4 -mb-2 -ml-2 rounded-bl-sm transition-colors duration-200 ${
                    distanceStatus === 'optimal'
                      ? 'border-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                      : distanceStatus === 'too_far' || distanceStatus === 'too_close'
                      ? 'border-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                      : 'border-blue-400'
                  }`}
                />

                <p className="text-center text-[11px] text-white/80 bg-black/50 backdrop-blur-xs py-0.5 px-3 rounded-full mx-auto self-center">
                  Keep MRP, Net Qty & Dates inside frame
                </p>

                <span
                  className={`w-6 h-6 border-b-4 border-r-4 -mb-2 -mr-2 rounded-br-sm transition-colors duration-200 ${
                    distanceStatus === 'optimal'
                      ? 'border-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                      : distanceStatus === 'too_far' || distanceStatus === 'too_close'
                      ? 'border-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                      : 'border-blue-400'
                  }`}
                />
              </div>
            </div>
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Bottom Shutter or Choice Action Bar */}
      {capturedFile ? (
        <div className="w-full max-w-md flex flex-col gap-2.5 pb-6 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRetake}
              className="flex-1 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors cursor-pointer text-center"
            >
              ↺ Retake
            </button>
            <button
              type="button"
              onClick={handleConfirmDirectScan}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer text-center"
            >
              Direct Scan
            </button>
          </div>
          <button
            type="button"
            onClick={handleConfirmMeasure}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>📏 Measure PDP & Scan</span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">Recommended</span>
          </button>
        </div>
      ) : (
        <div className="w-full max-w-md flex items-center justify-around pb-6 pt-2">
          {/* Flip Camera Button */}
          <button
            type="button"
            onClick={toggleFacingMode}
            className="p-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Switch Camera"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 10c0-4.418-3.582-8-8-8s-8 3.582-8 8c0 2.21 0.895 4.21 2.343 5.657L4 18h6v-6l-2.257 2.257C6.671 13.186 6 11.686 6 10c0-3.314 2.686-6 6-6s6 2.686 6 6c0 1.686-0.671 3.186-1.743 4.257L17.7 15.7A7.95 7.95 0 0 0 20 10z" />
            </svg>
          </button>

          {/* Big Circular Capture Shutter Button with distance-reactive styling */}
          <button
            type="button"
            onClick={handleCapture}
            className={`w-18 h-18 rounded-full border-4 p-1 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
              distanceStatus === 'optimal'
                ? 'border-emerald-400 bg-emerald-500/30 ring-4 ring-emerald-500/40 shadow-emerald-500/40'
                : 'border-white bg-white/20 hover:bg-white/40'
            }`}
            title="Capture Photo"
          >
            <div
              className={`w-14 h-14 rounded-full transition-colors ${
                distanceStatus === 'optimal' ? 'bg-emerald-300' : 'bg-white'
              }`}
            />
          </button>

          {/* Gallery / File Picker button */}
          <label className="p-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer" title="Pick from Gallery">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/*"
              tabIndex={-1}
              style={{
                position: 'fixed',
                top: '-9999px',
                left: '-9999px',
                opacity: 0,
                width: '1px',
                height: '1px',
                pointerEvents: 'none',
              }}
              onClick={(e) => {
                (e.target as HTMLInputElement).value = '';
              }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  handleFilePicked(f);
                }
              }}
            />
          </label>
        </div>
      )}
    </div>
  );
}

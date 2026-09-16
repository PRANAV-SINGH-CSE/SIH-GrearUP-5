'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';

export interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (primaryFile: File, additionalFiles?: File[]) => void;
  onMeasure?: (primaryFile: File, additionalFiles?: File[]) => void;
}

export interface CapturedPanelSlot {
  file: File;
  previewUrl: string;
  label: string;
}

export const DEFAULT_PANEL_LABELS = [
  'Front PDP (Brand & Qty)',
  'Back Panel (Mfg & Specs)',
  'Side / MRP & Dates',
];

export type DistanceStatus = 'too_far' | 'too_close' | 'optimal' | 'blurry' | 'searching';

/**
 * Detects and selects the device ID of the phone's primary 1x main camera,
 * strictly avoiding ultra-wide (0.5x), macro, depth, and telephoto sensors.
 */
async function selectMainWideCameraDeviceId(): Promise<string | null> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
    return null;
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((d) => d.kind === 'videoinput');
    if (videoDevices.length <= 1) return videoDevices[0]?.deviceId || null;

    // Filter out front/user/selfie cameras
    const backCameras = videoDevices.filter((d) => {
      const label = (d.label || '').toLowerCase();
      return !label.includes('front') && !label.includes('user') && !label.includes('selfie');
    });

    if (backCameras.length === 0) return null;

    // Score devices to identify the primary 1x main camera
    const scored = backCameras.map((device) => {
      const label = (device.label || '').toLowerCase();
      let score = 0;

      // DISQUALIFY ultra-wide, 0.5x, macro, depth sensors
      if (label.includes('ultra') || label.includes('0.5') || label.includes('0.6')) {
        score -= 200;
      }
      if (label.includes('macro') || label.includes('depth') || label.includes('tof')) {
        score -= 200;
      }
      if (label.includes('tele') || label.includes('zoom') || label.includes('3x') || label.includes('5x')) {
        score -= 50;
      }

      // Heavily prioritize main, primary, standard, camera2 0, or back 0
      if (label.includes('main') || label.includes('primary') || label.includes('standard')) {
        score += 80;
      }
      if (label.includes('camera2 0') || label.includes('camera 0') || label.includes('back 0') || label.includes('rear 0')) {
        score += 70;
      }
      // "Wide Angle Camera" without "Ultra" is iOS/Android standard 1x camera
      if (label.includes('wide') && !label.includes('ultra')) {
        score += 40;
      }
      if (label.includes('back') || label.includes('rear') || label.includes('environment')) {
        score += 20;
      }

      return { device, score };
    });

    scored.sort((a, b) => b.score - a.score);

    if (scored[0] && scored[0].score > -100) {
      return scored[0].device.deviceId;
    }
    return backCameras[0].deviceId;
  } catch (err) {
    console.warn('Could not enumerate camera devices:', err);
    return null;
  }
}

export function CameraModal({ isOpen, onClose, onCapture, onMeasure }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [slots, setSlots] = useState<CapturedPanelSlot[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [activeCameraLabel, setActiveCameraLabel] = useState<string>('1x Main Lens');
  const [currentZoom, setCurrentZoom] = useState<number>(1.0);
  const [supportedZoom, setSupportedZoom] = useState<{ min: number; max: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Real-time distance and sharpness assistance
  const [distanceStatus, setDistanceStatus] = useState<DistanceStatus>('searching');
  const [distanceProgress, setDistanceProgress] = useState<number>(50);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const smoothedProgressRef = useRef<number>(50);
  const lastDistanceStatusRef = useRef<DistanceStatus>('searching');

  const applyZoom = useCallback(async (targetZoom: number) => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track || !track.applyConstraints) return;

    try {
      await track.applyConstraints({
        advanced: [{ zoom: targetZoom } as any],
      });
      setCurrentZoom(targetZoom);
    } catch (e) {
      console.warn('Could not apply zoom:', e);
    }
  }, [stream]);

  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setErrorMessage(null);

      let newStream: MediaStream;

      if (facingMode === 'environment') {
        const preferredDeviceId = await selectMainWideCameraDeviceId();
        if (preferredDeviceId) {
          try {
            newStream = await navigator.mediaDevices.getUserMedia({
              video: {
                deviceId: { exact: preferredDeviceId },
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              },
            });
          } catch (deviceErr) {
            console.warn('Direct deviceId access failed, falling back to facingMode:', deviceErr);
            newStream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: { ideal: 'environment' },
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              },
            });
          }
        } else {
          newStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
          });
        }
      } else {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
      }

      // Inspect track capabilities: Force zoom to 1.0x (main camera) and enable continuous autofocus
      const track = newStream.getVideoTracks()[0];
      if (track) {
        const label = track.label || '';
        if (facingMode === 'environment') {
          setActiveCameraLabel('1x Main Lens');
        } else {
          setActiveCameraLabel('Front Camera');
        }

        if (track.getCapabilities) {
          const capabilities = track.getCapabilities() as any;
          const advancedConstraints: any = {};

          // If device has multi-camera zoom (e.g. 0.5x ultra-wide to 10x):
          // FORCE zoom to 1.0x so it never defaults to 0.5x ultra-wide!
          if (capabilities.zoom) {
            const minZ = capabilities.zoom.min || 1.0;
            const maxZ = capabilities.zoom.max || 1.0;
            setSupportedZoom({ min: minZ, max: maxZ });
            const mainZoom = Math.min(maxZ, Math.max(1.0, minZ));
            advancedConstraints.zoom = mainZoom;
            setCurrentZoom(mainZoom);
          }

          if (
            capabilities.focusMode &&
            Array.isArray(capabilities.focusMode) &&
            capabilities.focusMode.includes('continuous')
          ) {
            advancedConstraints.focusMode = 'continuous';
          }

          if (Object.keys(advancedConstraints).length > 0 && track.applyConstraints) {
            try {
              await track.applyConstraints({ advanced: [advancedConstraints] });
            } catch (zoomErr) {
              console.warn('Could not apply advanced lens constraints:', zoomErr);
            }
          }
        }
      }

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
      setSlots([]);
      setPreviewIndex(null);
      setIsSubmitting(false);
      setDistanceStatus('optimal');
      lastDistanceStatusRef.current = 'optimal';
      smoothedProgressRef.current = 50;
      setDistanceProgress(50);
      startCamera();
    } else {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      setSlots((prev) => {
        prev.forEach((s) => {
          if (s.previewUrl) URL.revokeObjectURL(s.previewUrl);
        });
        return [];
      });
      setPreviewIndex(null);
      setIsSubmitting(false);
      setDistanceStatus('searching');
      lastDistanceStatusRef.current = 'searching';
      smoothedProgressRef.current = 50;
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  // Real-time dynamic distance & sharpness analyzer (runs every 120ms with tolerant AI auto-approximation)
  useEffect(() => {
    if (!isOpen || previewIndex !== null || !hasPermission) return;

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

      // Fast grayscale conversion
      const gray = new Uint8Array(160 * 120);
      for (let i = 0, j = 0; i < data.length; i += 4, j++) {
        gray[j] = (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) >> 8;
      }

      // Build 1D histograms of edge coordinates across the frame
      const histX = new Int32Array(160);
      const histY = new Int32Array(120);
      let totalEdges = 0;
      let centerEdges = 0;
      let sumGradCenter = 0;

      for (let y = 3; y < 117; y++) {
        const row = y * 160;
        const isYCenter = y >= 15 && y <= 105;
        for (let x = 3; x < 157; x++) {
          const idx = row + x;
          const gx = Math.abs(gray[idx + 1] - gray[idx - 1]);
          const gy = Math.abs(gray[idx + 160] - gray[idx - 160]);
          const mag = gx + gy;

          if (mag > 18) {
            histX[x]++;
            histY[y]++;
            totalEdges++;

            if (isYCenter && x >= 20 && x <= 140) {
              centerEdges++;
              sumGradCenter += mag;
            }
          }
        }
      }

      // 1. Scene completely blank or pointing into void
      if (totalEdges < 18 || centerEdges < 6) {
        lastDistanceStatusRef.current = 'searching';
        setDistanceStatus('searching');
        smoothedProgressRef.current = smoothedProgressRef.current * 0.7 + 50 * 0.3;
        setDistanceProgress(Math.round(smoothedProgressRef.current));
        return;
      }

      const avgCenterSharpness = sumGradCenter / Math.max(1, centerEdges);

      // 2. Severe blur detection (lenient threshold so standard mobile cameras stay green)
      if (avgCenterSharpness < 2.4) {
        lastDistanceStatusRef.current = 'blurry';
        setDistanceStatus('blurry');
        smoothedProgressRef.current = smoothedProgressRef.current * 0.7 + 50 * 0.3;
        setDistanceProgress(Math.round(smoothedProgressRef.current));
        return;
      }

      // 3. Compute effective horizontal & vertical spatial span using 10th to 90th percentiles
      let countX = 0;
      let p10X = 3, p90X = 156;
      const target10X = totalEdges * 0.10;
      const target90X = totalEdges * 0.90;

      for (let x = 3; x < 157; x++) {
        countX += histX[x];
        if (countX >= target10X && p10X === 3) p10X = x;
        if (countX >= target90X) {
          p90X = x;
          break;
        }
      }

      let countY = 0;
      let p10Y = 3, p90Y = 116;
      const target10Y = totalEdges * 0.10;
      const target90Y = totalEdges * 0.90;

      for (let y = 3; y < 117; y++) {
        countY += histY[y];
        if (countY >= target10Y && p10Y === 3) p10Y = y;
        if (countY >= target90Y) {
          p90Y = y;
          break;
        }
      }

      const spanX = (p90X - p10X) / 160;
      const spanY = (p90Y - p10Y) / 120;
      const subjectSpan = spanX * 0.55 + spanY * 0.45;

      // Map subjectSpan into a 0 - 100 distance score
      const rawProgress = Math.min(95, Math.max(5, ((subjectSpan - 0.18) / 0.62) * 100));

      // Responsive Exponential Moving Average smoothing
      smoothedProgressRef.current = smoothedProgressRef.current * 0.4 + rawProgress * 0.6;
      const currentProgress = Math.round(smoothedProgressRef.current);
      setDistanceProgress(currentProgress);

      // Lenient Approximation with Hysteresis (once optimal, stays green across normal hand motion)
      const wasOptimal = lastDistanceStatusRef.current === 'optimal';
      let nextStatus: DistanceStatus = 'optimal';

      if (wasOptimal) {
        if (currentProgress < 12) {
          nextStatus = 'too_far';
        } else if (currentProgress > 92) {
          nextStatus = 'too_close';
        } else {
          nextStatus = 'optimal';
        }
      } else {
        if (currentProgress < 18) {
          nextStatus = 'too_far';
        } else if (currentProgress > 88) {
          nextStatus = 'too_close';
        } else {
          nextStatus = 'optimal';
        }
      }

      lastDistanceStatusRef.current = nextStatus;
      setDistanceStatus(nextStatus);
    }, 120);

    return () => clearInterval(intervalId);
  }, [isOpen, previewIndex, hasPermission]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    if (slots.length >= 3) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(50);
      } catch (_) {}
    }

    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 140);

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const onBlobReady = (blob: Blob | null) => {
      const idx = slots.length;
      const label = DEFAULT_PANEL_LABELS[idx] || `Panel ${idx + 1}`;

      if (blob) {
        const file = new File([blob], `scan_panel_${idx + 1}_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const url = URL.createObjectURL(blob);
        const newSlot: CapturedPanelSlot = { file, previewUrl: url, label };
        const updated = [...slots, newSlot];
        setSlots(updated);
        setPreviewIndex(updated.length - 1);
      } else {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        fetch(dataUrl)
          .then((r) => r.blob())
          .then((b) => {
            const file = new File([b], `scan_panel_${idx + 1}_${Date.now()}.jpg`, { type: 'image/jpeg' });
            const newSlot: CapturedPanelSlot = { file, previewUrl: dataUrl, label };
            const updated = [...slots, newSlot];
            setSlots(updated);
            setPreviewIndex(updated.length - 1);
          })
          .catch(() => {});
      }
    };

    try {
      canvas.toBlob(onBlobReady, 'image/jpeg', 0.92);
    } catch (_) {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const idx = slots.length;
      const label = DEFAULT_PANEL_LABELS[idx] || `Panel ${idx + 1}`;
      fetch(dataUrl)
        .then((r) => r.blob())
        .then((b) => {
          const file = new File([b], `scan_panel_${idx + 1}_${Date.now()}.jpg`, { type: 'image/jpeg' });
          const newSlot: CapturedPanelSlot = { file, previewUrl: dataUrl, label };
          const updated = [...slots, newSlot];
          setSlots(updated);
          setPreviewIndex(updated.length - 1);
        })
        .catch(() => {});
    }
  };

  const handleFilesPicked = (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    const remainingSlots = Math.max(0, 3 - slots.length);
    const filesToAdd = files.slice(0, remainingSlots);

    const newSlots: CapturedPanelSlot[] = filesToAdd.map((file, i) => {
      const idx = slots.length + i;
      return {
        file,
        previewUrl: URL.createObjectURL(file),
        label: DEFAULT_PANEL_LABELS[idx] || `Panel ${idx + 1}`,
      };
    });

    const updated = [...slots, ...newSlots];
    setSlots(updated);
    setPreviewIndex(updated.length - 1);
  };

  const handleRemoveSlot = (indexToRemove: number) => {
    const target = slots[indexToRemove];
    if (target?.previewUrl) {
      URL.revokeObjectURL(target.previewUrl);
    }
    const remaining = slots.filter((_, i) => i !== indexToRemove);
    const relabeled = remaining.map((s, i) => ({
      ...s,
      label: DEFAULT_PANEL_LABELS[i] || `Panel ${i + 1}`,
    }));
    setSlots(relabeled);
    if (relabeled.length === 0) {
      setPreviewIndex(null);
    } else {
      setPreviewIndex(Math.min(indexToRemove, relabeled.length - 1));
    }
  };

  const handleConfirmDirectScan = () => {
    if (slots.length > 0 && !isSubmitting) {
      setIsSubmitting(true);
      const primary = slots[0].file;
      const additional = slots.slice(1).map((s) => s.file);
      onCapture(primary, additional.length > 0 ? additional : undefined);
      onClose();
    }
  };

  const handleConfirmMeasure = () => {
    if (slots.length > 0 && !isSubmitting) {
      setIsSubmitting(true);
      const primary = slots[0].file;
      const additional = slots.slice(1).map((s) => s.file);
      if (onMeasure) {
        onMeasure(primary, additional.length > 0 ? additional : undefined);
      } else {
        onCapture(primary, additional.length > 0 ? additional : undefined);
      }
      onClose();
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-between pt-[max(3rem,env(safe-area-inset-top,0px))] pb-[max(2.25rem,env(safe-area-inset-bottom,0px))] px-4 animate-in fade-in duration-200">
      {/* Top Controls Bar */}
      <div className="w-full max-w-md flex items-center justify-between text-white z-10 pt-1 pb-1">
        <span className="text-sm font-semibold tracking-wide flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          Packaging Scanner (Up to 3 Angles)
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

      {/* 3-Panel Multi-Capture Strip (Front PDP, Back Info, Side / MRP) */}
      <div className="w-full max-w-md grid grid-cols-3 gap-2 px-1 py-1.5 z-10">
        {[0, 1, 2].map((idx) => {
          const slot = slots[idx];
          const isCurrentPreview = previewIndex === idx;
          const isLiveTarget = previewIndex === null && slots.length === idx;
          const shortNames = ['1. Front PDP', '2. Back Panel', '3. Side / MRP'];

          return (
            <div
              key={idx}
              onClick={() => {
                if (slot) {
                  setPreviewIndex(idx);
                } else if (slots.length === idx) {
                  setPreviewIndex(null);
                }
              }}
              className={`relative flex flex-col items-center justify-center py-1.5 px-2 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer select-none ${
                isCurrentPreview
                  ? 'bg-emerald-600/30 border-emerald-400 text-white shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400'
                  : slot
                  ? 'bg-slate-800/80 border-white/20 text-slate-200 hover:bg-slate-700/80'
                  : isLiveTarget
                  ? 'bg-blue-600/25 border-blue-400/80 text-blue-200 animate-pulse ring-1 ring-blue-400/50'
                  : 'bg-black/40 border-white/10 text-white/40 cursor-default'
              }`}
            >
              <div className="flex items-center gap-1 w-full justify-between">
                <span className="truncate text-[10px] font-bold">
                  {slot ? `✓ ${shortNames[idx]}` : isLiveTarget ? `● ${shortNames[idx]}` : shortNames[idx]}
                </span>
                {slot && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveSlot(idx);
                    }}
                    className="w-4 h-4 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center text-[10px] cursor-pointer"
                    title={`Remove ${shortNames[idx]}`}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Viewfinder Area */}
      <div
        className="relative w-full max-w-md flex-1 my-4 flex items-center justify-center overflow-hidden rounded-2xl bg-slate-900 border border-white/10 cursor-pointer"
        onClick={() => {
          if (previewIndex === null && hasPermission && slots.length < 3) {
            handleCapture();
          }
        }}
      >
        {/* Flash Effect on Snapshot */}
        {isFlashing && (
          <div className="absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-150" />
        )}

        {previewIndex !== null && slots[previewIndex] ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-black/80 p-2">
            <img
              src={slots[previewIndex].previewUrl}
              alt={slots[previewIndex].label}
              className="max-h-full max-w-full object-contain rounded-xl shadow-md"
            />
            <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-semibold text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {slots[previewIndex].label}
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
                Select from Device Files (Up to 3)
                <input
                  type="file"
                  multiple
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
                    if (e.target.files) {
                      handleFilesPicked(e.target.files);
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
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      <span>✓ Ready to Scan — Distance OK</span>
                    </div>
                  ) : distanceStatus === 'too_far' ? (
                    <div className="bg-amber-600/95 text-white px-3.5 py-1 rounded-full text-xs font-bold shadow-lg shadow-amber-600/40 border border-amber-300 flex items-center gap-1.5">
                      <span>🔍 Move Phone Closer</span>
                    </div>
                  ) : distanceStatus === 'too_close' ? (
                    <div className="bg-amber-600/95 text-white px-3.5 py-1 rounded-full text-xs font-bold shadow-lg shadow-amber-600/40 border border-amber-300 flex items-center gap-1.5">
                      <span>↔ Move Phone Back Slightly</span>
                    </div>
                  ) : distanceStatus === 'blurry' ? (
                    <div className="bg-amber-600/95 text-white px-3.5 py-1 rounded-full text-xs font-bold shadow-lg shadow-amber-600/40 border border-amber-300 flex items-center gap-1.5">
                      <span>📷 Hold Steady</span>
                    </div>
                  ) : (
                    <div className="bg-emerald-700/80 backdrop-blur-xs text-white px-3 py-1 rounded-full text-xs font-medium border border-emerald-400/30 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Auto-Approximating Package</span>
                    </div>
                  )}

                  {/* Real-time Dynamic Proximity Slider Meter */}
                  <div className="w-48 bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 flex flex-col gap-1 shadow-lg">
                    <div className="flex items-center justify-between text-[9px] font-bold tracking-wider">
                      <span className={`transition-colors duration-150 ${distanceStatus === 'too_far' ? 'text-amber-300 font-black drop-shadow-[0_0_4px_rgba(251,191,36,0.8)]' : 'text-slate-400'}`}>
                        Far
                      </span>
                      <span className={`transition-colors duration-150 flex items-center gap-1 ${distanceStatus === 'optimal' ? 'text-emerald-300 font-black drop-shadow-[0_0_4px_rgba(52,211,153,0.8)]' : 'text-emerald-400/80 font-bold'}`}>
                        {distanceStatus === 'optimal' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping" />}
                        ● Ready
                      </span>
                      <span className={`transition-colors duration-150 ${distanceStatus === 'too_close' ? 'text-amber-300 font-black drop-shadow-[0_0_4px_rgba(251,191,36,0.8)]' : 'text-slate-400'}`}>
                        Close
                      </span>
                    </div>

                    {/* Smooth Continuous Track with Tolerant Target Zone */}
                    <div className="relative w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                      {/* Generous Ready Zone (18% to 88%) */}
                      <div className="absolute left-[18%] right-[12%] inset-y-0 bg-emerald-500/40 rounded-full" />
                      {/* Live Sliding Indicator Dot */}
                      <div
                        className={`absolute top-0 bottom-0 w-3 -ml-1.5 rounded-full transition-all duration-100 shadow-sm ${
                          distanceStatus === 'optimal'
                            ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)]'
                            : distanceStatus === 'too_far' || distanceStatus === 'too_close'
                            ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,1)]'
                            : 'bg-white/60'
                        }`}
                        style={{ left: `${distanceProgress}%` }}
                      />
                    </div>
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

                <p className="text-center text-[11px] text-white/90 bg-black/60 backdrop-blur-xs py-0.5 px-3 rounded-full mx-auto self-center flex items-center gap-1.5 border border-white/10 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold">{activeCameraLabel}</span>
                  <span className="text-white/40">•</span>
                  <span>Keep MRP & Qty in frame</span>
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
      {previewIndex !== null && slots[previewIndex] ? (
        <div className="w-full max-w-md flex flex-col gap-2.5 pb-2 pt-2 z-10">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleRemoveSlot(previewIndex)}
              className="flex-1 py-3 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
            >
              <span>↺ Retake Panel {previewIndex + 1}</span>
            </button>
            {slots.length < 3 && (
              <button
                type="button"
                onClick={() => setPreviewIndex(null)}
                className="flex-1 py-3 px-3 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                <span>+ Add Panel {slots.length + 1}</span>
                <span className="text-[10px] text-blue-200">({3 - slots.length} left)</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleConfirmDirectScan}
              disabled={isSubmitting}
              className="flex-1 py-3.5 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Scanning...' : `Direct Scan (${slots.length} ${slots.length === 1 ? 'Panel' : 'Panels'})`}
            </button>
            <button
              type="button"
              onClick={handleConfirmMeasure}
              disabled={isSubmitting}
              className="flex-1 py-3.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>📏 Measure & Scan</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md flex flex-col gap-2 pb-2 pt-1 z-10">
          {slots.length > 0 && (
            <div className="flex items-center justify-between px-3 py-1 bg-black/50 backdrop-blur-xs rounded-lg border border-white/10 text-xs">
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {slots.length} {slots.length === 1 ? 'panel' : 'panels'} captured
              </span>
              <button
                type="button"
                onClick={() => setPreviewIndex(0)}
                className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer underline text-[11px]"
              >
                Review / Done ({slots.length}) →
              </button>
            </div>
          )}

          <div className="flex items-center justify-around">
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
            <div className="flex flex-col items-center gap-1.5 relative">
              {/* Quick 1x Main / 2x Zoom Selector */}
              {facingMode === 'environment' && supportedZoom && supportedZoom.max > 1.2 && (
                <div className="absolute -top-9 flex items-center gap-1 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20 shadow-md z-20">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      applyZoom(1.0);
                    }}
                    className={`px-2 py-0.5 text-[10px] rounded-full transition-all cursor-pointer font-black ${
                      currentZoom <= 1.2
                        ? 'bg-emerald-400 text-black shadow-xs'
                        : 'text-white/70 hover:text-white'
                    }`}
                    title="Force 1x Main Camera"
                  >
                    1x Main
                  </button>
                  {supportedZoom.max >= 2.0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        applyZoom(2.0);
                      }}
                      className={`px-2 py-0.5 text-[10px] rounded-full transition-all cursor-pointer font-bold ${
                        currentZoom >= 1.8
                          ? 'bg-emerald-400 text-black shadow-xs'
                          : 'text-white/70 hover:text-white'
                      }`}
                      title="2x Zoom"
                    >
                      2x
                    </button>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={handleCapture}
                className={`w-20 h-20 rounded-full border-4 p-1 flex items-center justify-center transition-all cursor-pointer shadow-xl active:scale-95 ${
                  distanceStatus === 'optimal'
                    ? 'border-emerald-400 bg-emerald-500/30 ring-4 ring-emerald-500/40 shadow-emerald-500/40 scale-105'
                    : 'border-white bg-white/20 hover:bg-white/40'
                }`}
                title="Capture Photo"
              >
                <div
                  className={`w-15 h-15 rounded-full transition-colors flex items-center justify-center ${
                    distanceStatus === 'optimal' ? 'bg-emerald-300' : 'bg-white'
                  }`}
                >
                  <svg
                    className={`w-7 h-7 ${distanceStatus === 'optimal' ? 'text-emerald-950' : 'text-slate-900'}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
              </button>
              <span
                className={`text-[10px] font-bold tracking-wider uppercase ${
                  distanceStatus === 'optimal' ? 'text-emerald-400' : 'text-white/60'
                }`}
              >
                {slots.length === 0
                  ? 'Capture Front PDP'
                  : slots.length === 1
                  ? 'Capture Back (2/3)'
                  : 'Capture Side (3/3)'}
              </span>
            </div>

            {/* Gallery / File Picker button */}
            <label className="p-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer" title="Pick from Gallery">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <input
                type="file"
                multiple
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
                  if (e.target.files) {
                    handleFilesPicked(e.target.files);
                  }
                }}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

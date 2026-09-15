'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';

export interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export function CameraModal({ isOpen, onClose, onCapture }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      startCamera();
    } else if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

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
        onCapture(file);
        onClose();
      }
    }, 'image/jpeg', 0.92);
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
        {hasPermission === false ? (
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
                      onCapture(f);
                      onClose();
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
            {/* Viewfinder Target Framing Overlay */}
            <div className="absolute inset-8 border-2 border-dashed border-white/60 rounded-xl pointer-events-none flex flex-col justify-between p-2">
              <div className="flex justify-between">
                <span className="w-5 h-5 border-t-4 border-l-4 border-blue-400 -mt-2 -ml-2 rounded-tl-sm" />
                <span className="w-5 h-5 border-t-4 border-r-4 border-blue-400 -mt-2 -mr-2 rounded-tr-sm" />
              </div>
              <p className="text-center text-xs text-white/80 bg-black/40 backdrop-blur-xs py-1 px-3 rounded-full mx-auto self-center">
                Keep MRP, Net Qty & Dates inside frame
              </p>
              <div className="flex justify-between">
                <span className="w-5 h-5 border-b-4 border-l-4 border-blue-400 -mb-2 -ml-2 rounded-bl-sm" />
                <span className="w-5 h-5 border-b-4 border-r-4 border-blue-400 -mb-2 -mr-2 rounded-br-sm" />
              </div>
            </div>
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Bottom Shutter Action Bar */}
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

        {/* Big Circular Capture Shutter Button */}
        <button
          type="button"
          onClick={handleCapture}
          className="w-18 h-18 rounded-full border-4 border-white p-1 flex items-center justify-center bg-white/20 hover:bg-white/40 active:scale-95 transition-all cursor-pointer shadow-lg"
          title="Capture Photo"
        >
          <div className="w-14 h-14 rounded-full bg-white" />
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
                onCapture(f);
                onClose();
              }
            }}
          />
        </label>
      </div>
    </div>
  );
}

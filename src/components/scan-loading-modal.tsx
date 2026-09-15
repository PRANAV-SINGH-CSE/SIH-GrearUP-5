'use client';

import React, { useEffect, useState } from 'react';

export interface ScanLoadingModalProps {
  isOpen: boolean;
  onMinimize?: () => void;
  isMinimized?: boolean;
}

const STEPS = [
  {
    id: 1,
    title: 'Visual Perception & Preprocessing',
    desc: 'Enhancing label resolution and standardizing aspect ratio',
  },
  {
    id: 2,
    title: 'AI Vision & Multimodal Extraction',
    desc: 'Extracting MRP, Net Qty, Dates, FSSAI, Manufacturer & Consumer Care',
  },
  {
    id: 3,
    title: 'LMPC Statutory Verification',
    desc: 'Evaluating Legal Metrology (Packaged Commodities) Rules, 2011',
  },
  {
    id: 4,
    title: 'Generating Audit Report',
    desc: 'Compiling legal clauses, compliance verdict, and recommendations',
  },
];

export function ScanLoadingModal({ isOpen, onMinimize, isMinimized }: ScanLoadingModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(15);

  // Smooth realistic step progression timer
  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      setProgressPercent(15);
      return;
    }

    const t1 = setTimeout(() => {
      setCurrentStepIndex(1);
      setProgressPercent(40);
    }, 1200);

    const t2 = setTimeout(() => {
      setCurrentStepIndex(2);
      setProgressPercent(70);
    }, 2800);

    const t3 = setTimeout(() => {
      setCurrentStepIndex(3);
      setProgressPercent(92);
    }, 4600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Floating Minimized Pill in bottom-right (Desktop) or bottom-center (Mobile)
  if (isMinimized) {
    return (
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div
          onClick={onMinimize}
          className="bg-slate-900/95 text-white border border-blue-500/40 shadow-2xl rounded-2xl p-3 sm:px-4 sm:py-3 flex items-center gap-3 backdrop-blur-md cursor-pointer hover:bg-slate-800 transition-all hover:scale-105"
        >
          {/* Animated Spinner with pulse */}
          <div className="relative w-7 h-7 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping" />
            <div className="w-6 h-6 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
            <div className="absolute w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          </div>

          <div className="text-left pr-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-300">AI Verification Active</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/80 text-blue-200 font-mono">
                {progressPercent}%
              </span>
            </div>
            <p className="text-[11px] text-slate-300 line-clamp-1">
              {STEPS[currentStepIndex].title}
            </p>
          </div>

          <button
            type="button"
            className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            title="Expand modal"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative px-6 pt-6 pb-4 flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <svg className="w-5 h-5 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">CompliScan AI Engine</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                  Live
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Legal Metrology Compliance Audit in Progress
              </p>
            </div>
          </div>

          {/* Minimize / Background Button */}
          {onMinimize && (
            <button
              type="button"
              onClick={onMinimize}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Keep running while browsing"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Background</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="relative p-6 sm:p-7 flex flex-col items-center text-center">
          {/* Animated Scanner Visual Centerpiece */}
          <div className="relative my-2 w-32 h-32 flex items-center justify-center">
            {/* Outer Rotating Glowing Ring */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-blue-400/50 animate-spin [animation-duration:12s]" />
            <div className="absolute inset-2 rounded-full border-2 border-indigo-400/30 animate-spin [animation-duration:8s] [animation-direction:reverse]" />

            {/* Pulsing Core */}
            <div className="absolute inset-4 rounded-3xl bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 backdrop-blur-xs border border-blue-200 flex items-center justify-center shadow-inner overflow-hidden">
              {/* Product Label Silhouette */}
              <svg className="w-12 h-12 text-blue-600/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <line x1="7" y1="8" x2="17" y2="8" />
                <line x1="7" y1="12" x2="13" y2="12" />
                <line x1="7" y1="16" x2="11" y2="16" />
                <path d="M17 14v4M15 16h4" strokeWidth="2" />
              </svg>

              {/* Animated Laser Scanning Beam */}
              <div
                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#38bdf8] pointer-events-none"
                style={{
                  animation: 'laserScan 2.2s ease-in-out infinite alternate',
                }}
              />
            </div>
          </div>

          <style jsx>{`
            @keyframes laserScan {
              0% {
                top: 15%;
                opacity: 0.3;
              }
              50% {
                opacity: 1;
              }
              100% {
                top: 85%;
                opacity: 0.3;
              }
            }
          `}</style>

          {/* Current Stage Headline */}
          <h4 className="mt-3 text-lg font-black text-slate-900 dark:text-white tracking-tight">
            {STEPS[currentStepIndex].title}
          </h4>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 font-medium max-w-sm">
            {STEPS[currentStepIndex].desc}
          </p>

          {/* Progress Bar */}
          <div className="w-full mt-5">
            <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
              <span className="text-slate-500 dark:text-slate-400">Pipeline Execution</span>
              <span className="text-blue-600 dark:text-blue-400 font-mono">{progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 rounded-full transition-all duration-700 ease-out shadow-xs"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Step Sequence List */}
          <div className="w-full mt-6 space-y-2.5 text-left">
            {STEPS.map((step, idx) => {
              const isDone = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div
                  key={step.id}
                  className={`p-2.5 rounded-xl border transition-all flex items-center gap-3 ${
                    isCurrent
                      ? 'bg-blue-50/90 dark:bg-blue-950/70 border-blue-300 dark:border-blue-700 shadow-xs'
                      : isDone
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-slate-700 dark:text-slate-300'
                      : 'bg-slate-50/40 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 opacity-60 text-slate-400'
                  }`}
                >
                  {/* Step Status Icon */}
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition-all ${
                      isDone
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white shadow-xs animate-pulse'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {isDone ? (
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : isCurrent ? (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    ) : (
                      <span>{step.id}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-bold truncate ${
                        isCurrent
                          ? 'text-blue-600 dark:text-blue-300'
                          : isDone
                          ? 'text-slate-800 dark:text-slate-100'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {step.desc}
                    </p>
                  </div>

                  {isCurrent && (
                    <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-300 bg-blue-100/80 dark:bg-blue-900/60 px-2 py-0.5 rounded-full shrink-0 animate-pulse">
                      Processing...
                    </span>
                  )}
                  {isDone && (
                    <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full shrink-0">
                      Verified
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info notice */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>You can switch tabs freely — scanning continues safely in the background.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

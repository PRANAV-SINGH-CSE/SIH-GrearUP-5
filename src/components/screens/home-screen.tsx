'use client';

import React, { useRef } from 'react';
import { HeroIllustration, FarmBiteChipsHeroGraphic, IndianMonumentsSkyline } from '../ui-assets';
import { NavTabId } from '../bottom-nav';

export interface HomeScreenProps {
  onOpenScanningCamera: () => void;
  onImageFileSelected: (file: File) => void;
  onNavigateTab: (tab: NavTabId) => void;
  onOpenGuidelinesModal: () => void;
  onQuickPresetSelect: (presetId: string) => void;
  isProcessing: boolean;
  isVerifiedUser: boolean;
  onRequireAuth: (message: string) => void;
}

const PRESET_OPTIONS = [
  { id: 'COMPLIANT_COMMODITY', label: 'Basmati Rice (Fully Compliant)' },
  { id: 'MISSING_MRP', label: 'Roasted Almonds (Missing MRP)' },
  { id: 'MISSING_NET_QUANTITY', label: 'Sunflower Oil (Missing Net Qty)' },
  { id: 'INVALID_UNIT_SYMBOL', label: 'Turmeric Powder (Invalid Unit "gms")' },
  { id: 'FOOD_PRODUCT_WITH_EXPIRY', label: 'Toned Milk (With Expiry Date)' },
];

export function HomeScreen({
  onOpenScanningCamera,
  onImageFileSelected,
  onNavigateTab,
  onOpenGuidelinesModal,
  onQuickPresetSelect,
  isProcessing,
  isVerifiedUser,
  onRequireAuth,
}: HomeScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenCam = () => {
    if (!isVerifiedUser) {
      onRequireAuth('Verified user sign-in required to capture and scan commodity labels.');
      return;
    }
    onOpenScanningCamera();
  };

  const handleUploadClick = () => {
    if (!isVerifiedUser) {
      onRequireAuth('Verified user sign-in required to upload and scan commodity labels.');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!isVerifiedUser) {
        onRequireAuth('Verified user sign-in required to upload and scan commodity labels.');
        return;
      }
      onImageFileSelected(file);
    }
  };

  return (
    <>
      {/* Hidden file input shared between mobile & desktop */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInput}
      />

      {/* ========================================================================= */}
      {/* 1. DESKTOP VIEW (Visible on lg screens >= 1024px)                          */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex flex-col gap-12 w-full max-w-7xl mx-auto px-6 py-8 animate-in fade-in duration-150">
        {/* Desktop Hero Section */}
        <section className="flex items-center justify-between gap-8 pt-4">
          {/* Left Column: Heading, description, and action buttons */}
          <div className="flex-1 max-w-2xl pr-4">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-5 shadow-2xs">
              <span>For a Fairer and Safer Marketplace</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl xl:text-5xl font-black text-slate-900 leading-[1.15] tracking-tight">
              Check Product Labels.<br />
              Ensure Compliance.<br />
              <span className="text-blue-600">Empower Consumers.</span>
            </h1>

            {/* Descriptive paragraph */}
            <p className="mt-5 text-sm xl:text-base text-slate-600 leading-relaxed max-w-xl font-normal">
              CompliScan uses AI and rule-based verification to check packaged commodity labels under the Legal Metrology (Packaged Commodities) Rules, 2011.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex items-center gap-4">
              {/* Scan Product Label Button */}
              <button
                type="button"
                onClick={handleOpenCam}
                disabled={isProcessing}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer hover:translate-y-[-1px]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <span>Scan Product Label</span>
                <svg className="w-4 h-4 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              {/* Upload Image Button */}
              <button
                type="button"
                onClick={handleUploadClick}
                disabled={isProcessing}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-blue-600 font-bold text-sm border-2 border-blue-200 hover:border-blue-400 shadow-xs transition-all cursor-pointer hover:translate-y-[-1px]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>Upload Image</span>
                <svg className="w-4 h-4 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* Processing Indicator */}
            {isProcessing && (
              <div className="mt-5 inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold animate-pulse">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Processing label perception with Gemini Flash Lite & LMPC compliance verification...</span>
              </div>
            )}
          </div>

          {/* Right Column: Hero Graphic Composition */}
          <div className="flex-1 flex items-center justify-center">
            <FarmBiteChipsHeroGraphic onViewReport={() => onNavigateTab('reports')} />
          </div>
        </section>

        {/* 4 Feature Cards Row */}
        <section className="grid grid-cols-4 gap-6 pt-4">
          {/* Card 1: Fast & Accurate */}
          <div className="rounded-2xl bg-blue-50/50 hover:bg-blue-50/80 border border-blue-100/80 p-6 transition-all shadow-2xs">
            <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1">
              Fast & Accurate
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              AI-powered label extraction with rule-based verification.
            </p>
          </div>

          {/* Card 2: Legal Compliance */}
          <div className="rounded-2xl bg-emerald-50/50 hover:bg-emerald-50/80 border border-emerald-100/80 p-6 transition-all shadow-2xs">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" stroke="#ffffff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1">
              Legal Compliance
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Based on Legal Metrology (Packaged Commodities) Rules, 2011.
            </p>
          </div>

          {/* Card 3: For Everyone */}
          <div className="rounded-2xl bg-amber-50/50 hover:bg-amber-50/80 border border-amber-100/80 p-6 transition-all shadow-2xs">
            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1">
              For Everyone
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Useful for consumers, retailers and enforcement officers.
            </p>
          </div>

          {/* Card 4: Detailed Reports */}
          <div className="rounded-2xl bg-purple-50/50 hover:bg-purple-50/80 border border-purple-100/80 p-6 transition-all shadow-2xs">
            <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" fill="#e9d5ff" />
                <line x1="16" y1="13" x2="8" y2="13" stroke="#ffffff" strokeWidth="1.5" />
                <line x1="16" y1="17" x2="8" y2="17" stroke="#ffffff" strokeWidth="1.5" />
              </svg>
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1">
              Detailed Reports
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Get clear, explainable compliance results.
            </p>
          </div>
        </section>

        {/* Quick Simulation Presets Toolbar */}
        <div className="px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs shadow-2xs">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Simulate Scan Scenarios (Instant Evaluation):</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              onChange={(e) => e.target.value && onQuickPresetSelect(e.target.value)}
              defaultValue=""
              className="bg-white border border-slate-300 text-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden min-w-[280px]"
            >
              <option value="" disabled>Choose test commodity scenario...</option>
              {PRESET_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Monuments Skyline & Slogan Footer */}
        <footer className="pt-4 flex flex-col items-center text-center">
          <IndianMonumentsSkyline className="w-full max-w-4xl h-24 mb-4" />
          <h4 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
            “Compliant Labels. Confident Consumers. A Stronger India.”
          </h4>
          <div className="text-xs text-slate-500 font-medium mt-0.5">
            Department of Legal Metrology
          </div>
          <div className="mt-3 flex items-center justify-center gap-1.5">
            <div className="w-6 h-1 rounded-full bg-[#FF9933]" />
            <div className="w-6 h-1 rounded-full bg-slate-300" />
            <div className="w-6 h-1 rounded-full bg-[#138808]" />
          </div>
        </footer>
      </div>

      {/* ========================================================================= */}
      {/* 2. MOBILE VIEW (Visible on screens < 1024px)                               */}
      {/* ========================================================================= */}
      <div className="lg:hidden flex flex-col gap-5 pb-24 animate-in fade-in duration-150">
        {/* Mobile Hero Section */}
        <div className="pt-4 sm:pt-3 px-1 flex items-start justify-between">
          <div className="flex-1 pr-2">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none text-slate-900">
              Compli<span className="text-blue-600">Scan</span>
            </h1>
            <p className="mt-2 text-sm sm:text-base font-bold text-slate-800">
              Scan. Verify. Stay Compliant.
            </p>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xs">
              AI-powered verification of packaged commodity labels under the Legal Metrology (Packaged Commodities) Rules, 2011.
            </p>
          </div>

          {/* Line art sketch illustration */}
          <HeroIllustration className="w-36 h-36 sm:w-44 sm:h-40" />
        </div>

        {/* Main Scan Product Label Card (Dashed Border) */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-dashed border-blue-200 bg-gradient-to-b from-blue-50/70 to-blue-50/30 p-6 sm:p-8 text-center shadow-xs">
          {/* Centered Large Circular Camera Button */}
          <button
            type="button"
            onClick={handleOpenCam}
            disabled={isProcessing}
            className="group relative mx-auto flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
            title="Open Camera"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-blue-100/90 flex items-center justify-center transition-all group-hover:bg-blue-200/90">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30">
                <svg
                  className="w-7 h-7 sm:w-8 sm:h-8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
            </div>
          </button>

          {/* Title and Subtitle */}
          <h2 className="mt-4 text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            Scan Product Label
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Use your camera to scan or upload an image
          </p>

          {/* Two Buttons: Open Camera & Upload Image */}
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleOpenCam}
              disabled={isProcessing}
              className="w-full sm:w-auto min-w-[150px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span>Open Camera</span>
            </button>

            <button
              type="button"
              onClick={handleUploadClick}
              disabled={isProcessing}
              className="w-full sm:w-auto min-w-[150px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-blue-50/50 text-blue-600 font-semibold text-sm border border-blue-300 shadow-xs transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span>Upload Image</span>
            </button>
          </div>

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold animate-pulse">
              <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Analyzing image with AI compliance engine...
            </div>
          )}
        </div>

        {/* Quick Links (3 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => onNavigateTab('history')}
            className="text-left p-4 rounded-2xl bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-100 transition-colors flex flex-col justify-between group cursor-pointer shadow-2xs"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <svg
                className="w-4 h-4 text-emerald-700 transition-transform group-hover:translate-x-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-1">
                Scan History
              </div>
              <div className="text-xs text-slate-500 mt-0.5 font-medium">
                View your past scans
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('reports')}
            className="text-left p-4 rounded-2xl bg-blue-50/60 hover:bg-blue-50 border border-blue-100 transition-colors flex flex-col justify-between group cursor-pointer shadow-2xs"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-xs">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <svg
                className="w-4 h-4 text-blue-700 transition-transform group-hover:translate-x-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-1">
                Compliance Reports
              </div>
              <div className="text-xs text-slate-500 mt-0.5 font-medium">
                Access and share your reports
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenGuidelinesModal}
            className="text-left p-4 rounded-2xl bg-amber-50/60 hover:bg-amber-50 border border-amber-100 transition-colors flex flex-col justify-between group cursor-pointer shadow-2xs"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
              <svg
                className="w-4 h-4 text-amber-700 transition-transform group-hover:translate-x-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-1">
                Help & Guidelines
              </div>
              <div className="text-xs text-slate-500 mt-0.5 font-medium">
                Learn about label compliance
              </div>
            </div>
          </button>
        </div>

        {/* Quick Test Scenarios Bar */}
        <div className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-slate-700 shrink-0">Sample Preset:</span>
          <select
            onChange={(e) => e.target.value && onQuickPresetSelect(e.target.value)}
            defaultValue=""
            className="bg-white border border-slate-300 text-slate-800 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden w-full max-w-xs"
          >
            <option value="" disabled>Select test scenario to simulate...</option>
            {PRESET_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Bottom Banner Card */}
        <div className="rounded-2xl bg-blue-50/70 border border-blue-100 p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              For a Fairer and Safer Marketplace
            </h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              Empowering consumers, retailers and enforcement officers through technology.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

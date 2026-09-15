'use client';

import React, { useState } from 'react';
import { AppScanItem } from '@/lib/mock-scans';
import { ProductImageThumbnail, DetectedTextBackOfPackGraphic } from '../ui-assets';

export interface ReportScreenProps {
  scan: AppScanItem | null;
  onBack: () => void;
  onDownloadReport?: () => void;
  onScanAnother?: () => void;
  onEditExtracted?: () => void;
}

type ReportTab = 'overview' | 'extracted' | 'rules' | 'evidence';

export function ReportScreen({
  scan,
  onBack,
  onDownloadReport,
  onScanAnother,
  onEditExtracted,
}: ReportScreenProps) {
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [shareToast, setShareToast] = useState(false);
  const [isFullImageModalOpen, setIsFullImageModalOpen] = useState(false);

  if (!scan) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs my-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-slate-900">No Report Selected</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md">
          Please select a scan from History or scan a new product label to view its statutory compliance evaluation.
        </p>
        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            &larr; Go to History
          </button>
          <button
            type="button"
            onClick={onScanAnother || onBack}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Scan a Product
          </button>
        </div>
      </div>
    );
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `CompliScan Report - ${scan.productName}`,
        text: `Compliance assessment for ${scan.productName} (${scan.statusLabel}): ${scan.explanation}`,
        url: window.location.href,
      }).catch(() => {
        // User cancelled or unsupported
      });
    } else {
      // Fallback: Copy link
      navigator.clipboard.writeText(window.location.href);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2500);
    }
  };

  const handleDownload = () => {
    if (onDownloadReport) {
      onDownloadReport();
    } else {
      window.print();
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {shareToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg animate-in fade-in slide-in-from-top-2">
          Link copied to clipboard!
        </div>
      )}

      {/* Full Image Preview Modal */}
      {isFullImageModalOpen && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsFullImageModalOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' || e.key === 'Enter') setIsFullImageModalOpen(false);
          }}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            role="document"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-2xl w-full p-4 shadow-2xl relative"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Scanned Label Image with OCR Bounding Boxes</h3>
              <button
                type="button"
                onClick={() => setIsFullImageModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>
            <div className="py-4 flex justify-center bg-slate-50 rounded-xl mt-3">
              <DetectedTextBackOfPackGraphic className="w-full max-w-md h-auto" />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>Back of pack declaration panel • Detected 8 bounding boxes</span>
              <button
                type="button"
                onClick={() => setIsFullImageModalOpen(false)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DESKTOP VIEW (Visible on >= lg)                                          */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex flex-col gap-6">
        {/* Desktop Top Action Bar (Back, Share, Download, Scan Another) */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back to History</span>
          </button>

          <div className="flex items-center gap-3">
            {/* Share */}
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span>Share</span>
            </button>

            {/* Download PDF */}
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
            >
              <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Download PDF</span>
            </button>

            {/* Scan Another Product */}
            <button
              type="button"
              onClick={onScanAnother || onBack}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                <line x1="7" y1="12" x2="17" y2="12" />
              </svg>
              <span>Scan Another Product</span>
            </button>
          </div>
        </div>

        {/* Desktop Title & Scan ID */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Compliance Report
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-2">
            <span>Scan ID: <strong className="text-slate-700">#{scan.scanIdNumber}</strong></span>
            <span>•</span>
            <span>{scan.scannedAt}</span>
          </p>
        </div>

        {/* 2-Column Desktop Grid Layout */}
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* ========================================================================= */}
          {/* LEFT COLUMN (Col Span 7)                                                 */}
          {/* ========================================================================= */}
          <div className="col-span-12 xl:col-span-7 flex flex-col gap-5">
            {/* Product Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
              <div className="flex items-start gap-4">
                <ProductImageThumbnail
                  productName={scan.productName}
                  imageUrl={scan.imageUrl}
                  className="w-20 h-20 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-black text-slate-900 leading-snug">
                    {scan.productName}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {scan.manufacturer}
                  </p>

                  {/* Badges / Tags */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                      🍱 Food Product
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                      📍 India
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                      ⚖️ {scan.extractedInfo.netQuantity || '52 g'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Box */}
              <div className={`mt-4 p-4 rounded-xl ${
                scan.status === 'COMPLIANT'
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/70 text-emerald-950 dark:text-emerald-100'
                  : scan.status === 'NON_COMPLIANT'
                  ? 'bg-red-50/80 dark:bg-red-950/60 border border-red-200/70 dark:border-red-800/70 text-red-950 dark:text-red-100'
                  : 'bg-amber-50/80 dark:bg-amber-950/60 border border-amber-200/70 dark:border-amber-800/70 text-amber-950 dark:text-amber-100'
              }`}>
                <div className="flex items-center gap-2 mb-1.5">
                  {scan.status === 'COMPLIANT' && (
                    <>
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Compliant</span>
                    </>
                  )}
                  {scan.status === 'NON_COMPLIANT' && (
                    <>
                      <div className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </div>
                      <span className="text-sm font-bold text-red-800 dark:text-red-300">Non-Compliant</span>
                    </>
                  )}
                  {scan.status === 'NEEDS_REVIEW' && (
                    <>
                      <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <line x1="12" y1="8" x2="12" y2="13" />
                          <circle cx="12" cy="17" r="0.75" fill="currentColor" />
                        </svg>
                      </div>
                      <span className="text-sm font-bold text-amber-800 dark:text-amber-300">Needs Review</span>
                    </>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                  {scan.explanation}
                </p>
              </div>
            </div>

            {/* 4 Tabs Bar */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all text-center cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('extracted')}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all text-center cursor-pointer ${
                  activeTab === 'extracted'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Extracted Information
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('rules')}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all text-center cursor-pointer ${
                  activeTab === 'rules'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rule Checks
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('evidence')}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all text-center cursor-pointer ${
                  activeTab === 'evidence'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Images & Evidence
              </button>
            </div>

            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
              <div className="flex flex-col gap-5">
                {/* Compliance Summary */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
                  <h3 className="text-sm font-bold text-slate-900 mb-3.5">
                    Compliance Summary
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="rounded-xl bg-[#EDF9F2] dark:bg-emerald-950/50 dark:border dark:border-emerald-800/50 p-3 text-center flex flex-col items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <div className="text-xl font-black text-slate-900 dark:text-emerald-100 mt-2">{scan.summary.passed}</div>
                      <div className="text-xs font-semibold text-slate-600 dark:text-emerald-300 mt-0.5">Passed</div>
                    </div>

                    <div className="rounded-xl bg-[#FEECEC] dark:bg-red-950/50 dark:border dark:border-red-800/50 p-3 text-center flex flex-col items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </div>
                      <div className="text-xl font-black text-slate-900 dark:text-red-100 mt-2">{scan.summary.failed}</div>
                      <div className="text-xs font-semibold text-slate-600 dark:text-red-300 mt-0.5">Failed</div>
                    </div>

                    <div className="rounded-xl bg-[#FEF6E5] dark:bg-amber-950/50 dark:border dark:border-amber-800/50 p-3 text-center flex flex-col items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <line x1="12" y1="8" x2="12" y2="13" />
                          <circle cx="12" cy="17" r="0.75" fill="currentColor" />
                        </svg>
                      </div>
                      <div className="text-xl font-black text-slate-900 dark:text-amber-100 mt-2">{scan.summary.warning}</div>
                      <div className="text-xs font-semibold text-slate-600 dark:text-amber-300 mt-0.5">Needs Review</div>
                    </div>

                    <div className="rounded-xl bg-[#F1F5F9] dark:bg-slate-800/60 dark:border dark:border-slate-700/50 p-3 text-center flex flex-col items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-slate-500 text-white flex items-center justify-center shrink-0">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <line x1="6" y1="12" x2="18" y2="12" />
                        </svg>
                      </div>
                      <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-2">{scan.summary.notApplicable}</div>
                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">Not Applicable</div>
                    </div>
                  </div>
                </div>

                {/* Rule Checks List */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900">Rule Checks</h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('rules')}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      View All Rules &rarr;
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {scan.ruleChecks.map((rule) => (
                      <div key={rule.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {rule.status === 'COMPLIANT' && (
                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </span>
                          )}
                          {rule.status === 'NON_COMPLIANT' && (
                            <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
                              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </span>
                          )}
                          {rule.status === 'WARNING' && (
                            <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <line x1="12" y1="8" x2="12" y2="13" />
                                <circle cx="12" cy="17" r="0.75" fill="currentColor" />
                              </svg>
                            </span>
                          )}
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">
                              {rule.ruleName}
                            </span>
                            {rule.detail && (
                              <span className="text-[11px] text-slate-500 block mt-0.5">
                                {rule.detail}
                              </span>
                            )}
                          </div>
                        </div>

                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                          rule.status === 'COMPLIANT'
                            ? 'bg-emerald-50 text-emerald-700'
                            : rule.status === 'NON_COMPLIANT'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {rule.statusLabel}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Extracted Information */}
            {activeTab === 'extracted' && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Extracted Declarations & OCR Text</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Parsed using deterministic OCR and multimodal parsing pipeline</p>
                  </div>
                  {onEditExtracted && (
                    <button
                      type="button"
                      onClick={onEditExtracted}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      Edit Extracted Data
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3.5 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="font-semibold text-slate-500 block">Product Brand & Name</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">{scan.extractedInfo.productName}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="font-semibold text-slate-500 block">Net Quantity (Rule 11)</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">{scan.extractedInfo.netQuantity}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="font-semibold text-slate-500 block">Maximum Retail Price (Rule 6(1)(c))</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">{scan.extractedInfo.mrp}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="font-semibold text-slate-500 block">Unit Sale Price</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">{scan.extractedInfo.unitSalePrice || '₹0.38 / g'}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="font-semibold text-slate-500 block">Date of Packing / Mfg</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">{scan.extractedInfo.mfgDate}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="font-semibold text-slate-500 block">Best Before / Use By</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">{scan.extractedInfo.bestBefore}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="font-semibold text-slate-500 block">Batch / Lot Number</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">{scan.extractedInfo.batchNo}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="font-semibold text-slate-500 block">Country of Origin</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">{scan.extractedInfo.countryOfOrigin}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 col-span-2">
                    <span className="font-semibold text-slate-500 block">Manufacturer & Full Postal Address</span>
                    <span className="font-semibold text-slate-900 mt-1 block">{scan.extractedInfo.address}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 col-span-2">
                    <span className="font-semibold text-slate-500 block">Consumer Grievance Redressal</span>
                    <span className="font-semibold text-slate-900 mt-1 block">{scan.extractedInfo.consumerCare}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Rule Checks (Full View) */}
            {activeTab === 'rules' && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900">Legal Metrology (Packaged Commodities) Rules, 2011</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Verification status mapped to statutory sections</p>
                </div>

                <div className="space-y-3">
                  {scan.ruleChecks.map((rule) => (
                    <div
                      key={rule.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {rule.status === 'COMPLIANT' && (
                            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </span>
                          )}
                          {rule.status === 'NON_COMPLIANT' && (
                            <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
                              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </span>
                          )}
                          {rule.status === 'WARNING' && (
                            <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <line x1="12" y1="8" x2="12" y2="13" />
                                <circle cx="12" cy="17" r="0.75" fill="currentColor" />
                              </svg>
                            </span>
                          )}
                          <span className="text-sm font-bold text-slate-900">{rule.ruleName}</span>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          rule.status === 'COMPLIANT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rule.status === 'NON_COMPLIANT'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {rule.statusLabel}
                        </span>
                      </div>
                      {rule.legalSection && (
                        <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md inline-block w-fit">
                          Section: {rule.legalSection}
                        </span>
                      )}
                      {rule.detail && (
                        <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/60">
                          {rule.detail}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Images & Evidence */}
            {activeTab === 'evidence' && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900">Label Inspection Evidence & Bounding Boxes</h3>
                  <p className="text-xs text-slate-500 mt-0.5">High-resolution statutory bounding boxes extracted from packaging image</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-center">
                  <DetectedTextBackOfPackGraphic className="w-full max-w-lg h-auto" />
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN (Col Span 5)                                                */}
          {/* ========================================================================= */}
          <div className="col-span-12 xl:col-span-5 flex flex-col gap-5">
            {/* Card 1: Extracted Information */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-sm font-bold text-slate-900">Extracted Information</h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('extracted')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Edit</span>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Product Name</span>
                  <span className="font-bold text-slate-900 text-right">{scan.extractedInfo.productName}</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Net Quantity</span>
                  <span className="font-bold text-slate-900 text-right">{scan.extractedInfo.netQuantity}</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">MRP (Incl. of all taxes)</span>
                  <span className="font-bold text-slate-900 text-right">{scan.extractedInfo.mrp}</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Unit Sale Price</span>
                  <span className="font-bold text-slate-900 text-right">{scan.extractedInfo.unitSalePrice || '₹0.38 / g'}</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Country of Origin</span>
                  <span className="font-bold text-slate-900 text-right">{scan.extractedInfo.countryOfOrigin}</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Date of Mfg</span>
                  <span className="font-bold text-slate-900 text-right">{scan.extractedInfo.mfgDate}</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Best Before</span>
                  <span className="font-bold text-slate-900 text-right">{scan.extractedInfo.bestBefore}</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Batch No.</span>
                  <span className="font-bold text-slate-900 text-right">{scan.extractedInfo.batchNo}</span>
                </div>
                <div className="py-2 flex flex-col gap-1">
                  <span className="text-slate-500 font-medium">Manufacturer</span>
                  <span className="font-bold text-slate-900">{scan.extractedInfo.manufacturer}</span>
                  <span className="text-slate-600 text-[11px] leading-relaxed">{scan.extractedInfo.address}</span>
                </div>
                <div className="py-2 flex flex-col gap-1">
                  <span className="text-slate-500 font-medium">Consumer Care</span>
                  <span className="font-bold text-slate-900 break-words">{scan.extractedInfo.consumerCare}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Label Image */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Label Image</h3>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    Back of Pack
                  </span>
                </div>
              </div>

              {/* Graphic container with detected text overlay */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex items-center justify-center overflow-hidden">
                <DetectedTextBackOfPackGraphic className="w-full h-auto max-h-64 object-contain" />
              </div>

              <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Bounding boxes: 8 verified</span>
                <button
                  type="button"
                  onClick={() => setIsFullImageModalOpen(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>View Full Image</span>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 3 21 3 21 9" />
                    <polyline points="9 21 3 21 3 15" />
                    <line x1="21" y1="3" x2="14" y2="10" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Automated Assessment Disclaimer */}
        <div className="rounded-xl bg-blue-50/80 border border-blue-200/70 p-4 flex items-start gap-3 shadow-2xs">
          <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong className="font-bold text-slate-800">Note:</strong> This is an automated compliance assessment based on the information visible in the provided image. It does not substitute for official verification by authorized authorities.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE VIEW (Visible on < lg)                                            */}
      {/* ========================================================================= */}
      <div className="lg:hidden flex flex-col gap-4 pb-24">
        {/* Top Action Bar (Back, Share, Download) */}
        <div className="pt-1 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back</span>
          </button>

          <div className="flex items-center gap-3">
            {/* Share Button */}
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              <span>Share</span>
            </button>

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Title Section */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Compliance Report
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Detailed analysis of the scanned product label
          </p>
        </div>

        {/* Product Highlight Card */}
        <div className="rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Left: Thumbnail & Details */}
          <div className="flex items-center gap-3.5 min-w-0">
            <ProductImageThumbnail
              productName={scan.productName}
              imageUrl={scan.imageUrl}
              className="w-16 h-16 sm:w-20 sm:h-20"
            />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {scan.productName}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {scan.manufacturer}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-400 font-medium">
                <span>Scan ID <strong className="text-slate-600 font-semibold">{scan.scanIdNumber}</strong></span>
                <span>Scanned on {scan.scannedAt}</span>
              </div>
            </div>
          </div>

          {/* Right: Status Box */}
          <div className={`p-3.5 rounded-2xl max-w-sm shrink-0 ${
            scan.status === 'COMPLIANT'
              ? 'bg-[#EDF9F2] text-emerald-950 dark:bg-emerald-950/60 dark:text-emerald-100'
              : scan.status === 'NON_COMPLIANT'
              ? 'bg-[#FEECEC] text-red-950 dark:bg-red-950/60 dark:text-red-100'
              : 'bg-[#FEF6E5] text-amber-950 dark:bg-amber-950/60 dark:text-amber-100'
          }`}>
            <div className="flex items-center gap-2 mb-1.5">
              {scan.status === 'COMPLIANT' && (
                <>
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className="text-sm sm:text-base font-bold text-emerald-800 dark:text-emerald-300">Compliant</span>
                </>
              )}
              {scan.status === 'NON_COMPLIANT' && (
                <>
                  <div className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </div>
                  <span className="text-sm sm:text-base font-bold text-red-800 dark:text-red-300">Non-Compliant</span>
                </>
              )}
              {scan.status === 'NEEDS_REVIEW' && (
                <>
                  <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="8" x2="12" y2="13" />
                      <circle cx="12" cy="17" r="0.75" fill="currentColor" />
                    </svg>
                  </div>
                  <span className="text-sm sm:text-base font-bold text-amber-800 dark:text-amber-300">Needs Review</span>
                </>
              )}
            </div>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-200">
              {scan.explanation}
            </p>
          </div>
        </div>

        {/* Segmented Navigation Tabs (Overview | Extracted Information | Rule Checks) */}
        <div className="grid grid-cols-3 bg-slate-100/90 p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 text-xs sm:text-sm font-semibold rounded-lg transition-all text-center cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('extracted')}
            className={`py-2 px-1 text-xs sm:text-sm font-semibold rounded-lg transition-all text-center cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis ${
              activeTab === 'extracted'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Extracted Information
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`py-2 px-1 text-xs sm:text-sm font-semibold rounded-lg transition-all text-center cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis ${
              activeTab === 'rules'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rule Checks
          </button>
        </div>

      {/* Tab Content 1: Overview */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-4">
          {/* Compliance Summary Section */}
          <div className="rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-3">
              Compliance Summary
            </h3>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {/* Passed Card */}
              <div className="rounded-2xl bg-[#EDF9F2] dark:bg-emerald-950/50 dark:border dark:border-emerald-800/40 py-2.5 px-1.5 sm:py-3 sm:px-2 text-center flex flex-col items-center justify-center transition-transform hover:scale-[1.02]">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-emerald-100 mt-1 sm:mt-1.5 leading-none">
                  {scan.summary.passed}
                </div>
                <div className="text-[10px] sm:text-xs font-medium text-slate-600 dark:text-emerald-300 mt-1 leading-tight text-center">
                  Passed
                </div>
              </div>

              {/* Failed Card */}
              <div className="rounded-2xl bg-[#FEECEC] dark:bg-red-950/50 dark:border dark:border-red-800/40 py-2.5 px-1.5 sm:py-3 sm:px-2 text-center flex flex-col items-center justify-center transition-transform hover:scale-[1.02]">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
                <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-red-100 mt-1 sm:mt-1.5 leading-none">
                  {scan.summary.failed}
                </div>
                <div className="text-[10px] sm:text-xs font-medium text-slate-600 dark:text-red-300 mt-1 leading-tight text-center">
                  Failed
                </div>
              </div>

              {/* Warning Card */}
              <div className="rounded-2xl bg-[#FEF6E5] dark:bg-amber-950/50 dark:border dark:border-amber-800/40 py-2.5 px-1.5 sm:py-3 sm:px-2 text-center flex flex-col items-center justify-center transition-transform hover:scale-[1.02]">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="8" x2="12" y2="13" />
                    <circle cx="12" cy="17" r="0.75" fill="currentColor" />
                  </svg>
                </div>
                <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-amber-100 mt-1 sm:mt-1.5 leading-none">
                  {scan.summary.warning}
                </div>
                <div className="text-[10px] sm:text-xs font-medium text-slate-600 dark:text-amber-300 mt-1 leading-tight text-center">
                  Warning
                </div>
              </div>

              {/* Not Applicable Card */}
              <div className="rounded-2xl bg-[#F1F5F9] dark:bg-slate-800/60 dark:border dark:border-slate-700/40 py-2.5 px-1.5 sm:py-3 sm:px-2 text-center flex flex-col items-center justify-center transition-transform hover:scale-[1.02]">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-500 text-white flex items-center justify-center shrink-0">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="6" y1="12" x2="18" y2="12" />
                  </svg>
                </div>
                <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mt-1 sm:mt-1.5 leading-none">
                  {scan.summary.notApplicable}
                </div>
                <div className="text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-300 mt-1 leading-tight text-center">
                  Not Applicable
                </div>
              </div>
            </div>
          </div>

          {/* Extracted Information Card */}
          <div className="rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Extracted Information
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('extracted')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 cursor-pointer"
              >
                <span>View All</span>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* Grid of Key-Value Declarations */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-3.5 gap-x-4 text-xs">
              {/* Column 1 */}
              <div className="space-y-3">
                <div>
                  <span className="block text-slate-500 font-medium">Product Name</span>
                  <span className="font-bold text-slate-900">{scan.extractedInfo.productName}</span>
                </div>
                <div>
                  <span className="block text-slate-500 font-medium">Net Quantity</span>
                  <span className="font-bold text-slate-900">{scan.extractedInfo.netQuantity}</span>
                </div>
                <div>
                  <span className="block text-slate-500 font-medium">MRP (Incl. of all taxes)</span>
                  <span className="font-bold text-slate-900">{scan.extractedInfo.mrp}</span>
                </div>
                <div>
                  <span className="block text-slate-500 font-medium">Country of Origin</span>
                  <span className="font-bold text-slate-900">{scan.extractedInfo.countryOfOrigin}</span>
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-3">
                <div>
                  <span className="block text-slate-500 font-medium">Manufacturer</span>
                  <span className="font-bold text-slate-900">{scan.extractedInfo.manufacturer}</span>
                </div>
                <div>
                  <span className="block text-slate-500 font-medium">Manufacturing Date</span>
                  <span className="font-bold text-slate-900">{scan.extractedInfo.mfgDate}</span>
                </div>
                <div>
                  <span className="block text-slate-500 font-medium">Best Before</span>
                  <span className="font-bold text-slate-900">{scan.extractedInfo.bestBefore}</span>
                </div>
                <div>
                  <span className="block text-slate-500 font-medium">Batch No.</span>
                  <span className="font-bold text-slate-900">{scan.extractedInfo.batchNo}</span>
                </div>
              </div>

              {/* Column 3 */}
              <div className="space-y-3">
                <div>
                  <span className="block text-slate-500 font-medium">Consumer Care</span>
                  <span className="font-bold text-slate-900 break-words">{scan.extractedInfo.consumerCare}</span>
                </div>
                <div>
                  <span className="block text-slate-500 font-medium">Address</span>
                  <span className="font-medium text-slate-800 leading-relaxed block">{scan.extractedInfo.address}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rule Checks Card */}
          <div className="rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Rule Checks
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('rules')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 cursor-pointer"
              >
                <span>View All</span>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* Checklist items */}
            <div className="divide-y divide-slate-100">
              {scan.ruleChecks.map((rule) => (
                <div key={rule.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {rule.status === 'COMPLIANT' && (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                    {rule.status === 'NON_COMPLIANT' && (
                      <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </span>
                    )}
                    {rule.status === 'WARNING' && (
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="8" x2="12" y2="13" />
                          <circle cx="12" cy="17" r="0.75" fill="currentColor" />
                        </svg>
                      </span>
                    )}
                    <span className="text-xs font-semibold text-slate-800">
                      {rule.ruleName}
                    </span>
                  </div>

                  <span className={`text-xs font-semibold shrink-0 ${
                    rule.status === 'COMPLIANT'
                      ? 'text-emerald-600'
                      : rule.status === 'NON_COMPLIANT'
                      ? 'text-red-600'
                      : 'text-amber-600'
                  }`}>
                    {rule.statusLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Extracted Information (Full view) */}
      {activeTab === 'extracted' && (
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Extracted Declarations & OCR Text</h3>
            <p className="text-xs text-slate-500 mt-0.5">Parsed using deterministic OCR and multimodal parsing pipeline</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="font-semibold text-slate-500 block">Product Brand & Name</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">{scan.extractedInfo.productName}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="font-semibold text-slate-500 block">Net Quantity (Rule 11)</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">{scan.extractedInfo.netQuantity}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="font-semibold text-slate-500 block">Maximum Retail Price (Rule 6(1)(c))</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">{scan.extractedInfo.mrp}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="font-semibold text-slate-500 block">Date of Packing / Mfg</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">{scan.extractedInfo.mfgDate}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="font-semibold text-slate-500 block">Best Before / Use By</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">{scan.extractedInfo.bestBefore}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="font-semibold text-slate-500 block">Batch / Lot Number</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">{scan.extractedInfo.batchNo}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 sm:col-span-2">
              <span className="font-semibold text-slate-500 block">Manufacturer & Full Postal Address</span>
              <span className="font-semibold text-slate-900 mt-1 block">{scan.extractedInfo.address}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 sm:col-span-2">
              <span className="font-semibold text-slate-500 block">Consumer Grievance Redressal</span>
              <span className="font-semibold text-slate-900 mt-1 block">{scan.extractedInfo.consumerCare}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 3: Rule Checks (Full view) */}
      {activeTab === 'rules' && (
        <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Legal Metrology (Packaged Commodities) Rules, 2011</h3>
            <p className="text-xs text-slate-500 mt-0.5">Verification status mapped to statutory sections</p>
          </div>

          <div className="space-y-3">
            {scan.ruleChecks.map((rule) => (
              <div
                key={rule.id}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {rule.status === 'COMPLIANT' && (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                    {rule.status === 'NON_COMPLIANT' && (
                      <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </span>
                    )}
                    {rule.status === 'WARNING' && (
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="8" x2="12" y2="13" />
                          <circle cx="12" cy="17" r="0.75" fill="currentColor" />
                        </svg>
                      </span>
                    )}
                    <span className="text-sm font-bold text-slate-900">{rule.ruleName}</span>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    rule.status === 'COMPLIANT'
                      ? 'bg-emerald-100 text-emerald-800'
                      : rule.status === 'NON_COMPLIANT'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {rule.statusLabel}
                  </span>
                </div>
                {rule.legalSection && (
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md inline-block w-fit">
                    Section: {rule.legalSection}
                  </span>
                )}
                {rule.detail && (
                  <p className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200/60">
                    {rule.detail}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Automated Assessment Disclaimer Banner */}
      <div className="rounded-xl bg-blue-50/80 border border-blue-200/70 p-3.5 sm:p-4 flex items-start gap-3 shadow-2xs">
        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          <strong className="font-bold text-slate-800">Note:</strong> This is an automated compliance assessment based on the information visible in the provided image. It does not substitute for official verification by authorized authorities.
        </p>
      </div>
    </div>
  </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import { AppScanItem } from '@/lib/mock-scans';
import { ProductImageThumbnail } from '../ui-assets';

export interface HistoryScreenProps {
  scans: AppScanItem[];
  onSelectScan: (scan: AppScanItem) => void;
  isVerifiedUser: boolean;
  onRequireAuth: (message: string) => void;
}

type FilterCategory = 'ALL' | 'COMPLIANT' | 'NON_COMPLIANT' | 'NEEDS_REVIEW';

export function HistoryScreen({
  scans,
  onSelectScan,
  isVerifiedUser,
  onRequireAuth,
}: HistoryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('ALL');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedScanIds, setSelectedScanIds] = useState<Set<string>>(new Set());

  const PAGE_SIZE = 6;

  // Count items
  const counts = useMemo(() => {
    const total = scans.length;
    const compliant = scans.filter((s) => s.status === 'COMPLIANT').length;
    const nonCompliant = scans.filter((s) => s.status === 'NON_COMPLIANT').length;
    const needsReview = scans.filter((s) => s.status === 'NEEDS_REVIEW').length;
    const notApplicable = 1;
    return { total, compliant, nonCompliant, needsReview, notApplicable };
  }, [scans]);

  // Filter and search
  const filteredScans = useMemo(() => {
    return scans.filter((scan) => {
      // Filter tab check
      if (activeFilter === 'COMPLIANT' && scan.status !== 'COMPLIANT') return false;
      if (activeFilter === 'NON_COMPLIANT' && scan.status !== 'NON_COMPLIANT') return false;
      if (activeFilter === 'NEEDS_REVIEW' && scan.status !== 'NEEDS_REVIEW') return false;

      // Search query check
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = scan.productName.toLowerCase().includes(query);
        const matchesMfg = scan.manufacturer.toLowerCase().includes(query);
        const matchesId = scan.scanIdNumber.toLowerCase().includes(query);
        if (!matchesName && !matchesMfg && !matchesId) return false;
      }

      return true;
    });
  }, [scans, activeFilter, searchQuery]);

  // Pagination slicing
  const totalPages = Math.max(1, Math.ceil(filteredScans.length / PAGE_SIZE));
  const paginatedScans = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredScans.slice(start, start + PAGE_SIZE);
  }, [filteredScans, currentPage]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedScanIds(new Set(paginatedScans.map((s) => s.id)));
    } else {
      setSelectedScanIds(new Set());
    }
  };

  const handleToggleRow = (id: string) => {
    const next = new Set(selectedScanIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedScanIds(next);
  };

  // Helper to extract key issues from rule checks
  const getKeyIssues = (scan: AppScanItem) => {
    if (scan.status === 'COMPLIANT') return null;
    const violations = scan.ruleChecks?.filter((r) => r.status === 'NON_COMPLIANT') || [];
    const warnings = scan.ruleChecks?.filter((r) => r.status === 'WARNING') || [];
    const issues = [...violations, ...warnings];
    if (issues.length > 0) {
      return issues.slice(0, 2).map((i) => i.detail || i.ruleName);
    }
    if (scan.status === 'NEEDS_REVIEW') {
      return ['Manufacturing date or label contrast unclear'];
    }
    return ['Statutory declaration missing under LMPC Rules'];
  };

  return (
    <div className="flex flex-col gap-6 pb-24 w-full max-w-7xl mx-auto animate-in fade-in duration-150">
      {/* Title & Desktop Top Search Bar */}
      <div className="pt-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Scan History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            View and manage your past product scans
          </p>
        </div>

        {/* Search and Time Filter Toolbar */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onFocus={() => {
                if (!isVerifiedUser) {
                  onRequireAuth('Verified user access required to search past enforcement scans.');
                }
              }}
              onChange={(e) => {
                if (!isVerifiedUser) {
                  onRequireAuth('Verified user access required to search past enforcement scans.');
                  return;
                }
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={isVerifiedUser ? 'Search by product name, brand, or scan ID...' : 'Search scans (Verified only 🔒)'}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl placeholder-slate-400 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Time Filter Dropdown (Desktop) */}
          <div className="relative shrink-0">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-semibold py-2 pl-8 pr-8 rounded-xl shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs / Pills Row */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
        {/* All Scans Pill */}
        <button
          type="button"
          onClick={() => {
            setActiveFilter('ALL');
            setCurrentPage(1);
          }}
          className={`shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'ALL'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 shadow-2xs'
          }`}
        >
          <span>All Scans</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold ${
              activeFilter === 'ALL' ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {counts.total}
          </span>
        </button>

        {/* Compliant Pill */}
        <button
          type="button"
          onClick={() => {
            setActiveFilter('COMPLIANT');
            setCurrentPage(1);
          }}
          className={`shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'COMPLIANT'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 shadow-2xs'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${activeFilter === 'COMPLIANT' ? 'bg-white' : 'bg-emerald-500'}`} />
          <span>Compliant</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold ${
              activeFilter === 'COMPLIANT' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {counts.compliant}
          </span>
        </button>

        {/* Non-Compliant Pill */}
        <button
          type="button"
          onClick={() => {
            setActiveFilter('NON_COMPLIANT');
            setCurrentPage(1);
          }}
          className={`shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'NON_COMPLIANT'
              ? 'bg-red-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 shadow-2xs'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${activeFilter === 'NON_COMPLIANT' ? 'bg-white' : 'bg-red-500'}`} />
          <span>Non-Compliant</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold ${
              activeFilter === 'NON_COMPLIANT' ? 'bg-red-800 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {counts.nonCompliant}
          </span>
        </button>

        {/* Needs Review Pill */}
        <button
          type="button"
          onClick={() => {
            setActiveFilter('NEEDS_REVIEW');
            setCurrentPage(1);
          }}
          className={`shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'NEEDS_REVIEW'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80 shadow-2xs'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${activeFilter === 'NEEDS_REVIEW' ? 'bg-white' : 'bg-amber-500'}`} />
          <span>Needs Review</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold ${
              activeFilter === 'NEEDS_REVIEW' ? 'bg-amber-800 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {counts.needsReview}
          </span>
        </button>

        {/* Not Applicable Pill */}
        <button
          type="button"
          className="shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200/80 shadow-2xs cursor-pointer opacity-80"
        >
          <span className="w-2 h-2 rounded-full bg-slate-400" />
          <span>Not Applicable</span>
          <span className="px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
            {counts.notApplicable}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. DESKTOP DATA TABLE (Visible on >= 1024px)                               */}
      {/* ========================================================================= */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4 w-10">
                <input
                  type="checkbox"
                  onChange={handleSelectAll}
                  checked={paginatedScans.length > 0 && paginatedScans.every((s) => selectedScanIds.has(s.id))}
                  className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">Scan Details</th>
              <th className="py-3 px-4">Compliance Status</th>
              <th className="py-3 px-4">Key Issues</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-medium">
            {paginatedScans.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </div>
                    <div className="text-sm font-bold text-slate-800">No Product Scans Found</div>
                    <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {scans.length === 0
                        ? 'No scans yet. Product labels you scan or upload will appear here with compliance evaluations.'
                        : 'No scans match your search or filter criteria.'}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedScans.map((scan) => {
                const isSelected = selectedScanIds.has(scan.id);
                const issues = getKeyIssues(scan);

                return (
                  <tr
                    key={scan.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isSelected ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleRow(scan.id)}
                        className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>

                    {/* Product thumbnail + name + manufacturer */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <ProductImageThumbnail
                          productName={scan.productName}
                          imageUrl={scan.imageUrl}
                          className="w-10 h-10 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-slate-900 line-clamp-1">{scan.productName}</div>
                          <div className="text-[11px] text-slate-500 font-medium line-clamp-1">{scan.manufacturer}</div>
                        </div>
                      </div>
                    </td>

                    {/* Scan ID & Scanned timestamp */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-semibold">{scan.scannedAt}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{scan.scanIdNumber}</div>
                    </td>

                    {/* Compliance status pill */}
                    <td className="py-3.5 px-4">
                      {scan.status === 'COMPLIANT' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                          <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">✓</span>
                          <span>Compliant</span>
                        </span>
                      )}
                      {scan.status === 'NON_COMPLIANT' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200/70">
                          <span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px]">✕</span>
                          <span>Non-Compliant</span>
                        </span>
                      )}
                      {scan.status === 'NEEDS_REVIEW' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/70">
                          <span className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]">!</span>
                          <span>Needs Review</span>
                        </span>
                      )}
                    </td>

                    {/* Key issues bullet points */}
                    <td className="py-3.5 px-4 max-w-xs">
                      {issues ? (
                        <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                          {issues.map((iss, i) => (
                            <li key={i} className="truncate" title={iss}>
                              {iss}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    {/* Actions: View Report + Download */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectScan(scan)}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer"
                        >
                          View Report
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectScan(scan)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                          title="Download PDF"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        <div className="border-t border-slate-200/80 px-4 py-3 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing <strong className="text-slate-900">{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredScans.length)}</strong> of <strong className="text-slate-900">{filteredScans.length}</strong> scans
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-600 disabled:opacity-30 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                type="button"
                onClick={() => setCurrentPage(pg)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  currentPage === pg
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {pg}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-600 disabled:opacity-30 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MOBILE CARD LIST (Visible on < 1024px)                                  */}
      {/* ========================================================================= */}
      <div className="lg:hidden flex flex-col gap-2.5">
        {filteredScans.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-500">
            <svg className="w-10 h-10 mx-auto text-slate-300 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm font-semibold text-slate-700">No scans found</p>
            <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search or category filter.</p>
          </div>
        ) : (
          filteredScans.map((scan) => (
            <div
              key={scan.id}
              onClick={() => onSelectScan(scan)}
              className="group p-3.5 rounded-2xl bg-white hover:bg-slate-50/70 border border-slate-200/80 shadow-2xs transition-all flex items-center justify-between gap-3 cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <ProductImageThumbnail
                  productName={scan.productName}
                  imageUrl={scan.imageUrl}
                  className="w-12 h-12"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                    {scan.productName}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                    {scan.manufacturer}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    {scan.scannedAt}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {scan.status === 'COMPLIANT' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold">✓</span>
                    <span>Compliant</span>
                  </span>
                )}
                {scan.status === 'NON_COMPLIANT' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                    <span className="w-3.5 h-3.5 rounded-full bg-red-600 text-white flex items-center justify-center text-[9px] font-bold">✕</span>
                    <span>Non-Compliant</span>
                  </span>
                )}
                {scan.status === 'NEEDS_REVIEW' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <span className="w-3.5 h-3.5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[9px] font-bold">⏰</span>
                    <span>Needs Review</span>
                  </span>
                )}
                <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tip Banner at Bottom */}
      <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between text-xs shadow-2xs">
        <div className="flex items-center gap-2 text-blue-900 font-medium">
          <svg className="w-4 h-4 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v1M12 21v1M4.22 4.22l.71.71M18.36 18.36l.71.71M2 12h1M21 12h1M4.22 19.78l.71-.71M18.36 5.64l.71-.71" />
            <circle cx="12" cy="12" r="6" />
          </svg>
          <span>
            <strong className="font-bold">Tip:</strong> Click on a scan to view the full compliance report, extracted information, and rule-wise analysis.
          </span>
        </div>
        <button
          type="button"
          onClick={() => onSelectScan(scans[0])}
          className="text-blue-700 font-bold hover:underline shrink-0 ml-3 flex items-center gap-1 cursor-pointer"
        >
          <span>Learn More &rarr;</span>
        </button>
      </div>
    </div>
  );
}

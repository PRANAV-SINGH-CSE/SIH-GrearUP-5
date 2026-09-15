'use client';

import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { NationalEmblem } from './ui-assets';
import { NavTabId } from './bottom-nav';

export interface DesktopHeaderProps {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
  currentUser: User | null;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
  onOpenGuidelinesModal?: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  isHomeLanding?: boolean;
}

export function DesktopHeader({
  activeTab,
  onTabChange,
  currentUser,
  onOpenAuthModal,
  onSignOut,
  onOpenGuidelinesModal,
}: DesktopHeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const userInitial = (
    currentUser?.displayName?.[0] ||
    currentUser?.email?.[0] ||
    'U'
  ).toUpperCase();

  const userDisplayName =
    currentUser?.displayName ||
    (currentUser?.email ? currentUser.email.split('@')[0] : 'Officer');

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 px-6 py-3 flex items-center justify-between shadow-2xs">
      {/* Left: Department of Legal Metrology Branding & CompliScan Logo */}
      <div className="flex items-center gap-5">
        {/* Emblem & Department */}
        <div
          onClick={() => onTabChange('home')}
          className="flex items-center gap-3 cursor-pointer select-none"
        >
          <NationalEmblem className="w-8 h-10" />
          <div>
            <div className="text-sm font-extrabold text-slate-900 tracking-tight leading-tight">
              Department of Legal Metrology
            </div>
            <div className="text-[11px] font-medium text-slate-500">
              Lovely Professional University
            </div>
          </div>
        </div>

        {/* Vertical Separator */}
        <div className="h-8 w-px bg-slate-200" />

        {/* CompliScan Logo with Slogan */}
        <div
          onClick={() => onTabChange('home')}
          className="flex flex-col cursor-pointer select-none"
        >
          <div className="text-lg font-black text-blue-600 tracking-tight leading-none">
            Compli<span className="text-slate-900">Scan</span>
          </div>
          <div className="text-[10px] font-semibold text-slate-500 tracking-tight mt-0.5">
            Scan. Verify. Stay Compliant.
          </div>
        </div>
      </div>

      {/* Right: Unified Top Navigation Tabs + User Profile */}
      <div className="flex items-center gap-8">
        <nav className="flex items-center gap-6 text-sm font-semibold">
          {/* Home Tab */}
          <button
            type="button"
            onClick={() => onTabChange('home')}
            className={`relative py-1 cursor-pointer transition-colors ${
              activeTab === 'home'
                ? 'text-blue-600 font-bold'
                : 'text-slate-600 hover:text-blue-600 font-semibold'
            }`}
          >
            <span>Home</span>
            {activeTab === 'home' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>

          {/* History Tab */}
          <button
            type="button"
            onClick={() => onTabChange('history')}
            className={`relative py-1 cursor-pointer transition-colors ${
              activeTab === 'history'
                ? 'text-blue-600 font-bold'
                : 'text-slate-600 hover:text-blue-600 font-semibold'
            }`}
          >
            <span>History</span>
            {activeTab === 'history' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>

          {/* Reports Tab */}
          <button
            type="button"
            onClick={() => onTabChange('reports')}
            className={`relative py-1 cursor-pointer transition-colors ${
              activeTab === 'reports'
                ? 'text-blue-600 font-bold'
                : 'text-slate-600 hover:text-blue-600 font-semibold'
            }`}
          >
            <span>Reports</span>
            {activeTab === 'reports' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>

          {/* Help Button (Opens Guidelines Modal) */}
          <button
            type="button"
            onClick={onOpenGuidelinesModal}
            className="text-slate-600 hover:text-blue-600 font-semibold cursor-pointer py-1 transition-colors"
          >
            Help
          </button>

          {/* Settings Tab */}
          <button
            type="button"
            onClick={() => onTabChange('settings')}
            className={`relative py-1 cursor-pointer transition-colors ${
              activeTab === 'settings'
                ? 'text-blue-600 font-bold'
                : 'text-slate-600 hover:text-blue-600 font-semibold'
            }`}
          >
            <span>Settings</span>
            {activeTab === 'settings' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        </nav>

        {/* User Profile Avatar dropdown or Sign In */}
        <div className="relative">
          {currentUser ? (
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2.5 py-1.5 px-3 rounded-full hover:bg-slate-50 border border-slate-200 transition-colors cursor-pointer select-none"
            >
              {currentUser.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentUser.photoURL}
                  alt="Profile"
                  className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {userInitial}
                </div>
              )}
              <span className="text-xs font-bold text-slate-800 max-w-[120px] truncate">
                {userDisplayName}
              </span>
              <svg
                className="w-3.5 h-3.5 text-slate-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Sign In
            </button>
          )}

          {/* Dropdown Menu */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {currentUser?.displayName || 'Department User'}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {currentUser?.email || 'Not signed in'}
                </div>
                {currentUser && (
                  <div className="mt-1">
                    {currentUser.emailVerified ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        ✓ Verified Officer
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        ⚠️ Email Unverified
                      </span>
                    )}
                  </div>
                )}
              </div>

              {currentUser ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onTabChange('settings');
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Settings & Preferences
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onSignOut();
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer border-t border-slate-100"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onOpenAuthModal();
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 cursor-pointer"
                >
                  Sign In with Google / Email
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

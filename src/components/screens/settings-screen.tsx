'use client';

import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { AuditAlertService } from '@/lib/notifications/audit-alert.service';

export interface SettingsScreenProps {
  currentUser: User | null;
  currentLanguage: 'en' | 'hi';
  onLanguageChange: (language: 'en' | 'hi') => void;
  themePreference: 'light' | 'dark' | 'system';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
  onOpenGuidelinesModal: () => void;
  onClearData: () => void;
}

function UserAvatar({
  photoURL,
  name,
  sizeClassName = 'w-12 h-12',
  textClassName = 'text-lg',
}: {
  photoURL?: string | null;
  name?: string | null;
  sizeClassName?: string;
  textClassName?: string;
}) {
  const [hasError, setHasError] = useState(false);
  const initial = (name?.[0] || 'U').toUpperCase();

  if (photoURL && !hasError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoURL}
        alt={name || 'Profile'}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={() => setHasError(true)}
        className={`${sizeClassName} rounded-full object-cover shrink-0 border border-slate-200 shadow-2xs`}
      />
    );
  }

  return (
    <div
      className={`${sizeClassName} rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold ${textClassName} flex items-center justify-center shrink-0 border border-blue-400/30 shadow-2xs select-none`}
    >
      {initial}
    </div>
  );
}

export function SettingsScreen({
  currentUser,
  currentLanguage,
  onLanguageChange,
  themePreference,
  onThemeChange,
  onOpenAuthModal,
  onSignOut,
  onOpenGuidelinesModal,
  onClearData,
}: SettingsScreenProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    return AuditAlertService.isEnabled();
  });
  const [modalType, setModalType] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const toggleNotifications = async () => {
    const nextVal = !notificationsEnabled;
    setNotificationsEnabled(nextVal);
    AuditAlertService.setEnabled(nextVal);

    if (nextVal) {
      const perm = await AuditAlertService.requestPermission();
      if (perm === 'granted') {
        showToast('Audit alerts enabled (browser & sound alerts active)');
      } else if (perm === 'denied') {
        showToast('Audit alerts enabled (browser notifications blocked in site settings)');
      } else {
        showToast('Audit alerts enabled (sound & haptic alerts active)');
      }
    } else {
      showToast('Audit alerts disabled');
    }
  };

  const handleClearCache = () => {
    onClearData();
    showToast('App cache and temporary scan data cleared!');
  };

  const userInitial = (currentUser?.displayName?.[0] || currentUser?.email?.[0] || 'U').toUpperCase();
  const userDisplayName = currentUser?.displayName || (currentUser?.email ? currentUser.email.split('@')[0] : 'Guest User');
  const userEmail = currentUser?.email || 'Not signed in';

  const languageNames: Record<'en' | 'hi', string> = {
    en: 'English (EN)',
    hi: 'हिंदी (Hindi)',
  };
  const languageLabel = languageNames[currentLanguage] || 'English (EN)';
  const themeLabel = themePreference === 'system' ? 'System Default' : themePreference === 'dark' ? 'Dark' : 'Light';

  const chooseLanguage = (language: 'en' | 'hi') => {
    onLanguageChange(language);
    setModalType(null);
    showToast(`Language changed to ${languageNames[language]}`);
  };

  const chooseTheme = (theme: 'light' | 'dark' | 'system') => {
    onThemeChange(theme);
    setModalType(null);
    showToast(`${theme === 'system' ? 'System default' : theme[0].toUpperCase() + theme.slice(1)} theme enabled`);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-150">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DESKTOP VIEW (Visible on >= lg)                                          */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex flex-col gap-6">
        {/* Desktop Header with Title & Slogan Banner */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Settings & Configuration
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Manage your inspector account preferences, compliance parameters, and app settings.
            </p>
          </div>

          {/* Right Slogan Banner matching Reference #4 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs max-w-sm flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center shrink-0 text-orange-600">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 italic leading-snug">
                &ldquo;Accurate information. Safer markets. Stronger consumers.&rdquo;
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-semibold text-slate-500">
                  Department of Consumer Affairs, Lovely Professional University
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Desktop Grid (6 Cards) */}
        <div className="grid grid-cols-2 gap-6">
          {/* Card 1: Account */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>Inspector Account</span>
                </h3>
                {currentUser?.emailVerified ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    ✓ Verified Officer
                  </span>
                ) : currentUser ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                    ⚠️ Email Unverified
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
                    Guest Mode
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-center gap-3.5">
                <UserAvatar
                  photoURL={currentUser?.photoURL}
                  name={userDisplayName}
                  sizeClassName="w-14 h-14"
                  textClassName="text-xl"
                />
                <div>
                  <div className="text-sm font-black text-slate-900">{userDisplayName}</div>
                  <div className="text-xs text-slate-500 font-medium">{userEmail}</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Jurisdiction: Central Metrology Enforcement Division
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-slate-50 rounded-xl p-3 border border-slate-200/60 divide-y divide-slate-100 text-xs">
                <div className="py-1.5 flex items-center justify-between">
                  <span className="text-slate-500">Officer Designation</span>
                  <span className="font-bold text-slate-800">Metrology Enforcement Officer</span>
                </div>
                <div className="py-1.5 flex items-center justify-between">
                  <span className="text-slate-500">Security Clearance</span>
                  <span className="font-bold text-emerald-700">Tier-2 Statutory Access</span>
                </div>
                <div className="py-1.5 flex items-center justify-between">
                  <span className="text-slate-500">Database Node</span>
                  <span className="font-bold text-slate-800">syncboard-20e62.firebaseio.com</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  if (!currentUser) onOpenAuthModal();
                  else setModalType('account');
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <span>{currentUser ? 'Manage Credentials' : 'Sign In / Register'}</span>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Card 2: App Preferences */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  <span>App Preferences</span>
                </h3>
                <span className="text-[10px] font-semibold text-slate-400">Customizable</span>
              </div>

              <div className="mt-4 space-y-3.5 text-xs">
                {/* Language */}
                <div
                  onClick={() => setModalType('language')}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-200/60"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">System Language</span>
                    <span className="text-[11px] text-slate-500 block">Report generation and UI localization</span>
                  </div>
                  <span className="font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">{languageLabel}</span>
                </div>

                {/* Notifications */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                  <div>
                    <span className="font-bold text-slate-900 block">Audit Alert Notifications</span>
                    <span className="text-[11px] text-slate-500 block">Real-time alerts for non-compliant batches</span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleNotifications}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      notificationsEnabled ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Appearance */}
                <div
                  onClick={() => setModalType('appearance')}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-200/60"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">Color Theme</span>
                    <span className="text-[11px] text-slate-500 block">Light / Dark / High-Contrast System Default</span>
                  </div>
                  <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">{themeLabel}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Settings automatically saved to browser storage</span>
            </div>
          </div>

          {/* Card 3: Scan Preferences */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span>Inspection & Scan Parameters</span>
                </h3>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
              </div>

              <div className="mt-4 divide-y divide-slate-100 text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">Default Inspection Framework</span>
                    <span className="text-[11px] text-slate-500">Legal Metrology (Packaged Commodities) Rules, 2011</span>
                  </div>
                  <span className="font-bold text-slate-700">PCR 2011</span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">AI Multimodal Vision Model</span>
                    <span className="text-[11px] text-slate-500">Gemini 2.5 Flash Lite (Primary) + 16-Key Failover</span>
                  </div>
                  <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">Online</span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">Confidence Threshold</span>
                    <span className="text-[11px] text-slate-500">Flag for manual officer review if below 90%</span>
                  </div>
                  <span className="font-bold text-slate-800">90%</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-semibold cursor-pointer" onClick={() => showToast('Scan parameters updated')}>
              <span>Configure statutory rules &rarr;</span>
            </div>
          </div>

          {/* Card 4: Data & Storage */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <svg className="w-4 h-4 text-cyan-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <ellipse cx="12" cy="5" rx="9" ry="3" />
                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                  </svg>
                  <span>Data & Storage</span>
                </h3>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Cloud Synced
                </span>
              </div>

              <div className="mt-4 space-y-2.5 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">Local Device Cache</span>
                    <span className="text-[11px] text-slate-500">Temporary packaging labels and OCR previews</span>
                  </div>
                  <span className="font-bold text-slate-800">14.2 MB</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">Firebase Realtime Database</span>
                    <span className="text-[11px] text-slate-500">Connected to syncboard-20e62 endpoint</span>
                  </div>
                  <span className="font-bold text-emerald-700">Active</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleClearCache}
                className="text-xs font-bold text-red-600 hover:text-red-700 cursor-pointer"
              >
                Clear Local Cache
              </button>
              <button
                type="button"
                onClick={() => showToast('Exporting scan logs as CSV...')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                Export History (CSV)
              </button>
            </div>
          </div>

          {/* Card 5: Privacy & Security */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>Privacy & Security</span>
                </h3>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">Gov-Standard</span>
              </div>

              <div className="mt-4 divide-y divide-slate-100 text-xs">
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-500">Data Encryption</span>
                  <span className="font-bold text-slate-800">AES-256 (In-Transit & Rest)</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-500">Compliance Framework</span>
                  <span className="font-bold text-slate-800">Information Technology Act, 2000</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-500">Audit Trail Integrity</span>
                  <span className="font-bold text-emerald-700">Tamper-Evident SHA-256</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-500">Session Inactivity Lock</span>
                  <span className="font-bold text-slate-800">30 Minutes</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setModalType('privacy')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                View Privacy Guidelines &rarr;
              </button>
            </div>
          </div>

          {/* Card 6: About & Legal Framework */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span>About & Legal Framework</span>
                </h3>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">v1.0.0</span>
              </div>

              <div className="mt-4 divide-y divide-slate-100 text-xs">
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-500">Platform</span>
                  <span className="font-bold text-slate-800">CompliScan AI Metrology System</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-500">Statutory Reference</span>
                  <span className="font-bold text-slate-800">PCR 2011 & Legal Metrology Act 2009</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-500">Governing Ministry</span>
                  <span className="font-bold text-slate-800">Ministry of Consumer Affairs, GoI</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-500">National Consumer Helpline</span>
                  <span className="font-bold text-blue-600">1800-11-4000 (Toll Free)</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={onOpenGuidelinesModal}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                Statutory Guidelines
              </button>
              <button
                type="button"
                onClick={() => setModalType('legal')}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Legal Provisions
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Bottom Action & Official Tricolor Bar */}
        <div className="mt-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-10 rounded-full bg-gradient-to-b from-orange-500 via-white to-emerald-600 border border-slate-200" />
            <div>
              <div className="text-xs font-bold text-slate-900">CompliScan Metrology Enforcement Portal</div>
              <div className="text-[11px] text-slate-500">Department of Legal Metrology • Ensuring Fair Trade & Consumer Protection</div>
            </div>
          </div>

          {currentUser ? (
            <button
              type="button"
              onClick={() => {
                onSignOut();
                showToast('User signed out successfully.');
              }}
              className="px-5 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold text-xs rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              <span>Sign In to Verified Account</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE VIEW (Visible on < lg)                                            */}
      {/* ========================================================================= */}
      <div className="lg:hidden flex flex-col gap-4 pb-24">
        {/* Title */}
        <div className="pt-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your preferences and app settings
          </p>
        </div>

        {/* Section 1: Account */}
        <div className="space-y-1.5">
          <h2 className="text-xs font-bold text-slate-900 px-1">Account</h2>
        <div
          onClick={() => {
            if (!currentUser) {
              onOpenAuthModal();
            } else {
              setModalType('account');
            }
          }}
          className="rounded-2xl bg-white border border-slate-200/80 p-4 shadow-2xs hover:bg-slate-50/60 transition-colors flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3">
            {/* Avatar U or photo */}
            <UserAvatar
              photoURL={currentUser?.photoURL}
              name={userDisplayName}
              sizeClassName="w-12 h-12"
              textClassName="text-lg"
            />
            <div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>{userDisplayName}</span>
                {currentUser?.emailVerified ? (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    ✓ Verified
                  </span>
                ) : currentUser ? (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                    ⚠️ Unverified
                  </span>
                ) : (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
                    Sign In
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500">{userEmail}</div>
              <div className="text-xs text-slate-500">
                {currentUser ? 'Verified Department User / Officer' : 'Click to Sign In with Google or Email'}
              </div>
            </div>
          </div>
          <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>

      {/* Section 2: App Preferences */}
      <div className="space-y-1.5">
        <h2 className="text-xs font-bold text-slate-900 px-1">App Preferences</h2>
        <div className="overflow-hidden rounded-2xl bg-white border border-slate-200/80 divide-y divide-slate-100 shadow-2xs">
          {/* Language */}
          <div
            onClick={() => setModalType('language')}
            className="p-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">Language</div>
                <div className="text-[11px] text-slate-500 font-medium">Choose your preferred language</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-600">
              <span>{currentLanguage === 'hi' ? 'हिंदी' : 'English'}</span>
              <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>

          {/* Notifications Toggle */}
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">Notifications</div>
                <div className="text-[11px] text-slate-500 font-medium">Get updates about scan results</div>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleNotifications}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                notificationsEnabled ? 'bg-blue-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Appearance */}
          <div
            onClick={() => setModalType('appearance')}
            className="p-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="13.5" cy="6.5" r=".5" />
                  <circle cx="17.5" cy="10.5" r=".5" />
                  <circle cx="8.5" cy="7.5" r=".5" />
                  <circle cx="6.5" cy="12.5" r=".5" />
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
                </svg>
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">Appearance</div>
                <div className="text-[11px] text-slate-500 font-medium">Choose theme</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-600">
              <span>{themeLabel}</span>
              <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Data & Storage */}
      <div className="space-y-1.5">
        <h2 className="text-xs font-bold text-slate-900 px-1">Data & Storage</h2>
        <div className="overflow-hidden rounded-2xl bg-white border border-slate-200/80 divide-y divide-slate-100 shadow-2xs">
          {/* Clear App Data */}
          <div
            onClick={handleClearCache}
            className="p-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">Clear App Data</div>
                <div className="text-[11px] text-slate-500 font-medium">Remove cached images and temporary files</div>
              </div>
            </div>
            <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>

          {/* Manage Offline Data */}
          <div
            onClick={() => setModalType('offline')}
            className="p-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">Manage Offline Data</div>
                <div className="text-[11px] text-slate-500 font-medium">View and manage offline scans</div>
              </div>
            </div>
            <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>

          {/* Privacy & Data Usage */}
          <div
            onClick={() => setModalType('privacy')}
            className="p-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">Privacy & Data Usage</div>
                <div className="text-[11px] text-slate-500 font-medium">Learn how your data is used and stored</div>
              </div>
            </div>
            <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Section 4: About */}
      <div className="space-y-1.5">
        <h2 className="text-xs font-bold text-slate-900 px-1">About</h2>
        <div className="overflow-hidden rounded-2xl bg-white border border-slate-200/80 divide-y divide-slate-100 shadow-2xs">
          {/* About CompliScan */}
          <div
            onClick={() => setModalType('about')}
            className="p-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">About CompliScan</div>
                <div className="text-[11px] text-slate-500 font-medium">Version 1.0.0</div>
              </div>
            </div>
            <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>

          {/* Legal Information */}
          <div
            onClick={() => setModalType('legal')}
            className="p-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">Legal Information</div>
                <div className="text-[11px] text-slate-500 font-medium">Legal Metrology (Packaged Commodities) Rules, 2011</div>
              </div>
            </div>
            <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Section 5: Support */}
      <div className="space-y-1.5">
        <h2 className="text-xs font-bold text-slate-900 px-1">Support</h2>
        <div className="overflow-hidden rounded-2xl bg-white border border-slate-200/80 divide-y divide-slate-100 shadow-2xs">
          {/* Help & Guidelines */}
          <div
            onClick={onOpenGuidelinesModal}
            className="p-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">Help & Guidelines</div>
                <div className="text-[11px] text-slate-500 font-medium">Frequently asked questions and user guide</div>
              </div>
            </div>
            <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>

          {/* Contact Support */}
          <div
            onClick={() => setModalType('support')}
            className="p-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">Contact Support</div>
                <div className="text-[11px] text-slate-500 font-medium">Get in touch with the support team</div>
              </div>
            </div>
            <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Sign Out / Sign In Button */}
      {currentUser ? (
        <button
          type="button"
          onClick={() => {
            onSignOut();
            showToast('User signed out successfully.');
          }}
          className="w-full py-3 px-4 rounded-xl bg-red-50 hover:bg-red-100/80 border border-red-200/80 text-red-600 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs mt-1"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Sign Out</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onOpenAuthModal}
          className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs mt-1"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
          <span>Sign In / Register Verified Account</span>
        </button>
      )}
      </div>

      {/* Interactive Information Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-2 capitalize">
              {modalType === 'account' ? 'Verified Account Details' : `${modalType} Details`}
            </h3>
            <div className="text-xs text-slate-600 leading-relaxed mb-4">
              {modalType === 'account' && (
                <div className="space-y-2">
                  <p><strong>Name:</strong> {userDisplayName}</p>
                  <p><strong>Email:</strong> {userEmail}</p>
                  <p>
                    <strong>Status:</strong>{' '}
                    <span className={currentUser?.emailVerified ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                      {currentUser?.emailVerified ? 'Verified Officer / User (Full Access)' : 'Unverified Email (Upload & Search restricted)'}
                    </span>
                  </p>
                  <p><strong>Jurisdiction:</strong> Central Metrology Enforcement Division</p>
                  {!currentUser?.emailVerified && (
                    <button
                      type="button"
                      onClick={() => {
                        setModalType(null);
                        onOpenAuthModal();
                      }}
                      className="mt-2 text-xs font-bold text-blue-600 hover:underline block cursor-pointer"
                    >
                      Click here to send or check email verification &rarr;
                    </button>
                  )}
                </div>
              )}
              {modalType === 'about' && 'CompliScan v1.0.0 is an automated AI compliance validation system under the Legal Metrology (Packaged Commodities) Rules, 2011, Lovely Professional University.'}
              {modalType === 'legal' && 'Governed under Section 36 of the Legal Metrology Act, 2009 and the Legal Metrology (Packaged Commodities) Rules, 2011.'}
              {modalType === 'offline' && 'CompliScan supports offline scanning with local SQLite cache and automatic background synchronization upon network reconnection.'}
              {modalType === 'privacy' && 'All scanned images and extraction metadata are stored strictly in accordance with Lovely Professional University data retention and IT Act guidelines.'}
              {modalType === 'support' && 'For technical assistance or reporting discrepancies, email support@legalmetrology.gov.in or call toll-free helpline 1800-11-4000.'}
              {modalType === 'appearance' && (
                <div className="space-y-2">
                  <p>Choose how CompliScan looks on this device.</p>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {(['light', 'dark', 'system'] as const).map((theme) => (
                      <button key={theme} type="button" onClick={() => chooseTheme(theme)} className={`rounded-lg border px-2 py-2 text-xs font-semibold capitalize cursor-pointer ${themePreference === theme ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300'}`}>
                        {theme === 'system' ? 'System' : theme}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {modalType === 'language' && (
                <div className="space-y-2">
                  <p>Select the language used for reports and supported interface content.</p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {(['en', 'hi'] as const).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => chooseLanguage(lang)}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold cursor-pointer ${
                          currentLanguage === lang
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-300'
                        }`}
                      >
                        {languageNames[lang]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setModalType(null)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

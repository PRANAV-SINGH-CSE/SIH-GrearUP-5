'use client';

import React from 'react';

export type NavTabId = 'home' | 'history' | 'reports' | 'settings';

export interface BottomNavProps {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-md">
      <div className="max-w-lg mx-auto grid grid-cols-4 h-16 relative">
        {/* Tab 1: Home */}
        <button
          type="button"
          onClick={() => onTabChange('home')}
          className={`relative flex flex-col items-center justify-center transition-colors cursor-pointer ${
            activeTab === 'home' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-700 font-medium'
          }`}
        >
          {activeTab === 'home' && (
            <span className="absolute top-0 w-10 h-0.75 bg-blue-600 rounded-full" />
          )}
          <svg
            className="w-6 h-6 mb-1"
            viewBox="0 0 24 24"
            fill={activeTab === 'home' ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={activeTab === 'home' ? '1.5' : '2'}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 20v-9.5z" />
            <polyline points="9 21 9 12 15 12 15 21" stroke={activeTab === 'home' ? '#ffffff' : 'currentColor'} strokeWidth="1.8" />
          </svg>
          <span className="text-[11px] leading-none">Home</span>
        </button>

        {/* Tab 2: History */}
        <button
          type="button"
          onClick={() => onTabChange('history')}
          className={`relative flex flex-col items-center justify-center transition-colors cursor-pointer ${
            activeTab === 'history' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-700 font-medium'
          }`}
        >
          {activeTab === 'history' && (
            <span className="absolute top-0 w-10 h-0.75 bg-blue-600 rounded-full" />
          )}
          <svg
            className="w-6 h-6 mb-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" fill={activeTab === 'history' ? '#2563eb' : 'none'} />
            <polyline
              points="12 7 12 12 15 15"
              stroke={activeTab === 'history' ? '#ffffff' : 'currentColor'}
              strokeWidth="2"
            />
          </svg>
          <span className="text-[11px] leading-none">History</span>
        </button>

        {/* Tab 3: Reports */}
        <button
          type="button"
          onClick={() => onTabChange('reports')}
          className={`relative flex flex-col items-center justify-center transition-colors cursor-pointer ${
            activeTab === 'reports' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-700 font-medium'
          }`}
        >
          {activeTab === 'reports' && (
            <span className="absolute top-0 w-10 h-0.75 bg-blue-600 rounded-full" />
          )}
          <svg
            className="w-6 h-6 mb-1"
            viewBox="0 0 24 24"
            fill={activeTab === 'reports' ? '#2563eb' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" stroke={activeTab === 'reports' ? '#ffffff' : 'currentColor'} />
            <line x1="16" y1="17" x2="8" y2="17" stroke={activeTab === 'reports' ? '#ffffff' : 'currentColor'} />
            <polyline points="10 9 9 9 8 9" stroke={activeTab === 'reports' ? '#ffffff' : 'currentColor'} />
          </svg>
          <span className="text-[11px] leading-none">Reports</span>
        </button>

        {/* Tab 4: Settings */}
        <button
          type="button"
          onClick={() => onTabChange('settings')}
          className={`relative flex flex-col items-center justify-center transition-colors cursor-pointer ${
            activeTab === 'settings' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-700 font-medium'
          }`}
        >
          {activeTab === 'settings' && (
            <span className="absolute top-0 w-10 h-0.75 bg-blue-600 rounded-full" />
          )}
          <svg
            className="w-6 h-6 mb-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" fill={activeTab === 'settings' ? '#2563eb' : 'none'} />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span className="text-[11px] leading-none">Settings</span>
        </button>
      </div>
    </nav>
  );
}

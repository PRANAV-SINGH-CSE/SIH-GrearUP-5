'use client';

import React, { useState, useRef, useEffect } from 'react';
import { NationalEmblem } from './ui-assets';

export interface AppHeaderProps {
  currentLanguage: 'en' | 'hi' | 'mr' | 'ta' | 'gu';
  onLanguageChange: (lang: 'en' | 'hi' | 'mr' | 'ta' | 'gu') => void;
}

const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
] as const;

export function AppHeader({ currentLanguage, onLanguageChange }: AppHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLangObj = LANGUAGES.find((l) => l.code === currentLanguage) || LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-4 pt-[max(3rem,env(safe-area-inset-top,0px)+0.75rem)] pb-3.5 sm:pt-5 sm:pb-3.5 flex items-center justify-between shadow-xs">
      {/* Left: Emblem & Department Info */}
      <div className="flex items-center gap-3">
        <NationalEmblem className="w-9 h-11" />
        <div className="flex flex-col">
          <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-tight">
            Department of Legal Metrology
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Lovely Professional University
          </span>
        </div>
      </div>

      {/* Right: Language Pill Selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-full transition-colors cursor-pointer"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          {/* Globe Icon */}
          <svg
            className="w-4 h-4 text-slate-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span>{currentLangObj.label}</span>
          {/* Chevron Down */}
          <svg
            className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Select Language
            </div>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  onLanguageChange(lang.code as any);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 text-xs sm:text-sm flex items-center justify-between transition-colors ${
                  currentLanguage === lang.code
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{lang.nativeLabel} ({lang.label})</span>
                {currentLanguage === lang.code && (
                  <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

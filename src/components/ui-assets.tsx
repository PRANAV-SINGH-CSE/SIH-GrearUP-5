'use client';

import React from 'react';

/**
 * State Emblem of India (Lion Capital of Ashoka)
 */
export function NationalEmblem({ className = 'w-10 h-12' }: { className?: string }) {
  return (
    <div className={`relative flex flex-col items-center justify-center shrink-0 ${className}`}>
      <svg
        viewBox="0 0 100 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-slate-800"
      >
        {/* Lion heads & bodies */}
        <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="#1e293b">
          {/* Central Lion */}
          <path d="M42 22 C42 14, 58 14, 58 22 C61 22, 63 26, 61 30 C64 33, 62 38, 59 40 C57 48, 43 48, 41 40 C38 38, 36 33, 39 30 C37 26, 39 22, 42 22 Z" fill="#334155" />
          <circle cx="47" cy="27" r="1.5" fill="#f8fafc" />
          <circle cx="53" cy="27" r="1.5" fill="#f8fafc" />
          <path d="M48 31 Q50 33 52 31" stroke="#f8fafc" strokeWidth="1.5" fill="none" />
          {/* Central Lion Mane & Chest */}
          <path d="M38 41 Q50 48 62 41 L65 58 Q50 63 35 58 Z" fill="#1e293b" />
          
          {/* Left Lion */}
          <path d="M28 26 C28 20, 40 20, 40 27 C38 34, 30 38, 25 35 C23 32, 24 28, 28 26 Z" fill="#334155" />
          <circle cx="31" cy="29" r="1.2" fill="#f8fafc" />
          <path d="M21 37 Q32 42 37 47 L33 60 Q24 57 19 50 Z" fill="#1e293b" />

          {/* Right Lion */}
          <path d="M72 26 C72 20, 60 20, 60 27 C62 34, 70 38, 75 35 C77 32, 76 28, 72 26 Z" fill="#334155" />
          <circle cx="69" cy="29" r="1.2" fill="#f8fafc" />
          <path d="M79 37 Q68 42 63 47 L67 60 Q76 57 81 50 Z" fill="#1e293b" />

          {/* Abacus pedestal platform */}
          <rect x="18" y="62" width="64" height="15" rx="3" fill="#334155" stroke="currentColor" strokeWidth="2" />
          
          {/* Ashoka Chakra in Center */}
          <circle cx="50" cy="69.5" r="5.5" stroke="#f8fafc" strokeWidth="1.2" fill="#1e293b" />
          <circle cx="50" cy="69.5" r="1.5" fill="#f8fafc" />
          <line x1="50" y1="64" x2="50" y2="75" stroke="#f8fafc" strokeWidth="0.8" />
          <line x1="44.5" y1="69.5" x2="55.5" y2="69.5" stroke="#f8fafc" strokeWidth="0.8" />
          <line x1="46" y1="65.5" x2="54" y2="73.5" stroke="#f8fafc" strokeWidth="0.8" />
          <line x1="46" y1="73.5" x2="54" y2="65.5" stroke="#f8fafc" strokeWidth="0.8" />

          {/* Bull & Horse silhouettes on abacus sides */}
          {/* Left horse */}
          <path d="M26 73 C25 70, 27 67, 30 67 C32 68, 33 71, 31 73 Z" fill="#94a3b8" />
          {/* Right bull */}
          <path d="M70 73 C69 70, 71 67, 74 67 C76 68, 77 71, 75 73 Z" fill="#94a3b8" />

          {/* Bell-shaped Lotus Base */}
          <path d="M22 77 Q50 82 78 77 L75 88 Q50 93 25 88 Z" fill="#1e293b" stroke="currentColor" strokeWidth="1.8" />
          <path d="M30 80 Q35 86 40 80" fill="none" stroke="#64748b" strokeWidth="1.2" />
          <path d="M45 81 Q50 87 55 81" fill="none" stroke="#64748b" strokeWidth="1.2" />
          <path d="M60 80 Q65 86 70 80" fill="none" stroke="#64748b" strokeWidth="1.2" />
        </g>
        {/* Devanagari text: सत्यमेव जयते */}
        <text
          x="50"
          y="108"
          textAnchor="middle"
          fontSize="11"
          fontWeight="bold"
          fill="#1e293b"
          fontFamily="serif"
          letterSpacing="1"
        >
          सत्यमेव जयते
        </text>
      </svg>
    </div>
  );
}

/**
 * Hero Line-art illustration of packaged goods with "Fair Markets Stronger Consumers"
 */
export function HeroIllustration({ className = 'w-48 h-40' }: { className?: string }) {
  return (
    <div className={`relative shrink-0 flex items-center justify-center ${className}`}>
      {/* Soft circular aura background */}
      <div className="absolute -right-4 -top-2 w-44 h-44 rounded-full bg-blue-100/60 blur-xl pointer-events-none" />
      
      <svg
        viewBox="0 0 240 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 overflow-visible"
      >
        {/* Background ambient circle */}
        <circle cx="160" cy="95" r="70" fill="#e0f2fe" fillOpacity="0.45" />

        {/* Hand-drawn / cursive curved text: Fair Markets / Stronger Consumers */}
        <path id="curveFair" d="M 125 45 Q 165 25 215 45" fill="none" stroke="transparent" />
        <text fill="#64748b" fontSize="13.5" fontWeight="600" fontStyle="italic" letterSpacing="0.4">
          <textPath href="#curveFair" startOffset="50%" textAnchor="middle">
            Fair Markets
          </textPath>
        </text>

        <path id="curveStronger" d="M 128 64 Q 170 44 225 64" fill="none" stroke="transparent" />
        <text fill="#94a3b8" fontSize="12" fontWeight="500" fontStyle="italic" letterSpacing="0.3">
          <textPath href="#curveStronger" startOffset="50%" textAnchor="middle">
            Stronger Consumers
          </textPath>
        </text>

        {/* --- Product Line-art Objects --- */}
        <g stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="#ffffff">
          {/* Tall Bottle in background */}
          {/* Cap */}
          <rect x="98" y="52" width="14" height="8" rx="2" fill="#eff6ff" stroke="#60a5fa" strokeWidth="1.8" />
          <rect x="100" y="60" width="10" height="5" fill="#dbeafe" stroke="#60a5fa" strokeWidth="1.8" />
          {/* Neck & Body */}
          <path
            d="M100 65 L94 76 Q90 84 90 95 L90 155 Q90 160 95 160 L115 160 Q120 160 120 155 L120 95 Q120 84 116 76 L110 65 Z"
            fill="#f8fafc"
            stroke="#60a5fa"
            strokeWidth="2"
          />
          {/* Bottle label */}
          <rect x="94" y="100" width="22" height="30" rx="3" fill="#ffffff" stroke="#93c5fd" strokeWidth="1.5" />
          <line x1="97" y1="108" x2="113" y2="108" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="97" y1="114" x2="110" y2="114" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="97" y1="120" x2="106" y2="120" stroke="#cbd5e1" strokeWidth="1.5" />

          {/* Rectangular Carton Box (Middle Right) */}
          <g stroke="#64748b" strokeWidth="2">
            <rect x="118" y="85" width="40" height="65" rx="3" fill="#ffffff" stroke="#60a5fa" strokeWidth="2" />
            <path d="M118 97 L158 97" stroke="#93c5fd" strokeWidth="1.5" />
            {/* Box Front Detail */}
            <rect x="124" y="104" width="24" height="24" rx="2" fill="#eff6ff" stroke="#93c5fd" strokeWidth="1.2" />
            <line x1="129" y1="112" x2="143" y2="112" stroke="#60a5fa" strokeWidth="1.5" />
            <line x1="129" y1="118" x2="139" y2="118" stroke="#93c5fd" strokeWidth="1.5" />
          </g>

          {/* Smaller Front Box (Lower Left) */}
          <rect x="80" y="122" width="34" height="38" rx="2" fill="#ffffff" stroke="#60a5fa" strokeWidth="2" />
          <line x1="86" y1="134" x2="106" y2="134" stroke="#94a3b8" strokeWidth="1.5" />
          <line x1="86" y1="140" x2="102" y2="140" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="86" y1="146" x2="96" y2="146" stroke="#cbd5e1" strokeWidth="1.5" />

          {/* Upright Snack Pouch / Bag (Front Right) */}
          <path
            d="M152 108 C158 108, 168 110, 172 108 L175 160 C170 162, 155 162, 149 160 Z"
            fill="#ffffff"
            stroke="#60a5fa"
            strokeWidth="2"
          />
          {/* Pouch crimped edges */}
          <line x1="151" y1="110" x2="173" y2="110" stroke="#93c5fd" strokeWidth="2" strokeDasharray="2 2" />
          <line x1="148" y1="158" x2="176" y2="158" stroke="#93c5fd" strokeWidth="2" strokeDasharray="2 2" />
          {/* Pouch center window */}
          <rect x="156" y="122" width="12" height="18" rx="3" fill="#eff6ff" stroke="#93c5fd" strokeWidth="1.2" />
          <line x1="158" y1="128" x2="166" y2="128" stroke="#60a5fa" strokeWidth="1.2" />
          <line x1="158" y1="133" x2="164" y2="133" stroke="#93c5fd" strokeWidth="1.2" />
        </g>
      </svg>
    </div>
  );
}

/**
 * Realistic Product Thumbnail 1: Lay's Classic Salted
 */
export function LaysThumbnail({ className = 'w-16 h-16' }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 rounded-xl overflow-hidden bg-amber-50/50 p-1 border border-slate-100 ${className}`}>
      <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        {/* Red shiny bag */}
        <defs>
          <linearGradient id="laysRed" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="40%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>
          <linearGradient id="goldRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>
        </defs>
        {/* Bag body with crinkles */}
        <path
          d="M18 15 C35 12, 65 12, 82 15 L88 105 C68 110, 32 110, 12 105 Z"
          fill="url(#laysRed)"
        />
        {/* Crimped top and bottom */}
        <line x1="16" y1="17" x2="84" y2="17" stroke="#991b1b" strokeWidth="2" strokeDasharray="2 1.5" />
        <line x1="11" y1="103" x2="89" y2="103" stroke="#991b1b" strokeWidth="2" strokeDasharray="2 1.5" />
        {/* Yellow Sunburst behind Logo */}
        <circle cx="50" cy="52" r="22" fill="url(#goldRibbon)" />
        {/* Red Lay's banner */}
        <path d="M24 50 Q50 44 76 50 Q50 58 24 50 Z" fill="#b91c1c" />
        {/* Lay's text */}
        <text x="50" y="53" textAnchor="middle" fill="#ffffff" fontWeight="900" fontSize="11" fontStyle="italic">
          Lay&apos;s
        </text>
        {/* Classic Salted pill */}
        <rect x="30" y="62" width="40" height="8" rx="4" fill="#ffffff" />
        <text x="50" y="68" textAnchor="middle" fill="#1e3a8a" fontWeight="800" fontSize="5.5">
          Classic Salted
        </text>
        {/* Crispy Potato Chips in front */}
        <ellipse cx="36" cy="85" rx="11" ry="8" fill="#fde047" stroke="#eab308" strokeWidth="1" transform="rotate(-15 36 85)" />
        <ellipse cx="64" cy="85" rx="12" ry="9" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" transform="rotate(20 64 85)" />
        <ellipse cx="50" cy="89" rx="14" ry="9" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
      </svg>
    </div>
  );
}

/**
 * Realistic Product Thumbnail 2: Amul Taaza Toned Milk
 */
export function AmulMilkThumbnail({ className = 'w-16 h-16' }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 rounded-xl overflow-hidden bg-sky-50/50 p-1 border border-slate-100 ${className}`}>
      <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        {/* Blue and white milk pouch */}
        <defs>
          <linearGradient id="milkBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="60%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>
        </defs>
        <path
          d="M16 12 C35 9, 65 9, 84 12 L87 108 C65 111, 35 111, 13 108 Z"
          fill="#ffffff"
          stroke="#0284c7"
          strokeWidth="1.5"
        />
        {/* Top blue header */}
        <path d="M16 12 C35 9, 65 9, 84 12 L85 42 Q50 48 15 42 Z" fill="url(#milkBlue)" />
        {/* Amul red script logo */}
        <text x="50" y="27" textAnchor="middle" fill="#ef4444" fontWeight="900" fontSize="13" fontStyle="italic">
          Amul
        </text>
        <text x="50" y="38" textAnchor="middle" fill="#ffffff" fontWeight="800" fontSize="7.5" letterSpacing="0.5">
          TAAZA
        </text>
        {/* Toned Milk subtitle */}
        <text x="50" y="53" textAnchor="middle" fill="#0369a1" fontWeight="700" fontSize="6">
          TONED MILK
        </text>
        {/* Amul Girl silhouette */}
        <g transform="translate(35, 58) scale(0.65)">
          {/* Head & hair */}
          <circle cx="22" cy="14" r="10" fill="#1e293b" />
          <circle cx="24" cy="16" r="8" fill="#fed7aa" />
          {/* Hair bow */}
          <polygon points="12,7 18,12 12,17" fill="#ef4444" />
          <polygon points="24,7 18,12 24,17" fill="#ef4444" />
          {/* Polka dot dress */}
          <polygon points="10,48 36,48 27,24 19,24" fill="#ef4444" />
          <circle cx="16" cy="35" r="2" fill="#ffffff" />
          <circle cx="26" cy="33" r="2" fill="#ffffff" />
          <circle cx="21" cy="42" r="2" fill="#ffffff" />
          {/* Butter toast in hand */}
          <rect x="30" y="27" width="10" height="7" rx="1.5" fill="#facc15" stroke="#b45309" strokeWidth="1" />
        </g>
        {/* Blue milk splash lines at bottom */}
        <path d="M14 98 Q50 106 86 98 L87 108 Q50 112 13 108 Z" fill="#0284c7" />
      </svg>
    </div>
  );
}

/**
 * Realistic Product Thumbnail 3: Maggi 2-Minute Noodles
 */
export function MaggiThumbnail({ className = 'w-16 h-16' }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 rounded-xl overflow-hidden bg-amber-50/50 p-1 border border-slate-100 ${className}`}>
      <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        {/* Bright yellow noodle pack */}
        <rect x="12" y="10" width="76" height="100" rx="4" fill="#facc15" stroke="#eab308" strokeWidth="1.5" />
        {/* Crimped top & bottom */}
        <line x1="12" y1="16" x2="88" y2="16" stroke="#ca8a04" strokeWidth="2" strokeDasharray="2 1.5" />
        <line x1="12" y1="104" x2="88" y2="104" stroke="#ca8a04" strokeWidth="2" strokeDasharray="2 1.5" />
        {/* Iconic Maggi Red Oval / Crest */}
        <path d="M22 24 C22 18, 78 18, 78 24 L74 44 C74 48, 26 48, 26 44 Z" fill="#dc2626" />
        <text x="50" y="36" textAnchor="middle" fill="#facc15" fontWeight="900" fontSize="13" fontStyle="italic">
          Maggi
        </text>
        {/* 2-Minute Noodles badge */}
        <rect x="25" y="47" width="50" height="9" rx="4.5" fill="#1e3a8a" />
        <text x="50" y="53.5" textAnchor="middle" fill="#ffffff" fontWeight="800" fontSize="5.5">
          2-Minute Noodles
        </text>
        {/* Bowl of noodles illustration */}
        <g transform="translate(18, 62)">
          {/* Bowl */}
          <path d="M6 22 Q32 44 58 22 Z" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
          {/* Curly Noodles */}
          <path
            d="M10 21 Q18 10 24 20 Q32 9 40 18 Q48 10 54 21"
            fill="#fef08a"
            stroke="#eab308"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M16 17 Q25 8 32 17 Q40 8 48 16"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Veggie garnish peas & carrots */}
          <circle cx="28" cy="18" r="2.5" fill="#16a34a" />
          <circle cx="38" cy="19" r="2" fill="#ea580c" />
          <circle cx="22" cy="19" r="1.8" fill="#ea580c" />
        </g>
      </svg>
    </div>
  );
}

/**
 * Realistic Product Thumbnail 4: Dove Beauty Bar
 */
export function DoveThumbnail({ className = 'w-16 h-16' }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 rounded-xl overflow-hidden bg-slate-50/50 p-1 border border-slate-100 ${className}`}>
      <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        {/* White Soap Box with soft shadow */}
        <rect x="10" y="24" width="80" height="72" rx="6" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
        {/* Blue subtle curved wave banner */}
        <path d="M11 60 Q50 50 89 68 L89 90 Q50 96 11 90 Z" fill="#f0f9ff" opacity="0.6" />
        {/* Dove Bird Logo in gold/blue */}
        <path
          d="M58 36 C64 36, 72 38, 76 43 C70 43, 64 42, 60 45 C56 48, 55 52, 48 49 C44 47, 42 43, 44 41 C46 39, 52 36, 58 36 Z"
          fill="#d97706"
        />
        {/* Dove Typography */}
        <text x="32" y="47" textAnchor="middle" fill="#1e3a8a" fontWeight="700" fontSize="13" fontStyle="italic">
          Dove
        </text>
        {/* beauty bar text */}
        <text x="32" y="55" textAnchor="middle" fill="#64748b" fontWeight="500" fontSize="5">
          beauty cream bar
        </text>
        {/* 1/4 moisturizing cream badge */}
        <g transform="translate(48, 62)">
          <circle cx="18" cy="18" r="14" fill="#ffffff" stroke="#93c5fd" strokeWidth="1" />
          <text x="18" y="16" textAnchor="middle" fill="#2563eb" fontWeight="800" fontSize="7">
            ¼
          </text>
          <text x="18" y="23" textAnchor="middle" fill="#64748b" fontWeight="600" fontSize="3.5">
            moisturizer
          </text>
        </g>
      </svg>
    </div>
  );
}

/**
 * Realistic Product Thumbnail 5: Parle-G Biscuits
 */
export function ParleGThumbnail({ className = 'w-16 h-16' }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 rounded-xl overflow-hidden bg-amber-50/50 p-1 border border-slate-100 ${className}`}>
      <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        {/* Yellow-cream Biscuit Wrapper with red and white borders */}
        <rect x="10" y="15" width="80" height="90" rx="3" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
        {/* Red & green top banner stripe */}
        <rect x="10" y="15" width="80" height="8" fill="#16a34a" />
        <rect x="10" y="23" width="80" height="6" fill="#dc2626" />
        {/* Parle-G Girl on left */}
        <g transform="translate(14, 38)">
          <circle cx="16" cy="16" r="13" fill="#fed7aa" stroke="#ca8a04" strokeWidth="1" />
          {/* Hair */}
          <path d="M4 14 C4 4, 28 4, 28 14 C28 10, 24 6, 16 6 C8 6, 4 10, 4 14 Z" fill="#1e293b" />
          {/* Eyes & smile */}
          <circle cx="12" cy="14" r="1.5" fill="#1e293b" />
          <circle cx="20" cy="14" r="1.5" fill="#1e293b" />
          <path d="M13 20 Q16 23 19 20" stroke="#b91c1c" strokeWidth="1.2" fill="none" />
          {/* Cheeks */}
          <circle cx="9" cy="18" r="2" fill="#fca5a5" opacity="0.6" />
          <circle cx="23" cy="18" r="2" fill="#fca5a5" opacity="0.6" />
        </g>
        {/* Parle-G Bold Red Brand Typography */}
        <rect x="42" y="38" width="44" height="22" rx="3" fill="#dc2626" />
        <text x="64" y="54" textAnchor="middle" fill="#ffffff" fontWeight="900" fontSize="10">
          Parle-G
        </text>
        {/* Golden Biscuit pattern at bottom */}
        <rect x="15" y="72" width="70" height="24" rx="2" fill="#f59e0b" stroke="#b45309" strokeWidth="1.2" />
        <line x1="20" y1="76" x2="80" y2="76" stroke="#d97706" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="20" y1="91" x2="80" y2="91" stroke="#d97706" strokeWidth="1" strokeDasharray="3 3" />
        <text x="50" y="86" textAnchor="middle" fill="#78350f" fontWeight="800" fontSize="6.5">
          GLUCO BISCUITS
        </text>
      </svg>
    </div>
  );
}

/**
 * Realistic Product Thumbnail 6: Dettol Antiseptic Liquid
 */
export function DettolThumbnail({ className = 'w-16 h-16' }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 rounded-xl overflow-hidden bg-emerald-50/50 p-1 border border-slate-100 ${className}`}>
      <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        {/* Translucent Amber Liquid Bottle */}
        <defs>
          <linearGradient id="amberLiquid" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="60%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
        </defs>
        {/* White Bottle Cap */}
        <rect x="42" y="10" width="16" height="12" rx="2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
        <line x1="44" y1="14" x2="56" y2="14" stroke="#94a3b8" strokeWidth="1" />
        <line x1="44" y1="18" x2="56" y2="18" stroke="#94a3b8" strokeWidth="1" />
        {/* Neck */}
        <rect x="44" y="22" width="12" height="6" fill="#fef3c7" stroke="#ca8a04" strokeWidth="1.2" />
        {/* Amber Flask Body */}
        <path
          d="M44 28 C30 35, 24 45, 24 60 L24 98 C24 105, 30 110, 38 110 L62 110 C70 110, 76 105, 76 98 L76 60 C76 45, 70 35, 56 28 Z"
          fill="url(#amberLiquid)"
          stroke="#b45309"
          strokeWidth="1.5"
        />
        {/* Gloss highlight on left side of bottle */}
        <path d="M28 58 L28 98 Q28 104 34 105" stroke="#fef3c7" strokeWidth="2" strokeLinecap="round" opacity="0.6" fill="none" />
        {/* Iconic Green Dettol Oval Label */}
        <ellipse cx="50" cy="72" rx="20" ry="24" fill="#15803d" stroke="#ffffff" strokeWidth="2" />
        {/* White Sword Cross inside green oval */}
        <g transform="translate(50, 68)">
          {/* Vertical blade */}
          <line x1="0" y1="-14" x2="0" y2="14" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
          {/* Guard */}
          <line x1="-7" y1="-4" x2="7" y2="-4" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
          {/* Pommel */}
          <circle cx="0" cy="-16" r="1.5" fill="#ffffff" />
        </g>
        {/* Dettol Text */}
        <text x="50" y="88" textAnchor="middle" fill="#ffffff" fontWeight="900" fontSize="7">
          Dettol
        </text>
      </svg>
    </div>
  );
}

/**
 * Helper to get the correct product thumbnail component based on product name or image URL
 */
export function ProductImageThumbnail({
  productName,
  imageUrl,
  className = 'w-14 h-14',
}: {
  productName: string;
  imageUrl?: string;
  className?: string;
}) {
  const name = (productName || '').toLowerCase();

  if (name.includes("lay's") || name.includes('lays') || name.includes('potato') || name.includes('salted')) {
    return <LaysThumbnail className={className} />;
  }
  if (name.includes('amul') || name.includes('taaza') || name.includes('milk')) {
    return <AmulMilkThumbnail className={className} />;
  }
  if (name.includes('maggi') || name.includes('noodle')) {
    return <MaggiThumbnail className={className} />;
  }
  if (name.includes('dove') || name.includes('soap') || name.includes('beauty bar')) {
    return <DoveThumbnail className={className} />;
  }
  if (name.includes('parle') || name.includes('biscuit')) {
    return <ParleGThumbnail className={className} />;
  }
  if (name.includes('dettol') || name.includes('antiseptic')) {
    return <DettolThumbnail className={className} />;
  }

  // If there's an actual uploaded image URL, display it
  if (imageUrl && !imageUrl.startsWith('data:image/svg')) {
    return (
      <div className={`relative flex items-center justify-center shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={productName} className="w-full h-full object-cover" />
      </div>
    );
  }

  // Fallback generic product icon
  return (
    <div className={`relative flex items-center justify-center shrink-0 rounded-xl bg-blue-50 border border-blue-100 ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" className="w-7 h-7">
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M9 7h6M9 11h6M9 15h4" />
      </svg>
    </div>
  );
}

/**
 * India Gate Line-art sketch for Desktop Sidebar Bottom
 */
export function IndiaGateSidebarGraphic({ className = 'w-full' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center text-center p-3 text-white/80 ${className}`}>
      {/* Leaf icon & slogan */}
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300 mb-2">
        <svg className="w-4 h-4 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66 1.05-2.62c4.47-1.3 9.24-4.5 10.24-11.38z" />
          <path d="M20.29 2c-3.15.53-7.53 2.5-9.29 6.2 3.1.58 6.54 2.22 8 5.8 1.4-3.5 1.76-8.5 1.29-12z" />
        </svg>
        <span>For a Fairer and Safer Marketplace</span>
      </div>

      {/* India Gate Line Drawing */}
      <svg viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-28 h-24 stroke-slate-500/70">
        {/* Top Pedestal & Dome */}
        <path d="M72 12 h16 v6 h-16 z" strokeWidth="1.2" />
        <path d="M60 18 h40 v6 h-40 z" strokeWidth="1.4" />
        <path d="M48 24 h64 v8 h-64 z" strokeWidth="1.5" />
        <path d="M40 32 h80 v10 h-80 z" strokeWidth="1.5" />

        {/* Inscription bar */}
        <line x1="44" y1="37" x2="116" y2="37" strokeWidth="0.8" />
        <line x1="44" y1="39" x2="116" y2="39" strokeWidth="0.8" />

        {/* Pylons */}
        <path d="M44 42 v68 h24 v-44 q12 -12 24 0 v44 h24 v-68 z" strokeWidth="1.8" />

        {/* Inner Arch Details */}
        <path d="M68 66 q12 -10 24 0 v44 h-24 z" strokeWidth="1.2" strokeDasharray="2 2" />
        <line x1="44" y1="52" x2="68" y2="52" strokeWidth="0.8" />
        <line x1="92" y1="52" x2="116" y2="52" strokeWidth="0.8" />
        <line x1="44" y1="64" x2="68" y2="64" strokeWidth="0.8" />
        <line x1="92" y1="64" x2="116" y2="64" strokeWidth="0.8" />

        {/* Base Steps */}
        <path d="M34 110 h92 v6 h-92 z" strokeWidth="1.5" />
        <path d="M26 116 h108 v6 h-108 z" strokeWidth="1.5" />
        <path d="M18 122 h124 v6 h-124 z" strokeWidth="1.5" />
      </svg>

      {/* Slogan & Tricolor Accent */}
      <div className="mt-1 text-[11px] font-semibold text-slate-300">
        Compliant India
      </div>
      <div className="text-[10px] text-slate-400">
        Stronger Tomorrow
      </div>
      <div className="mt-2 flex items-center justify-center gap-1">
        <div className="w-4 h-1 rounded-full bg-[#FF9933]" />
        <div className="w-4 h-1 rounded-full bg-white" />
        <div className="w-4 h-1 rounded-full bg-[#138808]" />
      </div>
    </div>
  );
}

/**
 * Indian Historical Monuments Skyline Silhouette (for Desktop Landing Footer)
 */
export function IndianMonumentsSkyline({ className = 'w-full h-24' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden flex items-end justify-center ${className}`}>
      <svg
        viewBox="0 0 1200 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-slate-300/60"
      >
        {/* Background faded monuments skyline */}
        <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="#F8FAFC" fillOpacity="0.4">
          {/* Taj Mahal Silhouette Left */}
          <path d="M80 150 v-30 h10 v-15 h6 v-10 q24 -24 48 0 v10 h6 v15 h10 v30 z" />
          <path d="M120 95 v-15" strokeWidth="1.5" />
          <path d="M50 150 v-40 h6 v40 M194 150 v-40 h6 v40" />

          {/* Lotus Temple Middle Left */}
          <path d="M260 150 q20 -45 40 -50 q20 5 40 50 Z" />
          <path d="M280 150 q20 -60 30 -65 q10 5 30 65 Z" />

          {/* India Gate Center */}
          <path d="M420 150 v-55 h20 v-35 h60 v35 h20 v55 h-20 v-35 q-10 -10 -20 0 v35 z" strokeWidth="1.6" />
          <line x1="440" y1="65" x2="500" y2="65" strokeWidth="1.8" />
          <line x1="445" y1="72" x2="495" y2="72" strokeWidth="1" />

          {/* Red Fort / Qutub Minar Middle Right */}
          <path d="M660 150 v-65 h12 v65 M690 150 v-40 h40 v40 M750 150 v-50 h25 v50" />
          <path d="M780 150 v-75 h8 v-15 h4 v15 h8 v75 z" />

          {/* Parliament / Temple Right */}
          <path d="M900 150 v-30 h80 v30 z" />
          <path d="M910 120 q30 -30 60 0 z" />
          <path d="M1040 150 v-50 h15 v-20 h10 v20 h15 v50 z" />
        </g>
        {/* Ground line */}
        <line x1="0" y1="150" x2="1200" y2="150" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

/**
 * FarmBite Chips Hero Graphic with AI Recognition Reticle and Floating Compliance Card
 */
export function FarmBiteChipsHeroGraphic({
  onViewReport,
}: {
  onViewReport?: () => void;
}) {
  return (
    <div className="relative w-full max-w-[540px] aspect-[4/3] flex items-center justify-center select-none">
      {/* Hand-drawn Slogan Tag Top Right */}
      <div className="absolute -top-4 -right-2 sm:right-4 z-20 flex flex-col items-center rotate-6">
        <span className="text-sm sm:text-base font-black tracking-tight text-slate-800 font-serif leading-tight text-right">
          Transparent<br />Markets<br />Stronger<br />Consumers
        </span>
        {/* Tricolor Accent Stripe */}
        <div className="mt-1 flex items-center gap-1">
          <div className="w-5 h-1 rounded-full bg-[#FF9933]" />
          <div className="w-5 h-1 rounded-full bg-slate-400" />
          <div className="w-5 h-1 rounded-full bg-[#138808]" />
        </div>
      </div>

      {/* AI Recognition Reticle Corner Brackets */}
      <div className="absolute inset-x-8 inset-y-4 pointer-events-none z-10">
        {/* Top-Left Reticle */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl shadow-xs" />
        {/* Top-Right Reticle */}
        <div className="absolute top-0 right-16 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl shadow-xs" />
        {/* Bottom-Left Reticle */}
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl shadow-xs" />
        {/* Bottom-Right Reticle */}
        <div className="absolute bottom-0 right-16 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl shadow-xs" />
      </div>

      {/* Floating Pill: AI-powered label recognition */}
      <div className="absolute top-24 left-2 z-20 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-slate-200/80 flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-300">
        <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <rect x="9" y="9" width="6" height="6" />
            <line x1="9" y1="1" x2="9" y2="4" />
            <line x1="15" y1="1" x2="15" y2="4" />
            <line x1="9" y1="20" x2="9" y2="23" />
            <line x1="15" y1="20" x2="15" y2="23" />
            <line x1="20" y1="9" x2="23" y2="9" />
            <line x1="20" y1="14" x2="23" y2="14" />
            <line x1="1" y1="9" x2="4" y2="9" />
            <line x1="1" y1="14" x2="4" y2="14" />
          </svg>
        </div>
        <span className="text-xs font-bold text-slate-800">AI-powered label recognition</span>
        {/* Dotted pointer curve line */}
        <svg className="w-8 h-6 text-slate-400 absolute -right-8 top-3" viewBox="0 0 32 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3">
          <path d="M0 8 Q16 8 28 20" />
        </svg>
      </div>

      {/* FarmBite Bag & Chips Composition */}
      <div className="relative w-64 h-80 sm:w-72 sm:h-92 flex items-center justify-center">
        <svg viewBox="0 0 300 400" className="w-full h-full drop-shadow-2xl">
          <defs>
            <linearGradient id="bagGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#DC2626" />
              <stop offset="35%" stopColor="#B91C1C" />
              <stop offset="100%" stopColor="#991B1B" />
            </linearGradient>
            <linearGradient id="whiteBanner" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F8FAFC" />
            </linearGradient>
            <linearGradient id="chipGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="60%" stopColor="#FACC15" />
              <stop offset="100%" stopColor="#CA8A04" />
            </linearGradient>
          </defs>

          {/* Bag Foil Body */}
          <path
            d="M35 35 Q150 25 265 35 L280 365 Q150 380 20 365 Z"
            fill="url(#bagGradient)"
            stroke="#991B1B"
            strokeWidth="3"
          />

          {/* Top & Bottom Seal Ribs */}
          <path d="M35 35 Q150 25 265 35 L263 50 Q150 40 37 50 Z" fill="#7F1D1D" opacity="0.6" />
          <path d="M22 350 Q150 365 278 350 L280 365 Q150 380 20 365 Z" fill="#7F1D1D" opacity="0.6" />

          {/* White Center Panel */}
          <path
            d="M42 90 Q150 82 258 90 L268 280 Q150 295 32 280 Z"
            fill="url(#whiteBanner)"
            stroke="#E2E8F0"
            strokeWidth="1.5"
          />

          {/* FarmBite Red Ribbon Brand Logo */}
          <path d="M60 105 Q150 96 240 105 L235 145 Q150 135 65 145 Z" fill="#DC2626" />
          <text x="150" y="132" textAnchor="middle" fill="#FFFFFF" fontSize="24" fontWeight="900" fontFamily="sans-serif">
            FarmBite
          </text>
          <text x="150" y="143" textAnchor="middle" fill="#FEF08A" fontSize="7" fontWeight="bold" letterSpacing="1">
            Good Food. Better Today.
          </text>

          {/* Product Title */}
          <text x="150" y="180" textAnchor="middle" fill="#0F172A" fontSize="26" fontWeight="900" fontFamily="sans-serif">
            Classic
          </text>
          <text x="150" y="210" textAnchor="middle" fill="#0F172A" fontSize="24" fontWeight="800" fontFamily="sans-serif">
            Potato Chips
          </text>

          {/* Flavor Pill Banner */}
          <rect x="75" y="222" width="150" height="24" rx="12" fill="#DC2626" />
          <text x="150" y="238" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="bold" fontFamily="serif" fontStyle="italic">
            Simply Salted
          </text>

          {/* Green 100% Real Potatoes Stamp */}
          <circle cx="230" cy="255" r="22" fill="#FFFFFF" stroke="#16A34A" strokeWidth="2.5" />
          <text x="230" y="248" textAnchor="middle" fill="#16A34A" fontSize="7" fontWeight="bold">MADE WITH</text>
          <text x="230" y="260" textAnchor="middle" fill="#16A34A" fontSize="11" fontWeight="900">100%</text>
          <text x="230" y="269" textAnchor="middle" fill="#16A34A" fontSize="6" fontWeight="bold">REAL POTATOES</text>

          {/* Crisp Rippled Potato Chips Illustrations */}
          <ellipse cx="60" cy="315" rx="35" ry="25" fill="#EAB308" transform="rotate(-15 60 315)" />
          <ellipse cx="60" cy="315" rx="32" ry="22" fill="url(#chipGrad)" transform="rotate(-15 60 315)" />
          
          <ellipse cx="110" cy="320" rx="42" ry="30" fill="#EAB308" transform="rotate(-5 110 320)" />
          <ellipse cx="110" cy="320" rx="38" ry="26" fill="url(#chipGrad)" transform="rotate(-5 110 320)" />

          <ellipse cx="165" cy="315" rx="45" ry="28" fill="#EAB308" transform="rotate(10 165 315)" />
          <ellipse cx="165" cy="315" rx="40" ry="24" fill="url(#chipGrad)" transform="rotate(10 165 315)" />

          {/* Salt Bowl Right */}
          <ellipse cx="235" cy="335" rx="26" ry="12" fill="#0F172A" />
          <ellipse cx="235" cy="330" rx="24" ry="9" fill="#F8FAFC" />
          <ellipse cx="235" cy="328" rx="18" ry="6" fill="#FFFFFF" />
        </svg>
      </div>

      {/* Floating Glassmorphic Compliance Card */}
      <div className="absolute -bottom-4 right-0 sm:-right-6 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-slate-200/80 w-64 sm:w-72 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Compliant Status Header */}
        <div className="flex items-start gap-2.5 pb-2.5 border-b border-slate-100">
          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-black text-slate-900 leading-tight">Compliant</div>
            <div className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
              All applicable declarations found as per LMPC Rules, 2011.
            </div>
          </div>
        </div>

        {/* 5-Item Statutory Checklist */}
        <div className="py-2.5 space-y-1.5 text-xs">
          <div className="flex items-center justify-between font-medium text-slate-700">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
              <span>Net Quantity</span>
            </div>
            <span className="text-emerald-600 font-bold">✓</span>
          </div>

          <div className="flex items-center justify-between font-medium text-slate-700">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v12M15 9.5H9a2.5 2.5 0 0 1 0-5h6" />
              </svg>
              <span>MRP Declaration</span>
            </div>
            <span className="text-emerald-600 font-bold">✓</span>
          </div>

          <div className="flex items-center justify-between font-medium text-slate-700">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              </svg>
              <span>Manufacturer Details</span>
            </div>
            <span className="text-emerald-600 font-bold">✓</span>
          </div>

          <div className="flex items-center justify-between font-medium text-slate-700">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Date Marking</span>
            </div>
            <span className="text-emerald-600 font-bold">✓</span>
          </div>

          <div className="flex items-center justify-between font-medium text-slate-700">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>Consumer Care Details</span>
            </div>
            <span className="text-emerald-600 font-bold">✓</span>
          </div>
        </div>

        {/* View Full Report Button */}
        <button
          type="button"
          onClick={onViewReport}
          className="w-full py-2 px-3 mt-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer border border-blue-200"
        >
          <span>View Full Report &rarr;</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Back of Pack Product Packaging Graphic with Bounding Box Text Detection Overlays
 */
export function DetectedTextBackOfPackGraphic({ className = 'w-full' }: { className?: string }) {
  return (
    <div className={`relative rounded-2xl overflow-hidden bg-white border border-slate-200/90 shadow-sm ${className}`}>
      <svg viewBox="0 0 400 480" className="w-full h-auto">
        <defs>
          <linearGradient id="bopGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F8FAFC" />
          </linearGradient>
        </defs>

        {/* Outer Packaging Card */}
        <rect width="400" height="480" fill="url(#bopGrad)" />

        {/* Top Header Banner */}
        <rect x="0" y="0" width="400" height="36" fill="#DC2626" />
        <text x="20" y="23" fill="#FFFFFF" fontSize="13" fontWeight="900">FarmBite Classic Potato Chips</text>
        <circle cx="360" cy="18" r="7" fill="#FFFFFF" stroke="#15803D" strokeWidth="1.5" />
        <circle cx="360" cy="18" r="3.5" fill="#15803D" />

        {/* Bounding Box 1: Ingredients */}
        <rect x="18" y="48" width="170" height="52" fill="#22C55E" fillOpacity="0.08" stroke="#16A34A" strokeWidth="1.5" strokeDasharray="3 2" rx="4" />
        <text x="24" y="62" fill="#0F172A" fontSize="9" fontWeight="bold">Ingredients:</text>
        <text x="24" y="74" fill="#475569" fontSize="7.5">Potatoes, Edible Vegetable Oil (Palmolein),</text>
        <text x="24" y="84" fill="#475569" fontSize="7.5">Iodised Salt (1.5%).</text>
        <text x="24" y="94" fill="#64748B" fontSize="7">Allergen Advice: May contain traces of soy.</text>

        {/* Bounding Box 2: Manufacturer Details */}
        <rect x="198" y="48" width="184" height="60" fill="#22C55E" fillOpacity="0.08" stroke="#16A34A" strokeWidth="1.5" strokeDasharray="3 2" rx="4" />
        <text x="204" y="62" fill="#0F172A" fontSize="8.5" fontWeight="bold">Marketed by:</text>
        <text x="204" y="73" fill="#334155" fontSize="7.5">FarmBite Foods Pvt. Ltd.</text>
        <text x="204" y="83" fill="#475569" fontSize="7">Plot 12, Green Park, Andheri (E),</text>
        <text x="204" y="93" fill="#475569" fontSize="7">Mumbai - 400069, Maharashtra, India.</text>
        <text x="204" y="103" fill="#64748B" fontSize="6.5">Country of Origin: India</text>

        {/* Bounding Box 3: FSSAI License */}
        <rect x="198" y="116" width="184" height="42" fill="#22C55E" fillOpacity="0.08" stroke="#16A34A" strokeWidth="1.5" strokeDasharray="3 2" rx="4" />
        <text x="204" y="132" fill="#0F172A" fontSize="12" fontWeight="900" fontFamily="serif">fssai</text>
        <text x="204" y="146" fill="#334155" fontSize="8" fontWeight="bold">Lic. No. 10018022001542</text>

        {/* Bounding Box 4: Nutrition Table */}
        <rect x="18" y="110" width="170" height="175" fill="#22C55E" fillOpacity="0.08" stroke="#16A34A" strokeWidth="1.5" strokeDasharray="3 2" rx="4" />
        <text x="24" y="126" fill="#0F172A" fontSize="9" fontWeight="900">NUTRITIONAL FACTS</text>
        <text x="24" y="138" fill="#64748B" fontSize="7.5">Approximate values per 100 g</text>
        <line x1="24" y1="144" x2="180" y2="144" stroke="#CBD5E1" strokeWidth="1" />
        <text x="24" y="158" fill="#334155" fontSize="8">Energy</text><text x="145" y="158" fill="#0F172A" fontSize="8" fontWeight="bold">544 kcal</text>
        <text x="24" y="174" fill="#334155" fontSize="8">Protein</text><text x="155" y="174" fill="#0F172A" fontSize="8" fontWeight="bold">6.5 g</text>
        <text x="24" y="190" fill="#334155" fontSize="8">Carbohydrate</text><text x="152" y="190" fill="#0F172A" fontSize="8" fontWeight="bold">51.2 g</text>
        <text x="24" y="206" fill="#334155" fontSize="8">Total Sugars</text><text x="155" y="206" fill="#0F172A" fontSize="8" fontWeight="bold">2.1 g</text>
        <text x="24" y="222" fill="#334155" fontSize="8">Added Sugars</text><text x="157" y="222" fill="#0F172A" fontSize="8" fontWeight="bold">0.0 g</text>
        <text x="24" y="238" fill="#334155" fontSize="8">Total Fat</text><text x="152" y="238" fill="#0F172A" fontSize="8" fontWeight="bold">34.4 g</text>
        <text x="24" y="254" fill="#334155" fontSize="8">Saturated Fat</text><text x="152" y="254" fill="#0F172A" fontSize="8" fontWeight="bold">16.1 g</text>
        <text x="24" y="270" fill="#334155" fontSize="8">Sodium</text><text x="147" y="270" fill="#0F172A" fontSize="8" fontWeight="bold">610 mg</text>

        {/* Bounding Box 5: Consumer Care */}
        <rect x="198" y="166" width="184" height="66" fill="#22C55E" fillOpacity="0.08" stroke="#16A34A" strokeWidth="1.5" strokeDasharray="3 2" rx="4" />
        <text x="204" y="180" fill="#0F172A" fontSize="8.5" fontWeight="bold">Consumer Complaints / Feedback:</text>
        <text x="204" y="191" fill="#475569" fontSize="7">Executive, Consumer Care Cell</text>
        <text x="204" y="201" fill="#334155" fontSize="7.5">FarmBite Foods Pvt. Ltd.</text>
        <text x="204" y="211" fill="#2563EB" fontSize="8" fontWeight="bold">Toll Free: 1800 210 4567</text>
        <text x="204" y="222" fill="#2563EB" fontSize="7.5">Email: care@farmbite.in</text>

        {/* Bounding Box 6: Statutory Mandatory Declaration Box (MRP, Net Qty, Dates, Batch) */}
        <rect x="18" y="296" width="170" height="96" fill="#3B82F6" fillOpacity="0.08" stroke="#2563EB" strokeWidth="1.8" rx="6" />
        <text x="24" y="314" fill="#1E40AF" fontSize="12" fontWeight="900">MRP ₹ 30.00</text>
        <text x="24" y="326" fill="#475569" fontSize="7.5">(Incl. of all taxes)</text>
        <text x="24" y="340" fill="#0F172A" fontSize="8.5" fontWeight="bold">Unit Sale Price: ₹ 0.58 / g</text>
        <text x="24" y="354" fill="#0F172A" fontSize="8">Batch No.: <tspan fontWeight="bold">FB2401</tspan></text>
        <text x="24" y="368" fill="#0F172A" fontSize="8">Mfg Date: <tspan fontWeight="bold">15 JAN 2024</tspan></text>
        <text x="24" y="382" fill="#0F172A" fontSize="8">Use By: <tspan fontWeight="bold">14 JUL 2024</tspan></text>

        {/* Bounding Box 7: Net Quantity Box */}
        <rect x="198" y="240" width="184" height="60" fill="#22C55E" fillOpacity="0.08" stroke="#16A34A" strokeWidth="1.8" rx="6" />
        <text x="204" y="258" fill="#64748B" fontSize="8.5" fontWeight="bold">NET QUANTITY:</text>
        <text x="204" y="286" fill="#0F172A" fontSize="24" fontWeight="900">52 g</text>

        {/* Barcode */}
        <g transform="translate(240, 320)">
          <rect x="0" y="0" width="2" height="40" fill="#0F172A" />
          <rect x="4" y="0" width="4" height="40" fill="#0F172A" />
          <rect x="10" y="0" width="2" height="40" fill="#0F172A" />
          <rect x="14" y="0" width="6" height="40" fill="#0F172A" />
          <rect x="22" y="0" width="2" height="40" fill="#0F172A" />
          <rect x="26" y="0" width="4" height="40" fill="#0F172A" />
          <rect x="32" y="0" width="6" height="40" fill="#0F172A" />
          <rect x="40" y="0" width="2" height="40" fill="#0F172A" />
          <rect x="44" y="0" width="4" height="40" fill="#0F172A" />
          <rect x="52" y="0" width="6" height="40" fill="#0F172A" />
          <rect x="60" y="0" width="2" height="40" fill="#0F172A" />
          <rect x="64" y="0" width="4" height="40" fill="#0F172A" />
          <rect x="70" y="0" width="2" height="40" fill="#0F172A" />
          <rect x="74" y="0" width="6" height="40" fill="#0F172A" />
          <rect x="82" y="0" width="2" height="40" fill="#0F172A" />
          <rect x="86" y="0" width="4" height="40" fill="#0F172A" />
          <text x="45" y="52" textAnchor="middle" fill="#0F172A" fontSize="9" fontWeight="bold" letterSpacing="1">
            8 906123 450027
          </text>
        </g>

        {/* Bottom Storage & Recycling notes */}
        <text x="18" y="420" fill="#64748B" fontSize="7.5">Store in a cool, dry and hygienic place.</text>
        <text x="18" y="432" fill="#64748B" fontSize="7.5">Keep away from direct sunlight.</text>
        <text x="18" y="444" fill="#64748B" fontSize="7.5">Dispose of packaging responsibly.</text>
      </svg>
    </div>
  );
}


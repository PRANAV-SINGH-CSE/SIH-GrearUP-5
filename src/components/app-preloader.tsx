'use client';

/**
 * React owns this element for its entire lifetime. Removing a server-rendered
 * sibling through document APIs during hydration can leave React with a stale
 * DOM reference and trigger an insertBefore NotFoundError.
 */
export function AppPreloader() {
  return (
    <div className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-linear-to-b from-white to-slate-50 px-6 text-center animate-[compliscan-preloader-dismiss_650ms_ease-out_forwards]">
      <div className="mb-6 flex flex-col items-center animate-pulse">
        <div className="mb-4 flex h-[68px] w-[68px] items-center justify-center rounded-[20px] bg-linear-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-500/40">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <polyline points="9 12 11 14 15 10" />
          </svg>
        </div>
        <div className="text-xs font-extrabold uppercase tracking-wide text-slate-800">Department of Legal Metrology</div>
        <div className="mt-0.5 text-[11px] font-semibold text-slate-500">Lovely Professional University</div>
        <div className="mt-2 text-[26px] font-black tracking-tight text-slate-900">Compli<span className="text-blue-600">Scan</span></div>
        <div className="mt-0.5 text-xs font-semibold text-slate-600">Scan. Verify. Stay Compliant.</div>
      </div>
      <div className="relative mb-3.5 h-1 w-45 overflow-hidden rounded-full bg-slate-200">
        <div className="absolute inset-y-0 w-[55%] animate-[compliscan-bar_1.4s_ease-in-out_infinite] rounded-full bg-linear-to-r from-orange-400 via-blue-600 to-green-600" />
      </div>
      <div className="text-xs font-semibold text-slate-500">Initializing Legal Metrology Engine...</div>
    </div>
  );
}

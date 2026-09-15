'use client';

import React from 'react';

export interface GuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GuidelinesModal({ isOpen, onClose }: GuidelinesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Legal Metrology Compliance Guidelines</h3>
              <p className="text-[11px] text-slate-500 font-medium">LMPC Rules, 2011 Key Provisions</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700">
          <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-100 text-blue-900 leading-relaxed">
            Every pre-packaged commodity in India must carry unambiguous mandatory declarations under <strong>Rule 6</strong> of the Legal Metrology (Packaged Commodities) Rules, 2011.
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl border border-slate-200/80 bg-white">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                1. Name & Address of Manufacturer / Packer (Rule 6(1)(a))
              </h4>
              <p className="mt-1 text-slate-600 leading-relaxed">
                Must state complete registered office and factory postal address. For imported goods, the importer&apos;s name and address are mandatory.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-slate-200/80 bg-white">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                2. Generic or Common Name of Commodity (Rule 6(1)(b))
              </h4>
              <p className="mt-1 text-slate-600 leading-relaxed">
                Clear generic name must be declared on the principal display panel.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-slate-200/80 bg-white">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                3. Net Quantity in Standard Metric Units (Rule 11 & 13)
              </h4>
              <p className="mt-1 text-slate-600 leading-relaxed">
                Must use standard SI symbols (<code>g</code>, <code>kg</code>, <code>ml</code>, <code>l</code>, <code>m</code>, <code>cm</code>). Prohibited symbols like <code>gms</code>, <code>kilos</code>, or <code>litres</code> are penal offenses under Section 36.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-slate-200/80 bg-white">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                4. Maximum Retail Price (MRP) (Rule 6(1)(c))
              </h4>
              <p className="mt-1 text-slate-600 leading-relaxed">
                Must explicitly state &quot;Maximum Retail Price ₹ ... (inclusive of all taxes)&quot; or &quot;MRP Rs. ... incl. of all taxes&quot;.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-slate-200/80 bg-white">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                5. Month and Year of Manufacture / Packing (Rule 6(1)(d))
              </h4>
              <p className="mt-1 text-slate-600 leading-relaxed">
                Must indicate month and year (e.g., 08/2024 or Aug 2024). For commodities with limited shelf life, &quot;Best Before&quot; or &quot;Use By&quot; date is required.
              </p>
            </div>

            <div className="p-3 rounded-xl border border-slate-200/80 bg-white">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                6. Consumer Care Contact Details (Rule 6(1)(f))
              </h4>
              <p className="mt-1 text-slate-600 leading-relaxed">
                Mandatory name/designation, address, telephone number, and email address of grievance redressal officer.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}

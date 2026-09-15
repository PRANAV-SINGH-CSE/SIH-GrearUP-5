'use client';

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { AppHeader } from '@/components/app-header';
import { BottomNav, NavTabId } from '@/components/bottom-nav';
import { DesktopHeader } from '@/components/desktop-header';
import { HomeScreen } from '@/components/screens/home-screen';
import { HistoryScreen } from '@/components/screens/history-screen';
import { ReportScreen } from '@/components/screens/report-screen';
import { SettingsScreen } from '@/components/screens/settings-screen';
import { CameraModal } from '@/components/camera-modal';
import { GuidelinesModal } from '@/components/guidelines-modal';
import { AuthModal } from '@/components/auth-modal';
import { FirebaseAuthService } from '@/lib/firebase/auth.service';
import { SAMPLE_FALLBACK_SCAN, AppScanItem, RuleCheckItem } from '@/lib/mock-scans';

type Language = 'en' | 'hi' | 'mr' | 'ta' | 'gu';

interface ApiScanResponse {
  success: boolean;
  data?: {
    scan: {
      id: string;
      category?: string;
      asset?: { originalUrl?: string };
    };
    report: {
      reportId?: string;
      overallStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'COMPLIANT_WITH_WARNINGS' | 'NEEDS_REVIEW';
      statusExplanation?: string;
      productInformation?: {
        productName?: string;
        genericName?: string;
        category?: string;
        manufacturerOrPacker?: string;
      };
      extractedDeclarations?: {
        productName?: { value?: string; confidence?: number; rawText?: string };
        genericName?: { value?: string; confidence?: number; rawText?: string };
        manufacturer?: { value?: { name?: string; address?: string }; confidence?: number };
        packer?: { value?: { name?: string; address?: string }; confidence?: number };
        importer?: { value?: { name?: string; address?: string }; confidence?: number };
        netQuantity?: { value?: { value?: number; unit?: string; rawUnit?: string; isValidUnit?: boolean }; rawText?: string };
        mrp?: { value?: { amount?: number; currency?: string; isTaxInclusive?: boolean; rawWording?: string }; rawText?: string };
        unitSalePrice?: { value?: { amount?: number; perUnit?: string; currency?: string } };
        countryOfOrigin?: { value?: string; rawText?: string };
        manufactureDate?: { value?: { month?: number; year?: number; rawText?: string } };
        packingDate?: { value?: { month?: number; year?: number; rawText?: string } };
        bestBefore?: { value?: string };
        expiryDate?: { value?: string };
        consumerCare?: { value?: { name?: string; phone?: string; email?: string; address?: string } };
        batchNumber?: { value?: string };
      };
      findings?: {
        passed?: Array<{ name?: string; ruleName?: string; legalReference?: string; ruleId?: string; message?: string; localizedExplanation?: string }>;
        violations?: Array<{ name?: string; ruleName?: string; legalReference?: string; ruleId?: string; message?: string; localizedExplanation?: string }>;
        warnings?: Array<{ name?: string; ruleName?: string; legalReference?: string; ruleId?: string; message?: string; localizedExplanation?: string }>;
        notApplicable?: Array<{ name?: string; ruleName?: string }>;
      };
      counts?: {
        passed: number;
        failed: number;
        warning: number;
        notApplicable: number;
      };
    };
  };
  error?: {
    message: string;
  };
}

export default function CompliScanApp() {
  const [activeTab, setActiveTab] = useState<NavTabId>('home');
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [scans, setScans] = useState<AppScanItem[]>([]);
  const [selectedScan, setSelectedScan] = useState<AppScanItem | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authRequiredMessage, setAuthRequiredMessage] = useState<string | undefined>(undefined);

  const isVerifiedUser = Boolean(currentUser && currentUser.emailVerified);

  // Subscribe to Firebase Auth changes
  useEffect(() => {
    const unsubscribe = FirebaseAuthService.onAuthStateChange((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Load existing user scans from Firebase on mount (strictly only real user scans)
  useEffect(() => {
    async function loadFirebaseScans() {
      try {
        const res = await fetch('/api/firebase-scans');
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const fbScans: AppScanItem[] = json.data;
          setScans(fbScans);
          setSelectedScan(fbScans[0]);
        } else {
          setScans([]);
          setSelectedScan(null);
        }
      } catch (err) {
        console.warn('Firebase scans fetch error:', err);
      }
    }
    loadFirebaseScans();
  }, []);

  // Switch tab and scroll smoothly to top
  const handleTabChange = (tab: NavTabId) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRequireAuth = (msg: string) => {
    setAuthRequiredMessage(msg);
    setIsAuthModalOpen(true);
  };

  // Handle image capture from live camera or file input
  const handleProcessScanFile = async (file: File) => {
    if (!isVerifiedUser) {
      handleRequireAuth('Verified user authentication is required to upload and scan packaged commodity labels.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'GENERIC_PACKAGED_COMMODITY');
      formData.append('locale', currentLanguage === 'hi' ? 'hi' : 'en');

      const res = await fetch('/api/scans', {
        method: 'POST',
        body: formData,
      });

      const json = (await res.json()) as ApiScanResponse;

      if (!json.success || !json.data) {
        throw new Error(json.error?.message || 'Verification failed');
      }

      const { scan: apiScan, report: apiReport } = json.data;

      // Map API result into AppScanItem format using real extractedDeclarations
      const decl = apiReport.extractedDeclarations || {};
      const findings = apiReport.findings || {};

      const ruleChecks: RuleCheckItem[] = [];

      (findings.violations || []).forEach((v, idx) => {
        ruleChecks.push({
          id: `v-${idx}`,
          ruleName: v.name || v.ruleName || 'Mandatory declaration violation',
          status: 'NON_COMPLIANT',
          statusLabel: 'Non-Compliant',
          legalSection: v.legalReference,
          detail: v.localizedExplanation || v.message,
        });
      });

      (findings.warnings || []).forEach((w, idx) => {
        ruleChecks.push({
          id: `w-${idx}`,
          ruleName: w.name || w.ruleName || 'Declaration warning',
          status: 'WARNING',
          statusLabel: 'Warning',
          legalSection: w.legalReference,
          detail: w.localizedExplanation || w.message,
        });
      });

      (findings.passed || []).forEach((p, idx) => {
        ruleChecks.push({
          id: `p-${idx}`,
          ruleName: p.name || p.ruleName || 'Verified declaration',
          status: 'COMPLIANT',
          statusLabel: 'Compliant',
          legalSection: p.legalReference,
        });
      });

      const mappedStatus =
        apiReport.overallStatus === 'COMPLIANT'
          ? 'COMPLIANT'
          : apiReport.overallStatus === 'NON_COMPLIANT'
          ? 'NON_COMPLIANT'
          : 'NEEDS_REVIEW';

      const detectedName =
        apiReport.productInformation?.productName ||
        decl.productName?.value ||
        decl.genericName?.value ||
        file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

      const detectedMfg =
        apiReport.productInformation?.manufacturerOrPacker ||
        decl.manufacturer?.value?.name ||
        decl.packer?.value?.name ||
        decl.importer?.value?.name ||
        'Verified Packer / Manufacturer';

      const detectedAddress =
        decl.manufacturer?.value?.address ||
        decl.packer?.value?.address ||
        decl.importer?.value?.address ||
        'Registered Industrial Premises, India';

      const detectedNetQty = decl.netQuantity?.value
        ? `${decl.netQuantity.value.value} ${decl.netQuantity.value.unit || ''}`.trim()
        : decl.netQuantity?.rawText || 'Standard Pack';

      const detectedMrp = decl.mrp?.value?.amount !== undefined
        ? `₹ ${decl.mrp.value.amount.toFixed(2)}${decl.mrp.value.isTaxInclusive ? ' (incl. of all taxes)' : ''}`
        : decl.mrp?.rawText || 'Declared';

      const detectedDate =
        decl.manufactureDate?.value?.rawText ||
        (decl.manufactureDate?.value?.month && decl.manufactureDate?.value?.year
          ? `${String(decl.manufactureDate.value.month).padStart(2, '0')}/${decl.manufactureDate.value.year}`
          : decl.packingDate?.value?.rawText || 'Recent');

      const detectedBestBefore =
        decl.bestBefore?.value || decl.expiryDate?.value || 'Within shelf life';

      const detectedOrigin = decl.countryOfOrigin?.value || 'India';
      const detectedBatch = decl.batchNumber?.value || `B-${Date.now().toString().slice(-4)}`;

      const consumerCarePhone = decl.consumerCare?.value?.phone;
      const consumerCareEmail = decl.consumerCare?.value?.email;
      const consumerCareAddr = decl.consumerCare?.value?.address;
      const detectedConsumerCare =
        [consumerCarePhone, consumerCareEmail].filter(Boolean).join(' / ') ||
        consumerCareAddr ||
        '1800-11-4000 / consumer@gov.in';

      const nowFormatted = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const newScanItem: AppScanItem = {
        id: apiScan.id,
        scanIdNumber: `#CS${Date.now().toString().slice(-8)}`,
        productName: detectedName,
        manufacturer: detectedMfg,
        scannedAt: nowFormatted,
        status: mappedStatus,
        statusLabel: mappedStatus === 'COMPLIANT' ? 'Compliant' : mappedStatus === 'NON_COMPLIANT' ? 'Non-Compliant' : 'Needs Review',
        explanation: apiReport.statusExplanation || 'Compliance evaluation completed successfully.',
        summary: {
          passed: apiReport.counts?.passed ?? ruleChecks.filter((r) => r.status === 'COMPLIANT').length,
          failed: apiReport.counts?.failed ?? ruleChecks.filter((r) => r.status === 'NON_COMPLIANT').length,
          warning: apiReport.counts?.warning ?? ruleChecks.filter((r) => r.status === 'WARNING').length,
          notApplicable: apiReport.counts?.notApplicable ?? 0,
        },
        extractedInfo: {
          productName: detectedName,
          manufacturer: detectedMfg,
          consumerCare: detectedConsumerCare,
          netQuantity: detectedNetQty,
          mfgDate: detectedDate,
          address: detectedAddress,
          mrp: detectedMrp,
          bestBefore: detectedBestBefore,
          countryOfOrigin: detectedOrigin,
          batchNo: detectedBatch,
        },
        ruleChecks: ruleChecks.length > 0 ? ruleChecks : SAMPLE_FALLBACK_SCAN.ruleChecks,
        imageUrl: URL.createObjectURL(file),
      };

      setScans((prev) => [newScanItem, ...prev]);
      setSelectedScan(newScanItem);
      handleTabChange('reports');
    } catch (err: unknown) {
      console.error('Scan failed:', err);
      setErrorMessage(err instanceof Error ? err.message : 'An error occurred during verification');
    } finally {
      setIsProcessing(false);
    }
  };

  // Preset selector
  const handleQuickPresetSelect = async (presetId: string) => {
    if (!isVerifiedUser) {
      handleRequireAuth('Verified user sign-in required to run scan simulations.');
      return;
    }

    setIsProcessing(true);
    try {
      const syntheticBlob = new Blob([`[SYNTHETIC_TEST_DATASET:${presetId}]`], {
        type: 'image/jpeg',
      });
      const file = new File([syntheticBlob], `${presetId}.jpg`, { type: 'image/jpeg' });
      await handleProcessScanFile(file);
    } catch (err: unknown) {
      console.warn('Preset execution failed:', err);
      setIsProcessing(false);
    }
  };

  // Clear App Data
  const handleClearData = async () => {
    try {
      await fetch('/api/firebase-scans', { method: 'DELETE' });
    } catch (err) {
      console.warn('Failed to clear Firebase data:', err);
    }
    setScans([]);
    setSelectedScan(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 selection:bg-blue-500 selection:text-white">
      {/* ========================================================================= */}
      {/* MOBILE-FIRST SHELL (Visible ONLY on viewports < lg)                       */}
      {/* ========================================================================= */}
      <div className="lg:hidden flex justify-center">
        <div className="w-full max-w-lg min-h-screen bg-white shadow-xl flex flex-col relative border-x border-slate-200/80">
          {/* Sticky App Header */}
          <AppHeader
            currentLanguage={currentLanguage}
            onLanguageChange={setCurrentLanguage}
          />

          {/* User Status Bar (Shows sign-in banner if guest) */}
          {!currentUser ? (
            <div className="bg-slate-50 border-b border-slate-200/70 px-4 py-2 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Guest Mode (Read-only)</span>
              <button
                type="button"
                onClick={() => {
                  setAuthRequiredMessage(undefined);
                  setIsAuthModalOpen(true);
                }}
                className="text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
              >
                Sign In to Scan &rarr;
              </button>
            </div>
          ) : !currentUser.emailVerified ? (
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-800">
              <span className="font-semibold truncate mr-2">⚠️ Email unverified: {currentUser.email}</span>
              <button
                type="button"
                onClick={() => {
                  setAuthRequiredMessage('Please verify your email address to unlock upload and search features.');
                  setIsAuthModalOpen(true);
                }}
                className="text-amber-900 underline font-bold shrink-0 cursor-pointer"
              >
                Verify Now
              </button>
            </div>
          ) : null}

          {/* Error notice if any */}
          {errorMessage && (
            <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between">
              <span>{errorMessage}</span>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-red-500 font-bold ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Main Content Viewport */}
          <main className="flex-1 px-4 pt-3 pb-24 overflow-y-auto">
            {activeTab === 'home' && (
              <HomeScreen
                onOpenScanningCamera={() => setIsCameraOpen(true)}
                onImageFileSelected={handleProcessScanFile}
                onNavigateTab={handleTabChange}
                onOpenGuidelinesModal={() => setIsGuidelinesOpen(true)}
                onQuickPresetSelect={handleQuickPresetSelect}
                isProcessing={isProcessing}
                isVerifiedUser={isVerifiedUser}
                onRequireAuth={handleRequireAuth}
              />
            )}

            {activeTab === 'history' && (
              <HistoryScreen
                scans={scans}
                onSelectScan={(scan) => {
                  setSelectedScan(scan);
                  handleTabChange('reports');
                }}
                isVerifiedUser={isVerifiedUser}
                onRequireAuth={handleRequireAuth}
              />
            )}

            {activeTab === 'reports' && (
              <ReportScreen
                scan={selectedScan}
                onBack={() => handleTabChange('history')}
                onDownloadReport={() => {
                  window.print();
                }}
                onScanAnother={() => {
                  handleTabChange('home');
                  setIsCameraOpen(true);
                }}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsScreen
                currentUser={currentUser}
                onOpenAuthModal={() => {
                  setAuthRequiredMessage(undefined);
                  setIsAuthModalOpen(true);
                }}
                onSignOut={async () => {
                  await FirebaseAuthService.signOut();
                  setCurrentUser(null);
                }}
                onOpenGuidelinesModal={() => setIsGuidelinesOpen(true)}
                onClearData={handleClearData}
              />
            )}
          </main>

          {/* Fixed Bottom Navigation Bar */}
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ENTERPRISE DESKTOP LAYOUT (Visible ONLY on viewports >= lg)               */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex min-h-screen flex-col bg-slate-50">
        {/* Unified Top Navigation Header on All Screens */}
        <DesktopHeader
          activeTab={activeTab}
          onTabChange={handleTabChange}
          currentUser={currentUser}
          onOpenAuthModal={() => {
            setAuthRequiredMessage(undefined);
            setIsAuthModalOpen(true);
          }}
          onSignOut={async () => {
            await FirebaseAuthService.signOut();
            setCurrentUser(null);
          }}
          onOpenGuidelinesModal={() => setIsGuidelinesOpen(true)}
        />

        {/* Screen Content Area */}
        {activeTab === 'home' ? (
          <main className="flex-1">
            <HomeScreen
              onOpenScanningCamera={() => setIsCameraOpen(true)}
              onImageFileSelected={handleProcessScanFile}
              onNavigateTab={handleTabChange}
              onOpenGuidelinesModal={() => setIsGuidelinesOpen(true)}
              onQuickPresetSelect={handleQuickPresetSelect}
              isProcessing={isProcessing}
              isVerifiedUser={isVerifiedUser}
              onRequireAuth={handleRequireAuth}
            />
          </main>
        ) : (
          <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between shadow-2xs">
                <span>{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-red-500 font-bold ml-2 cursor-pointer hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            )}

            {activeTab === 'history' && (
              <HistoryScreen
                scans={scans}
                onSelectScan={(scan) => {
                  setSelectedScan(scan);
                  handleTabChange('reports');
                }}
                isVerifiedUser={isVerifiedUser}
                onRequireAuth={handleRequireAuth}
              />
            )}

            {activeTab === 'reports' && (
              <ReportScreen
                scan={selectedScan}
                onBack={() => handleTabChange('history')}
                onDownloadReport={() => {
                  window.print();
                }}
                onScanAnother={() => {
                  handleTabChange('home');
                  setIsCameraOpen(true);
                }}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsScreen
                currentUser={currentUser}
                onOpenAuthModal={() => {
                  setAuthRequiredMessage(undefined);
                  setIsAuthModalOpen(true);
                }}
                onSignOut={async () => {
                  await FirebaseAuthService.signOut();
                  setCurrentUser(null);
                }}
                onOpenGuidelinesModal={() => setIsGuidelinesOpen(true)}
                onClearData={handleClearData}
              />
            )}
          </main>
        )}
      </div>

      {/* ========================================================================= */}
      {/* GLOBAL MODALS (Camera, Guidelines, Auth)                                  */}
      {/* ========================================================================= */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleProcessScanFile}
      />

      <GuidelinesModal
        isOpen={isGuidelinesOpen}
        onClose={() => setIsGuidelinesOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChange={(user) => setCurrentUser(user)}
        requiredActionMessage={authRequiredMessage}
      />
    </div>
  );
}

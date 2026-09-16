'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { ScanLoadingModal } from '@/components/scan-loading-modal';
import { MeasurementModal } from '@/components/measurement-modal';
import { FirebaseAuthService } from '@/lib/firebase/auth.service';
import { FirebaseService } from '@/lib/firebase/firebase.service';
import { AuthCacheService } from '@/lib/auth/auth-cache.service';
import { AppScanItem, RuleCheckItem } from '@/lib/mock-scans';
import { compressImageForUpload } from '@/lib/utils/client-image';
import { MeasurementMetadata } from '@/lib/compliance/rules/rule.interface';
import { BackgroundKeepAlive } from '@/lib/mobile/background-keepalive.service';
import { BackgroundScanService } from '@/lib/mobile/background-scan.service';
import { AuditAlertService } from '@/lib/notifications/audit-alert.service';

type Language = 'en' | 'hi';
type ThemePreference = 'light' | 'dark' | 'system';

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
      overallStatus: string;
      overallStatusLabel?: string;
      statusExplanation?: string;
      productInformation?: {
        productName?: string;
        genericName?: string;
        category?: string;
        manufacturerOrPacker?: string;
      };
      summary?: {
        passed: number;
        failed: number;
        warning: number;
        notApplicable: number;
      };
      extractedDeclarations?: {
        productName?: { value?: string };
        genericName?: { value?: string };
        manufacturer?: { value?: { name?: string; address?: string } };
        packer?: { value?: { name?: string; address?: string } };
        importer?: { value?: { name?: string; address?: string } };
        netQuantity?: { value?: { value?: number; unit?: string }; rawText?: string };
        mrp?: { value?: { amount?: number; isTaxInclusive?: boolean }; rawText?: string };
        manufactureDate?: { value?: { month?: number; year?: number; rawText?: string } };
        packingDate?: { value?: { month?: number; year?: number; rawText?: string } };
        expiryDate?: { value?: string | { day?: number; month?: number; year?: number; rawText?: string; isoString?: string; isAmbiguous?: boolean } };
        bestBefore?: { value?: string };
        countryOfOrigin?: { value?: string };
        consumerCare?: { value?: { phone?: string; email?: string; address?: string } };
        batchNumber?: { value?: string };
      };
      findings?: {
        violations?: Array<{ name?: string; ruleName?: string; legalReference?: string; localizedExplanation?: string; message?: string }>;
        warnings?: Array<{ name?: string; ruleName?: string; legalReference?: string; localizedExplanation?: string; message?: string }>;
        passedRules?: Array<{ name?: string; ruleName?: string; legalReference?: string; localizedExplanation?: string }>;
        passed?: Array<{ name?: string; ruleName?: string; legalReference?: string; ruleId?: string; message?: string; localizedExplanation?: string }>;
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
    code?: string;
    message: string;
  };
}

function mapApiReportToAppScanItem(
  apiScan: any,
  apiReport: any,
  primaryFile?: File
): AppScanItem {
  const decl = apiReport.extractedDeclarations || {};
  const findings = apiReport.findings || {};

  const ruleChecks: RuleCheckItem[] = [];

  (findings.violations || []).forEach((v: any, idx: number) => {
    ruleChecks.push({
      id: `v-${idx}`,
      ruleName: v.name || v.ruleName || 'Mandatory declaration violation',
      status: 'NON_COMPLIANT',
      statusLabel: 'Non-Compliant',
      legalSection: v.legalReference,
      detail: v.localizedExplanation || v.message,
    });
  });

  (findings.warnings || []).forEach((w: any, idx: number) => {
    ruleChecks.push({
      id: `w-${idx}`,
      ruleName: w.name || w.ruleName || 'Declaration warning',
      status: 'WARNING',
      statusLabel: 'Warning',
      legalSection: w.legalReference,
      detail: w.localizedExplanation || w.message,
    });
  });

  (findings.passed || []).forEach((p: any, idx: number) => {
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
    (primaryFile ? primaryFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') : 'Packaged Commodity');

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

  const expiryVal = decl.expiryDate?.value;
  const expiryString = typeof expiryVal === 'string'
    ? expiryVal
    : (expiryVal?.rawText || expiryVal?.isoString || null);
  const detectedBestBefore =
    decl.bestBefore?.value || expiryString || 'Within shelf life';

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

  return {
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
    ruleChecks: ruleChecks,
    imageUrl: primaryFile ? URL.createObjectURL(primaryFile) : (apiScan.asset?.originalUrl || ''),
    pdpApproximation: (apiReport as any).pdpApproximation || (apiScan as any).compliance?.pdpApproximation,
  };
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTabId>('home');
  const [scans, setScans] = useState<AppScanItem[]>([]);
  const [selectedScan, setSelectedScan] = useState<AppScanItem | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('compliscan-language') as Language;
      if (saved && ['en', 'hi'].includes(saved)) return saved;
    }
    return 'en';
  });
  const [isHindiNoticeOpen, setIsHindiNoticeOpen] = useState(false);
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('compliscan-theme') as ThemePreference;
      if (saved && ['light', 'dark', 'system'].includes(saved)) return saved;
    }
    return 'system';
  });
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanMinimized, setIsScanMinimized] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectMessage, setReconnectMessage] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Measurement Modal State
  const [isMeasurementOpen, setIsMeasurementOpen] = useState(false);
  const [measurementImageFile, setMeasurementImageFile] = useState<File | null>(null);
  const [additionalMeasurementFiles, setAdditionalMeasurementFiles] = useState<File[]>([]);
  const [pendingMeasurementData, setPendingMeasurementData] = useState<MeasurementMetadata | null>(null);

  // Authentication State with instant mobile cache hydration
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authRequiredMessage, setAuthRequiredMessage] = useState<string | undefined>(undefined);

  const isVerifiedUser = Boolean(currentUser);

  // Rehydrate cached user session, register SW, and auto-recover background scans on mount
  useEffect(() => {
    // 1. Register Service Worker for mobile PWA execution
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // 2. Rehydrate cached user session
    const cachedUser = AuthCacheService.getCachedUser();
    if (cachedUser) {
      setCurrentUser(cachedUser);
      const cachedScans = AuthCacheService.getCachedScans(cachedUser.uid);
      if (cachedScans.length > 0) {
        setScans(cachedScans);
        setSelectedScan(cachedScans[0]);
      }
      // Re-fetch scans in background to ensure fresh data
      fetchUserScans(cachedUser.uid);
    }

    // 3. Auto-recover unfinished scan if phone reloaded or app cold-started while in background
    const activeSession = BackgroundScanService.getActiveSession();
    if (activeSession) {
      setIsProcessing(true);
      setIsReconnecting(true);
      setReconnectMessage('App restored. Retrieving scan results...');
      BackgroundScanService.checkCompletedScan(activeSession.offlineClientId)
        .then((data) => {
          if (data && data.scan && data.report) {
            const restoredItem = mapApiReportToAppScanItem(data.scan, data.report);
            setScans((prev) => [restoredItem, ...prev.filter((s) => s.id !== restoredItem.id)]);
            setSelectedScan(restoredItem);
            setActiveTab('reports');
            BackgroundScanService.clearActiveSession();
            AuditAlertService.triggerAlert(restoredItem);
          }
        })
        .catch(() => {})
        .finally(() => {
          setIsProcessing(false);
          setIsReconnecting(false);
          setReconnectMessage(undefined);
        });
    }
  }, []);

  // Fetch user scans from Firestore user-wise (with local cache fallback)
  const fetchUserScans = async (userId: string) => {
    // 1. First show cached scans instantly so mobile user sees zero latency
    const localScans = AuthCacheService.getCachedScans(userId);
    if (localScans.length > 0) {
      setScans(localScans);
      setSelectedScan((curr) => curr || localScans[0]);
    }

    try {
      const userScans = await FirebaseService.listUserScans(userId);
      if (Array.isArray(userScans) && userScans.length > 0) {
        setScans(userScans);
        setSelectedScan((curr) => curr || userScans[0]);
        AuthCacheService.saveScans(userId, userScans);
      } else if (localScans.length === 0) {
        setScans([]);
        setSelectedScan(null);
      }
    } catch (err) {
      console.warn('User scans fetch error:', err);
      try {
        const res = await fetch(`/api/firebase-scans?userId=${userId}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setScans(json.data);
          setSelectedScan((curr) => curr || json.data[0]);
          AuthCacheService.saveScans(userId, json.data);
        }
      } catch (apiErr) {
        console.warn('API user scans fetch error:', apiErr);
      }
    }
  };

  // Keep interface preferences available between visits without requiring an account.
  useEffect(() => {
    const savedLanguage = window.localStorage.getItem('compliscan-language') as Language | null;
    const savedTheme = window.localStorage.getItem('compliscan-theme') as ThemePreference | null;
    if (savedLanguage && ['en', 'hi'].includes(savedLanguage)) {
      setCurrentLanguage(savedLanguage);
    }
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setThemePreference(savedTheme);
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemTheme = () => setSystemPrefersDark(mediaQuery.matches);
    updateSystemTheme();
    mediaQuery.addEventListener('change', updateSystemTheme);
    return () => mediaQuery.removeEventListener('change', updateSystemTheme);
  }, []);

  useEffect(() => {
    window.localStorage.setItem('compliscan-language', currentLanguage);
  }, [currentLanguage]);

  useEffect(() => {
    window.localStorage.setItem('compliscan-theme', themePreference);
  }, [themePreference]);

  const resolvedTheme = themePreference === 'system'
    ? (systemPrefersDark ? 'dark' : 'light')
    : themePreference;

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', resolvedTheme);
      if (resolvedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [resolvedTheme]);

  // Subscribe to Firebase Auth changes with mobile cache safety
  useEffect(() => {
    const unsubscribe = FirebaseAuthService.onAuthStateChange(async (user) => {
      if (user) {
        setCurrentUser(user);
        AuthCacheService.saveUser(user);
        await fetchUserScans(user.uid);
      } else {
        // ONLY log out if the user explicitly clicked "Sign Out"!
        // Do NOT log out during cold-start, offline launches, or app restarts!
        if (AuthCacheService.isExplicitlyLoggedOut()) {
          setCurrentUser(null);
          setScans([]);
          setSelectedScan(null);
          setActiveTab((prev) => (prev === 'history' || prev === 'reports' ? 'home' : prev));
        } else {
          // Keep cached user active during mobile app cold-starts or network reconnects
          const cachedUser = AuthCacheService.getCachedUser();
          if (cachedUser) {
            setCurrentUser(cachedUser);
            const cachedScans = AuthCacheService.getCachedScans(cachedUser.uid);
            if (cachedScans.length > 0) {
              setScans(cachedScans);
              setSelectedScan((curr) => curr || cachedScans[0]);
            }
          }
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Centralized sign-out: clear cache, sign out of Firebase, and reset UI state
  const handleSignOut = async () => {
    AuthCacheService.clear();
    try {
      await FirebaseAuthService.signOut();
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    setCurrentUser(null);
    setScans([]);
    setSelectedScan(null);
    setActiveTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Switch tab with authentication protection for history and reports
  const handleTabChange = (tab: NavTabId) => {
    if ((tab === 'history' || tab === 'reports') && !currentUser) {
      handleRequireAuth('Please sign in to view your past product scans and statutory compliance reports.');
      return;
    }
    setIsCameraOpen(false);
    setIsGuidelinesOpen(false);
    setErrorMessage(null);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRequireAuth = (msg: string) => {
    setAuthRequiredMessage(msg);
    setIsAuthModalOpen(true);
  };

  const handleLanguageChange = (lang: Language) => {
    setCurrentLanguage(lang);
    if (lang === 'hi') {
      setIsHindiNoticeOpen(true);
    }
  };

  const isProcessingScanRef = useRef(false);

  // Handle image capture from live camera or file input (supports up to 3 packaging images)
  const handleProcessScanFile = async (
    rawFile: File | File[],
    additionalFilesOrMeasurement?: File[] | MeasurementMetadata,
    measurementData?: MeasurementMetadata
  ) => {
    // Prevent duplicate concurrent requests (e.g. mobile double-tap or touch+click synthetic events)
    if (isProcessingScanRef.current) {
      console.warn('Scan processing already in flight, ignoring duplicate call');
      return;
    }
    isProcessingScanRef.current = true;
    setIsProcessing(true);
    setIsScanMinimized(false);
    setErrorMessage(null);

    // Normalize input files list
    let fileList: File[] = [];
    let effMeasurement: MeasurementMetadata | undefined = undefined;

    if (Array.isArray(rawFile)) {
      fileList = [...rawFile];
      if (additionalFilesOrMeasurement && !Array.isArray(additionalFilesOrMeasurement)) {
        effMeasurement = additionalFilesOrMeasurement;
      }
    } else if (rawFile) {
      fileList = [rawFile];
      if (Array.isArray(additionalFilesOrMeasurement)) {
        fileList.push(...additionalFilesOrMeasurement);
        effMeasurement = measurementData;
      } else if (additionalFilesOrMeasurement) {
        effMeasurement = additionalFilesOrMeasurement;
      }
    }

    if (!effMeasurement) {
      effMeasurement = pendingMeasurementData || undefined;
    }    // Cap at 3 images maximum (e.g. Front PDP, Back Information, Side/MRP)
    fileList = fileList.slice(0, 3);
    const primaryFile = fileList[0];

    // Generate unique offlineClientId for background tracking & server idempotency
    const offlineClientId = `scan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    BackgroundScanService.saveActiveSession({
      offlineClientId,
      startedAt: Date.now(),
      productNameHint: primaryFile?.name,
    });

    // Start Screen WakeLock & Background Keepalive
    BackgroundKeepAlive.startKeepAlive();

    try {
      const formData = new FormData();

      // Compress all packaging images client-side for fast mobile uploads
      for (const f of fileList) {
        const compressed = await compressImageForUpload(f);
        formData.append('files', compressed);
      }
      // Append primary file for backward compatibility
      if (fileList.length > 0) {
        const primaryCompressed = await compressImageForUpload(fileList[0]);
        formData.append('file', primaryCompressed);
      }

      formData.append('category', 'GENERIC_PACKAGED_COMMODITY');
      formData.append('locale', currentLanguage === 'hi' ? 'hi' : 'en');
      formData.append('offlineClientId', offlineClientId);
      if (currentUser?.uid) {
        formData.append('userId', currentUser.uid);
        formData.append('userEmail', currentUser.email || '');
      }

      if (effMeasurement) {
        formData.append('measurementData', JSON.stringify(effMeasurement));
      }

      // Execute scan with automatic background recovery, server polling & exponential retry
      const scanData = await BackgroundScanService.executeScanWithRecovery(
        formData,
        offlineClientId,
        (status) => {
          setIsReconnecting(status.isReconnecting);
          setReconnectMessage(status.message);
        }
      );

      const { scan: apiScan, report: apiReport } = scanData;
      const newScanItem = mapApiReportToAppScanItem(apiScan, apiReport, primaryFile);

      // Persist directly to user-wise Firestore
      if (currentUser?.uid) {
        try {
          await FirebaseService.saveUserScan(currentUser.uid, {
            ...newScanItem,
            timestamp: Date.now(),
            userId: currentUser.uid,
            userEmail: currentUser.email || undefined,
          });
        } catch (saveErr) {
          console.warn('Failed to save to user Firestore directly:', saveErr);
        }
      }

      setScans((prev) => {
        const next = [newScanItem, ...prev];
        if (currentUser?.uid) {
          AuthCacheService.saveScans(currentUser.uid, next);
        }
        return next;
      });
      setSelectedScan(newScanItem);
      setActiveTab('reports');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Trigger real-time alert (haptics, warning chime & system notification) if non-compliant
      AuditAlertService.triggerAlert(newScanItem);
    } catch (err: unknown) {
      console.error('Scan failed:', err);
      setErrorMessage(err instanceof Error ? err.message : 'An error occurred during verification');
    } finally {
      BackgroundKeepAlive.stopKeepAlive();
      BackgroundScanService.clearActiveSession();
      isProcessingScanRef.current = false;
      setIsProcessing(false);
      setIsReconnecting(false);
      setReconnectMessage(undefined);
    }
  };

  // Clear App Data for current user
  const handleClearData = async () => {
    if (currentUser?.uid) {
      AuthCacheService.clearUserScans(currentUser.uid);
      try {
        await FirebaseService.clearUserScans(currentUser.uid);
        await fetch(`/api/firebase-scans?userId=${currentUser.uid}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('Failed to clear Firebase data:', err);
      }
    }
    setScans([]);
    setSelectedScan(null);
  };



  return (
    <div data-theme={resolvedTheme} className="min-h-screen bg-slate-100 text-slate-900 selection:bg-blue-500 selection:text-white">
      {/* ========================================================================= */}
      {/* MOBILE-FIRST SHELL (Visible ONLY on viewports < lg)                       */}
      {/* ========================================================================= */}
      <div className="lg:hidden flex justify-center">
        <div className="w-full max-w-lg min-h-screen bg-white shadow-xl flex flex-col relative border-x border-slate-200/80">
          {/* Sticky App Header */}
          <AppHeader
            currentLanguage={currentLanguage}
            onLanguageChange={handleLanguageChange}
          />

          {/* User Status Bar (Shows sign-in banner if guest) */}
          {!currentUser ? (
            <div className="bg-slate-50 border-b border-slate-200/70 px-4 py-2 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Guest Mode</span>
              <button
                type="button"
                onClick={() => {
                  setAuthRequiredMessage(undefined);
                  setIsAuthModalOpen(true);
                }}
                className="text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
              >
                Sign In to Save Scans &rarr;
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
          <main className="flex-1 px-4 pt-6 pb-36 sm:pb-40 overflow-y-auto">
            <div key={activeTab} className="animate-page-shift min-h-full">
              {activeTab === 'home' && (
                <HomeScreen
                  onOpenScanningCamera={() => setIsCameraOpen(true)}
                  onImageFileSelected={handleProcessScanFile}
                  onNavigateTab={handleTabChange}
                  onOpenGuidelinesModal={() => setIsGuidelinesOpen(true)}
                  onShowLoadingModal={() => setIsScanMinimized(false)}
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
                  currentLanguage={currentLanguage}
                  onLanguageChange={handleLanguageChange}
                  themePreference={themePreference}
                  onThemeChange={setThemePreference}
                  onOpenAuthModal={() => {
                    setAuthRequiredMessage(undefined);
                    setIsAuthModalOpen(true);
                  }}
                  onSignOut={handleSignOut}
                  onOpenGuidelinesModal={() => setIsGuidelinesOpen(true)}
                  onClearData={handleClearData}
                />
              )}
            </div>
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
          onSignOut={handleSignOut}
          onOpenGuidelinesModal={() => setIsGuidelinesOpen(true)}
        />

        {/* Screen Content Area */}
        <div key={activeTab} className="flex-1 flex flex-col animate-page-shift">
          {activeTab === 'home' ? (
            <main className="flex-1">
              <HomeScreen
                onOpenScanningCamera={() => setIsCameraOpen(true)}
                onImageFileSelected={handleProcessScanFile}
                onNavigateTab={handleTabChange}
                onOpenGuidelinesModal={() => setIsGuidelinesOpen(true)}
                onShowLoadingModal={() => setIsScanMinimized(false)}
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
                  currentLanguage={currentLanguage}
                  onLanguageChange={handleLanguageChange}
                  themePreference={themePreference}
                  onThemeChange={setThemePreference}
                  onOpenAuthModal={() => {
                    setAuthRequiredMessage(undefined);
                    setIsAuthModalOpen(true);
                  }}
                  onSignOut={handleSignOut}
                  onOpenGuidelinesModal={() => setIsGuidelinesOpen(true)}
                  onClearData={handleClearData}
                />
              )}
            </main>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GLOBAL MODALS (Camera, Guidelines, Auth)                                  */}
      {/* ========================================================================= */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(primaryFile, additionalFiles) => {
          handleProcessScanFile(primaryFile, additionalFiles);
        }}
        onMeasure={(primaryFile, additionalFiles) => {
          setMeasurementImageFile(primaryFile);
          setAdditionalMeasurementFiles(additionalFiles || []);
          setIsMeasurementOpen(true);
        }}
      />

      <MeasurementModal
        isOpen={isMeasurementOpen}
        onClose={() => setIsMeasurementOpen(false)}
        imageFile={measurementImageFile}
        onComplete={(metadata) => {
          setPendingMeasurementData(metadata);
          if (measurementImageFile) {
            handleProcessScanFile(measurementImageFile, additionalMeasurementFiles, metadata);
          }
        }}
      />

      <GuidelinesModal
        isOpen={isGuidelinesOpen}
        onClose={() => setIsGuidelinesOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChange={(user) => {
          setCurrentUser(user);
          if (user) {
            AuthCacheService.saveUser(user);
            fetchUserScans(user.uid);
          }
        }}
        requiredActionMessage={authRequiredMessage}
      />

      {/* Hindi Language Notice Popup Modal */}
      {isHindiNoticeOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3 shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              हिंदी भाषा सूचना
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4 font-medium">
              ध्यान दें: केवल आपकी खोज और अनुपालन रिपोर्ट (Search & Compliance Report) हिंदी में तैयार और प्रदर्शित की जाएगी।
            </p>
            <button
              type="button"
              onClick={() => setIsHindiNoticeOpen(false)}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              ठीक है, समझ गया
            </button>
          </div>
        </div>
      )}

      {/* Global Animated AI Scan Loading Overlay / Floating Pill */}
      <ScanLoadingModal
        isOpen={isProcessing}
        isMinimized={isScanMinimized}
        onMinimize={() => setIsScanMinimized((prev) => !prev)}
        isReconnecting={isReconnecting}
        reconnectMessage={reconnectMessage}
      />
    </div>
  );
}

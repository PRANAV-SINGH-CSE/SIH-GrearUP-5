export interface ExtractedFieldItem {
  key: string;
  label: string;
  value: string;
}

export interface RuleCheckItem {
  id: string;
  ruleName: string;
  status: 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT';
  statusLabel: string;
  ruleId?: string;
  legalSection?: string;
  detail?: string;
}

export interface AppScanItem {
  id: string;
  scanIdNumber: string;
  productName: string;
  manufacturer: string;
  scannedAt: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'NEEDS_REVIEW';
  statusLabel: string;
  explanation: string;
  summary: {
    passed: number;
    failed: number;
    warning: number;
    notApplicable: number;
  };
  extractedInfo: {
    productName: string;
    manufacturer: string;
    consumerCare: string;
    netQuantity: string;
    mfgDate: string;
    address: string;
    mrp: string;
    unitSalePrice?: string;
    bestBefore: string;
    countryOfOrigin: string;
    batchNo: string;
  };
  ruleChecks: RuleCheckItem[];
  imageUrl?: string;
  pdpApproximation?: {
    declaredQuantityRaw?: string;
    parsedQuantityValue?: number;
    parsedQuantityUnit?: string;
    packageArchetype: string;
    estimatedPdpAreaCm2: number;
    estimatedPdpWidthMm: number;
    estimatedPdpHeightMm: number;
    accuracyScore: number;
    accuracyGrade: 'HIGH' | 'GOOD' | 'MODERATE' | 'LOW';
    accuracyRationale: string;
    indianStatutoryPermission?: {
      standardTier: string;
      minNumeralHeightMm: number;
      minPdpRatio: string;
      roughSanityScore: number;
      isRoughlyCorrect: boolean;
      explanation: string;
    };
  };
}

// Fallback dummy structure if a component needs a non-null object for preview
export const SAMPLE_FALLBACK_SCAN: AppScanItem = {
  id: 'sample-scan',
  scanIdNumber: '#CS-SAMPLE',
  productName: 'Sample Packaged Commodity',
  manufacturer: 'Sample Manufacturer Pvt. Ltd.',
  scannedAt: 'Just now',
  status: 'COMPLIANT',
  statusLabel: 'Compliant',
  explanation: 'Statutory compliance verification completed.',
  summary: {
    passed: 6,
    failed: 0,
    warning: 0,
    notApplicable: 0,
  },
  extractedInfo: {
    productName: 'Sample Packaged Commodity',
    manufacturer: 'Sample Manufacturer Pvt. Ltd.',
    consumerCare: '1800-11-4000',
    netQuantity: '100 g',
    mfgDate: '01/2024',
    address: 'Industrial Area, Phase 1, New Delhi - 110001',
    mrp: '₹ 50.00',
    unitSalePrice: '₹ 0.50 / g',
    bestBefore: '12 Months',
    countryOfOrigin: 'India',
    batchNo: 'SMP-2024-01',
  },
  ruleChecks: [
    {
      id: 'r1',
      ruleName: 'Manufacturer / Packer details',
      status: 'COMPLIANT',
      statusLabel: 'Compliant',
      legalSection: 'Rule 6(1)(a)',
    },
    {
      id: 'r2',
      ruleName: 'Net quantity declaration',
      status: 'COMPLIANT',
      statusLabel: 'Compliant',
      legalSection: 'Rule 6(1)(b)',
    },
    {
      id: 'r3',
      ruleName: 'Maximum Retail Price (MRP)',
      status: 'COMPLIANT',
      statusLabel: 'Compliant',
      legalSection: 'Rule 6(1)(c)',
    },
  ],
};

// INITIAL_SCANS is strictly empty by default so only real user scans are displayed
export const INITIAL_SCANS: AppScanItem[] = [];

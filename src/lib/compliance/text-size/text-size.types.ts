/**
 * CompliScan — Text Size & Font Height Inspection Types
 * Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 9, Rule 10 & Schedule I
 */

export type TextSizeComplianceStatus = 'PASS' | 'FAIL' | 'WARNING' | 'UNVERIFIABLE';

export interface TextSizeDeclarationItem {
  field: 'netQuantity' | 'mrp' | 'manufactureDate' | 'genericName' | 'manufacturer' | 'other';
  label: string;
  printedText: string;
  measuredHeightMm: number;
  minRequiredHeightMm: number;
  meetsLimit: boolean;
  aspectRatio?: number;
  aspectRatioValid?: boolean;
  contrastAdequate: boolean;
  remarks: string;
}

import type { QuantityApproximation } from './package-approximation';

export type { QuantityApproximation };

export interface TextSizeInspectionResult {
  /** Applicable Principal Display Panel area in cm² */
  pdpAreaCm2: number;
  /** Estimated or calibrated dimensions */
  pdpWidthMm?: number;
  pdpHeightMm?: number;
  /** Statutory minimum required numeral and letter height in mm */
  minRequiredHeightMm: number;
  /** Whether the declaration is embossed, blown, or moulded on container */
  isBlownOrMoulded: boolean;
  /** Overall compliance status for text sizes */
  overallCompliance: TextSizeComplianceStatus;
  /** Detailed line-item breakdown for mandatory declarations */
  items: TextSizeDeclarationItem[];
  /** Inspection methodology used */
  method: 'ai_multimodal' | 'calibrated_cv' | 'deterministic_heuristic' | 'mock';
  /** Perception confidence score (0-1) */
  confidence: number;
  /** AI Quantity-based Package Approximation & 1-to-10 accuracy rating */
  approximation?: QuantityApproximation;
  /** Plain English explanation with statutory citation */
  summaryExplanation: string;
  /** Legal Reference */
  legalReference: string;
}

/**
 * Calculates statutory minimum numeral & letter height per LMPC 2011 Schedule I / Rule 10
 *
 * | PDP Area (A)             | Normal Minimum Height | Blown / Moulded / Embossed |
 * |--------------------------|-----------------------|----------------------------|
 * | A <= 50 cm²              | 1.0 mm                | 1.5 mm                     |
 * | 50 cm² < A <= 100 cm²    | 1.5 mm                | 2.0 mm                     |
 * | 100 cm² < A <= 500 cm²   | 2.0 mm                | 4.0 mm                     |
 * | 500 cm² < A <= 2500 cm²  | 4.0 mm                | 6.0 mm                     |
 * | A > 2500 cm²             | 6.0 mm                | 6.0 mm                     |
 */
export function getStatutoryMinNumeralHeight(
  pdpAreaCm2: number,
  isBlownOrMoulded: boolean = false
): number {
  if (pdpAreaCm2 <= 50) return isBlownOrMoulded ? 1.5 : 1.0;
  if (pdpAreaCm2 <= 100) return isBlownOrMoulded ? 2.0 : 1.5;
  if (pdpAreaCm2 <= 500) return isBlownOrMoulded ? 4.0 : 2.0;
  if (pdpAreaCm2 <= 2500) return isBlownOrMoulded ? 6.0 : 4.0;
  return 6.0;
}

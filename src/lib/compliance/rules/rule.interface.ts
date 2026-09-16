import { ProductDeclaration } from '../../types/extraction';
import { OCRResult } from '../../types/ocr';
import { RuleEvaluation, RuleSeverity } from '../../types/compliance';

import { TextSizeInspectionResult } from '../text-size/text-size.types';

export interface RuleExecutionContext {
  product: ProductDeclaration;
  category: string;
  rulesetVersion: string;
  ocrResult?: OCRResult;
  imageQualityScore?: number;
  /** Optional physical measurement data from client-side CV */
  measurementData?: MeasurementMetadata;
  /** Optional AI text size & numeral height inspection result */
  textSizeResult?: TextSizeInspectionResult;
}

export interface MeasurementMetadata {
  /** PDP bounding dimensions in mm */
  pdpBoundingWidthMm?: number;
  pdpBoundingHeightMm?: number;
  pdpBoundingAreaMm2?: number;
  /** Contour-fitted dimensions if available */
  pdpContourWidthMm?: number;
  pdpContourHeightMm?: number;
  pdpContourAreaMm2?: number;
  /** Uncertainty bounds */
  widthErrorMm?: number;
  heightErrorMm?: number;
  /** Technical quality grade from the measurement system */
  qualityGrade: 'HIGH' | 'ACCEPTABLE' | 'LOW' | 'UNRELIABLE';
  /** How the object boundary was determined */
  boundaryType: 'bounding_box' | 'contour' | 'user_adjusted';
  /** Coplanarity assumed */
  coplanarityAssumed: boolean;
  /** Source disclaimer */
  disclaimer: string;
}

export interface IComplianceRule {
  readonly id: string;
  readonly name: string;
  readonly legalReference: string;
  readonly category: string;
  readonly severity: RuleSeverity;
  readonly applicability: string;
  readonly ruleVersion: string;
  readonly humanVerificationRequired: boolean;
  readonly errorCode: string;
  readonly explanationKey: string;

  evaluate(context: RuleExecutionContext): RuleEvaluation;
}

import { ProductDeclaration } from '../../types/extraction';
import { OCRResult } from '../../types/ocr';
import { RuleEvaluation, RuleSeverity } from '../../types/compliance';

export interface RuleExecutionContext {
  product: ProductDeclaration;
  category: string;
  rulesetVersion: string;
  ocrResult?: OCRResult;
  imageQualityScore?: number;
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

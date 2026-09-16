import { RuleRegistry } from './rules/registry';
import { ComplianceAggregator } from './aggregator';
import { RuleExecutionContext, MeasurementMetadata } from './rules/rule.interface';
import { TextSizeInspectionResult } from './text-size/text-size.types';
import { ComplianceEvaluationResult } from '../types/compliance';
import { ProductDeclaration } from '../types/extraction';
import { OCRResult } from '../types/ocr';

export interface EvaluateComplianceInput {
  scanId: string;
  product: ProductDeclaration;
  category?: string;
  rulesetVersion?: string;
  ocrResult?: OCRResult;
  imageQualityScore?: number;
  /** Optional physical measurement data from calibrated client-side CV */
  measurementData?: MeasurementMetadata;
  /** Optional AI text size & font height inspection result */
  textSizeResult?: TextSizeInspectionResult;
}

export class ComplianceEngine {
  /**
   * Pure deterministic compliance evaluation engine.
   * Completely decoupled from OCR vendors, LLMs, and databases.
   */
  evaluate(input: EvaluateComplianceInput): ComplianceEvaluationResult {
    const {
      scanId,
      product,
      category = 'GENERIC_PACKAGED_COMMODITY',
      rulesetVersion = 'LMPC-2011.v2026',
      ocrResult,
      imageQualityScore,
      measurementData,
      textSizeResult,
    } = input;

    const context: RuleExecutionContext = {
      product,
      category,
      rulesetVersion,
      ocrResult,
      imageQualityScore,
      measurementData,
      textSizeResult,
    };

    // 1. Fetch applicable rules for category
    const applicableRules = RuleRegistry.getRulesForCategory(category);

    // 2. Execute each rule deterministically
    const evaluations = applicableRules.map((rule) => rule.evaluate(context));

    // 3. Aggregate into overall compliance decision
    const aggregated = ComplianceAggregator.aggregate(evaluations);

    return {
      scanId,
      rulesetVersion,
      category,
      overallStatus: aggregated.overallStatus,
      passedChecks: aggregated.passedChecks,
      violations: aggregated.violations,
      warnings: aggregated.warnings,
      unverifiableChecks: aggregated.unverifiableChecks,
      notApplicableChecks: aggregated.notApplicableChecks,
      counts: aggregated.counts,
      evaluatedAt: new Date().toISOString(),
    };
  }
}

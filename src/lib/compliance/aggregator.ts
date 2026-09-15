import { RuleEvaluation, ComplianceOverallStatus } from '../types/compliance';

export interface AggregationResult {
  overallStatus: ComplianceOverallStatus;
  statusExplanation: string;
  violations: RuleEvaluation[];
  warnings: RuleEvaluation[];
  passedChecks: RuleEvaluation[];
  unverifiableChecks: RuleEvaluation[];
  notApplicableChecks: RuleEvaluation[];
  counts: {
    total: number;
    passed: number;
    failed: number;
    warning: number;
    unverifiable: number;
    notApplicable: number;
  };
}

export class ComplianceAggregator {
  /**
   * Aggregates individual rule evaluation outputs into a deterministic overall status.
   *
   * Logic:
   * 1. If any ERROR severity check FAILS -> NON_COMPLIANT
   * 2. If no FAIL, but mandatory checks are UNVERIFIABLE -> NEEDS_REVIEW
   * 3. If all mandatory checks PASS and WARNINGs exist -> COMPLIANT_WITH_WARNINGS
   * 4. If all mandatory checks PASS with zero warnings -> COMPLIANT
   */
  static aggregate(evaluations: RuleEvaluation[]): AggregationResult {
    const violations: RuleEvaluation[] = [];
    const warnings: RuleEvaluation[] = [];
    const passedChecks: RuleEvaluation[] = [];
    const unverifiableChecks: RuleEvaluation[] = [];
    const notApplicableChecks: RuleEvaluation[] = [];

    for (const evaluation of evaluations) {
      switch (evaluation.status) {
        case 'FAIL':
          violations.push(evaluation);
          break;
        case 'WARNING':
          warnings.push(evaluation);
          break;
        case 'PASS':
          passedChecks.push(evaluation);
          break;
        case 'UNVERIFIABLE':
          unverifiableChecks.push(evaluation);
          break;
        case 'NOT_APPLICABLE':
          notApplicableChecks.push(evaluation);
          break;
      }
    }

    let overallStatus: ComplianceOverallStatus;
    let statusExplanation: string;

    if (violations.length > 0) {
      overallStatus = 'NON_COMPLIANT';
      statusExplanation = `The product label does not satisfy ${violations.length} mandatory Legal Metrology requirement(s). Actionable non-compliance detected.`;
    } else if (unverifiableChecks.some((u) => u.severity === 'ERROR')) {
      overallStatus = 'NEEDS_REVIEW';
      statusExplanation = `Key mandatory declarations could not be reliably verified from the provided image due to image clarity or OCR resolution. Manual review or a clearer photograph is required.`;
    } else if (warnings.length > 0) {
      overallStatus = 'COMPLIANT_WITH_WARNINGS';
      statusExplanation = `All mandatory declarations are present and compliant, but ${warnings.length} advisory warning(s) were flagged (e.g. Unit Sale Price or tax inclusion phrasing).`;
    } else {
      overallStatus = 'COMPLIANT';
      statusExplanation = `All applicable Legal Metrology (Packaged Commodities) Rules, 2011 declarations were successfully verified and meet statutory requirements.`;
    }

    return {
      overallStatus,
      statusExplanation,
      violations,
      warnings,
      passedChecks,
      unverifiableChecks,
      notApplicableChecks,
      counts: {
        total: evaluations.length,
        passed: passedChecks.length,
        failed: violations.length,
        warning: warnings.length,
        unverifiable: unverifiableChecks.length,
        notApplicable: notApplicableChecks.length,
      },
    };
  }
}

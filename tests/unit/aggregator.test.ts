import { describe, it, expect } from 'vitest';
import { ComplianceAggregator } from '@/lib/compliance/aggregator';
import { RuleEvaluation } from '@/lib/types/compliance';

function mockEvaluation(status: any, severity: any = 'ERROR'): RuleEvaluation {
  return {
    ruleId: 'TEST-RULE-01',
    name: 'Test Rule',
    status,
    severity,
    message: 'Test message',
    legalReference: 'LMPC 2011',
    errorCode: 'TEST_ERR',
    explanationKey: 'TEST_KEY',
    humanVerificationRequired: false,
  };
}

describe('ComplianceAggregator', () => {
  it('returns COMPLIANT when all rules PASS', () => {
    const evals = [mockEvaluation('PASS'), mockEvaluation('PASS')];
    const res = ComplianceAggregator.aggregate(evals);
    expect(res.overallStatus).toBe('COMPLIANT');
    expect(res.counts.failed).toBe(0);
  });

  it('returns NON_COMPLIANT if any mandatory check FAILS', () => {
    const evals = [mockEvaluation('PASS'), mockEvaluation('FAIL', 'ERROR')];
    const res = ComplianceAggregator.aggregate(evals);
    expect(res.overallStatus).toBe('NON_COMPLIANT');
    expect(res.counts.failed).toBe(1);
  });

  it('returns COMPLIANT_WITH_WARNINGS when all pass with advisory warnings', () => {
    const evals = [mockEvaluation('PASS'), mockEvaluation('WARNING', 'WARNING')];
    const res = ComplianceAggregator.aggregate(evals);
    expect(res.overallStatus).toBe('COMPLIANT_WITH_WARNINGS');
    expect(res.counts.warning).toBe(1);
    expect(res.counts.failed).toBe(0);
  });

  it('returns NEEDS_REVIEW when mandatory checks are UNVERIFIABLE without hard fails', () => {
    const evals = [mockEvaluation('PASS'), mockEvaluation('UNVERIFIABLE', 'ERROR')];
    const res = ComplianceAggregator.aggregate(evals);
    expect(res.overallStatus).toBe('NEEDS_REVIEW');
    expect(res.counts.unverifiable).toBe(1);
  });
});

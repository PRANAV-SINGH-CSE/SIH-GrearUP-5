import { z } from 'zod';
import { BoundingBoxSchema } from './ocr';

export const RuleStatusSchema = z.enum([
  'PASS',
  'FAIL',
  'WARNING',
  'UNVERIFIABLE',
  'NOT_APPLICABLE',
]);
export type RuleStatus = z.infer<typeof RuleStatusSchema>;

export const RuleSeveritySchema = z.enum(['ERROR', 'WARNING', 'INFO']);
export type RuleSeverity = z.infer<typeof RuleSeveritySchema>;

export const ComplianceOverallStatusSchema = z.enum([
  'COMPLIANT',
  'NON_COMPLIANT',
  'COMPLIANT_WITH_WARNINGS',
  'NEEDS_REVIEW',
]);
export type ComplianceOverallStatus = z.infer<typeof ComplianceOverallStatusSchema>;

export const RuleEvaluationSchema = z.object({
  ruleId: z.string(),
  name: z.string(),
  status: RuleStatusSchema,
  severity: RuleSeveritySchema,
  message: z.string(),
  field: z.string().optional(),
  extractedValue: z.string().nullable().optional(),
  evidenceText: z.string().nullable().optional(),
  boundingBox: BoundingBoxSchema.optional(),
  confidence: z.number().min(0).max(1).optional(),
  humanVerificationRequired: z.boolean().default(false),
  legalReference: z.string(),
  errorCode: z.string(),
  explanationKey: z.string(),
});
export type RuleEvaluation = z.infer<typeof RuleEvaluationSchema>;

export const ComplianceEvaluationResultSchema = z.object({
  scanId: z.string(),
  rulesetVersion: z.string(),
  category: z.string(),
  overallStatus: ComplianceOverallStatusSchema,
  passedChecks: z.array(RuleEvaluationSchema),
  violations: z.array(RuleEvaluationSchema),
  warnings: z.array(RuleEvaluationSchema),
  unverifiableChecks: z.array(RuleEvaluationSchema),
  notApplicableChecks: z.array(RuleEvaluationSchema),
  counts: z.object({
    total: z.number(),
    passed: z.number(),
    failed: z.number(),
    warning: z.number(),
    unverifiable: z.number(),
    notApplicable: z.number(),
  }),
  evaluatedAt: z.string(),
});
export type ComplianceEvaluationResult = z.infer<typeof ComplianceEvaluationResultSchema>;

import { z } from 'zod';
import { ComplianceOverallStatusSchema, RuleEvaluationSchema } from './compliance';
import { ProductDeclarationSchema } from './extraction';

export const LocalizedReportExplanationSchema = z.object({
  ruleId: z.string(),
  name: z.string(),
  status: z.string(),
  message: z.string(),
  localizedExplanation: z.string(),
  legalReference: z.string(),
  evidenceText: z.string().nullable().optional(),
  extractedValue: z.string().nullable().optional(),
  confidence: z.number().optional(),
});
export type LocalizedReportExplanation = z.infer<typeof LocalizedReportExplanationSchema>;

export const QuantityApproximationSchema = z.object({
  declaredQuantityRaw: z.string().optional(),
  parsedQuantityValue: z.number().optional(),
  parsedQuantityUnit: z.string().optional(),
  packageArchetype: z.string(),
  estimatedPdpAreaCm2: z.number(),
  estimatedPdpWidthMm: z.number(),
  estimatedPdpHeightMm: z.number(),
  accuracyScore: z.number(),
  accuracyGrade: z.enum(['HIGH', 'GOOD', 'MODERATE', 'LOW']),
  accuracyRationale: z.string(),
  indianStatutoryPermission: z
    .object({
      standardTier: z.string(),
      minNumeralHeightMm: z.number(),
      minPdpRatio: z.string(),
      roughSanityScore: z.number(),
      isRoughlyCorrect: z.boolean(),
      explanation: z.string(),
    })
    .optional(),
});
export type QuantityApproximation = z.infer<typeof QuantityApproximationSchema>;

export const ComplianceReportSchema = z.object({
  reportId: z.string(),
  scanId: z.string(),
  generatedAt: z.string(),
  locale: z.enum(['en', 'hi']).default('en'),
  productInformation: z.object({
    productName: z.string().nullable().optional(),
    genericName: z.string().nullable().optional(),
    category: z.string(),
    manufacturerOrPacker: z.string().nullable().optional(),
  }),
  overallStatus: ComplianceOverallStatusSchema,
  statusExplanation: z.string(),
  rulesetVersion: z.string(),
  extractedDeclarations: ProductDeclarationSchema,
  findings: z.object({
    passed: z.array(LocalizedReportExplanationSchema),
    violations: z.array(LocalizedReportExplanationSchema),
    warnings: z.array(LocalizedReportExplanationSchema),
    unverifiable: z.array(LocalizedReportExplanationSchema),
    notApplicable: z.array(LocalizedReportExplanationSchema),
  }),
  metadata: z.object({
    ocrProvider: z.string(),
    ocrConfidence: z.number(),
    aiProvider: z.string(),
    extractionMethod: z.string(),
    imageQualityScore: z.number().optional(),
    imageQualityWarning: z.string().optional(),
    processingDurationMs: z.number().optional(),
  }),
  pdpApproximation: QuantityApproximationSchema.optional(),
  legalDisclaimer: z.string(),
});
export type ComplianceReport = z.infer<typeof ComplianceReportSchema>;

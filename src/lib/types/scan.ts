import { z } from 'zod';
import { OCRResultSchema } from './ocr';
import { ProductDeclarationSchema } from './extraction';
import { ComplianceEvaluationResultSchema, ComplianceOverallStatusSchema } from './compliance';

export const ScanStatusSchema = z.enum([
  'UPLOADED',
  'VALIDATING',
  'PREPROCESSING',
  'OCR_PROCESSING',
  'EXTRACTING',
  'CLASSIFYING',
  'VALIDATING_COMPLIANCE',
  'COMPLETED',
  'FAILED',
  'NEEDS_REVIEW',
]);
export type ScanStatus = z.infer<typeof ScanStatusSchema>;

export const UploadedAssetMetadataSchema = z.object({
  id: z.string(),
  scanId: z.string(),
  originalUrl: z.string(),
  processedUrl: z.string().optional(),
  mimeType: z.string(),
  fileSize: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  qualityScore: z.number().optional(),
  qualityWarning: z.string().optional(),
  hash: z.string(),
  createdAt: z.string(),
});
export type UploadedAssetMetadata = z.infer<typeof UploadedAssetMetadataSchema>;

export const ScanDetailSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  status: ScanStatusSchema,
  category: z.string().default('GENERIC_PACKAGED_COMMODITY'),
  overallStatus: ComplianceOverallStatusSchema.optional(),
  rulesetVersion: z.string().default('LMPC-2011.v2026'),
  imageHash: z.string().optional(),
  offlineClientId: z.string().optional(),
  isOfflineSync: z.boolean().default(false),
  errorMessage: z.string().optional(),
  asset: UploadedAssetMetadataSchema.optional(),
  additionalAssets: z.array(UploadedAssetMetadataSchema).optional(),
  ocrResult: OCRResultSchema.optional(),
  extraction: ProductDeclarationSchema.optional(),
  compliance: ComplianceEvaluationResultSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ScanDetail = z.infer<typeof ScanDetailSchema>;

export const CreateScanInputSchema = z.object({
  category: z.string().optional().default('GENERIC_PACKAGED_COMMODITY'),
  offlineClientId: z.string().optional(),
  rulesetVersion: z.string().optional().default('LMPC-2011.v2026'),
});
export type CreateScanInput = z.infer<typeof CreateScanInputSchema>;

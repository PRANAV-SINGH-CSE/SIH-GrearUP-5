import { z } from 'zod';
import { ProductDeclarationSchema } from '../types/extraction';
import { ComplianceEvaluationResultSchema, ComplianceOverallStatusSchema } from '../types/compliance';

export const COMPONENT_OFFLINE_CAPABILITY = {
  IMAGE_PREPROCESSING: 'OFFLINE_CAPABLE',
  LOCAL_OCR: 'OFFLINE_CAPABLE',
  DETERMINISTIC_RULE_ENGINE: 'OFFLINE_CAPABLE',
  LOCAL_STORAGE: 'OFFLINE_CAPABLE',
  CACHED_RULESET: 'OFFLINE_CAPABLE',
  LOCAL_REPORT_GENERATION: 'OFFLINE_CAPABLE',
  CLOUD_MULTIMODAL_AI: 'ONLINE_REQUIRED',
  CENTRAL_AUDIT_SYNC: 'ONLINE_REQUIRED',
  OFFICIAL_SANCTION_LOGGING: 'ONLINE_REQUIRED',
} as const;

export const OfflineSyncItemSchema = z.object({
  offlineClientId: z.string().uuid(),
  capturedAt: z.string(),
  category: z.string().default('GENERIC_PACKAGED_COMMODITY'),
  localRulesetVersion: z.string(),
  extractedDeclarations: ProductDeclarationSchema,
  localEvaluation: ComplianceEvaluationResultSchema.optional(),
  localOverallStatus: ComplianceOverallStatusSchema.optional(),
  imageHash: z.string(),
});
export type OfflineSyncItem = z.infer<typeof OfflineSyncItemSchema>;

export const OfflineSyncBatchRequestSchema = z.object({
  deviceId: z.string(),
  clientTimestamp: z.string(),
  items: z.array(OfflineSyncItemSchema),
});
export type OfflineSyncBatchRequest = z.infer<typeof OfflineSyncBatchRequestSchema>;

export const SyncItemResultSchema = z.object({
  offlineClientId: z.string(),
  serverScanId: z.string(),
  syncStatus: z.enum(['SYNCED', 'CONFLICT_RULES_UPDATED', 'FAILED']),
  serverOverallStatus: ComplianceOverallStatusSchema,
  message: z.string(),
});
export type SyncItemResult = z.infer<typeof SyncItemResultSchema>;

export const OfflineSyncBatchResponseSchema = z.object({
  success: z.boolean(),
  processedCount: z.number(),
  results: z.array(SyncItemResultSchema),
});
export type OfflineSyncBatchResponse = z.infer<typeof OfflineSyncBatchResponseSchema>;

import { z } from 'zod';
import { BoundingBoxSchema } from './ocr';

export const ExtractionMethodSchema = z.enum(['deterministic', 'ai', 'hybrid', 'mock']);
export type ExtractionMethod = z.infer<typeof ExtractionMethodSchema>;

export const ConfidenceLevelSchema = z.enum(['HIGH', 'MEDIUM', 'LOW']);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;

export function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 0.85) return 'HIGH';
  if (score >= 0.6) return 'MEDIUM';
  return 'LOW';
}

export function createFieldSchema<T extends z.ZodTypeAny>(valueSchema: T) {
  return z.object({
    value: valueSchema.nullable(),
    rawText: z.string().optional(),
    confidence: z.number().min(0).max(1),
    sourceBoundingBox: BoundingBoxSchema.optional(),
    extractionMethod: ExtractionMethodSchema.default('deterministic'),
  });
}

export const NetQuantityDetailSchema = z.object({
  value: z.number().positive(),
  unit: z.string(),
  rawUnit: z.string(),
  isValidUnit: z.boolean(),
  normalizedUnit: z.string().optional(),
});
export type NetQuantityDetail = z.infer<typeof NetQuantityDetailSchema>;

export const MRPDetailSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('INR'),
  isTaxInclusive: z.boolean(),
  rawWording: z.string().optional(),
});
export type MRPDetail = z.infer<typeof MRPDetailSchema>;

export const UnitSalePriceDetailSchema = z.object({
  amount: z.number().positive(),
  perUnit: z.string(),
  currency: z.string().default('INR'),
});
export type UnitSalePriceDetail = z.infer<typeof UnitSalePriceDetailSchema>;

export const DateDetailSchema = z.object({
  day: z.number().int().nullish(),
  month: z.number().int().min(1).max(12).nullish(),
  year: z.number().int().nullish(),
  rawText: z.string(),
  isoString: z.string().nullish(),
  isAmbiguous: z.boolean().default(false),
});
export type DateDetail = z.infer<typeof DateDetailSchema>;

export const ConsumerCareDetailSchema = z.object({
  name: z.string().nullish(),
  phone: z.string().nullish(),
  email: z.string().nullish(),
  address: z.string().nullish(),
  website: z.string().nullish(),
});
export type ConsumerCareDetail = z.infer<typeof ConsumerCareDetailSchema>;

export const PartyDetailSchema = z.object({
  name: z.string().nullish(),
  address: z.string().nullish(),
});
export type PartyDetail = z.infer<typeof PartyDetailSchema>;

export const ProductDeclarationSchema = z.object({
  productName: createFieldSchema(z.string()),
  genericName: createFieldSchema(z.string()),
  manufacturer: createFieldSchema(PartyDetailSchema),
  packer: createFieldSchema(PartyDetailSchema),
  importer: createFieldSchema(PartyDetailSchema),
  netQuantity: createFieldSchema(NetQuantityDetailSchema),
  mrp: createFieldSchema(MRPDetailSchema),
  unitSalePrice: createFieldSchema(UnitSalePriceDetailSchema),
  countryOfOrigin: createFieldSchema(z.string()),
  manufactureDate: createFieldSchema(DateDetailSchema),
  packingDate: createFieldSchema(DateDetailSchema),
  bestBefore: createFieldSchema(z.string()),
  expiryDate: createFieldSchema(DateDetailSchema),
  consumerCare: createFieldSchema(ConsumerCareDetailSchema),
  batchNumber: createFieldSchema(z.string()),
  rawFields: z.record(z.string(), z.string()).default({}),
  overallConfidence: z.number().min(0).max(1).default(1.0),
  extractionMethod: ExtractionMethodSchema.default('deterministic'),
});
export type ProductDeclaration = z.infer<typeof ProductDeclarationSchema>;

import { z } from 'zod';

export const BoundingBoxSchema = z.object({
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().min(0),
  height: z.number().min(0),
});
export type BoundingBox = z.infer<typeof BoundingBoxSchema>;

export const OCRWordSchema = z.object({
  text: z.string(),
  confidence: z.number().min(0).max(1),
  boundingBox: BoundingBoxSchema.optional(),
});
export type OCRWord = z.infer<typeof OCRWordSchema>;

export const OCRLineSchema = z.object({
  text: z.string(),
  words: z.array(OCRWordSchema),
  confidence: z.number().min(0).max(1),
  boundingBox: BoundingBoxSchema.optional(),
});
export type OCRLine = z.infer<typeof OCRLineSchema>;

export const OCRBlockSchema = z.object({
  blockType: z.enum(['TEXT', 'BARCODE', 'TABLE', 'GRAPHIC']).default('TEXT'),
  lines: z.array(OCRLineSchema),
  confidence: z.number().min(0).max(1),
  boundingBox: BoundingBoxSchema.optional(),
});
export type OCRBlock = z.infer<typeof OCRBlockSchema>;

export const OCRResultSchema = z.object({
  fullText: z.string(),
  blocks: z.array(OCRBlockSchema),
  confidence: z.number().min(0).max(1),
  detectedLanguage: z.string().default('en'),
  durationMs: z.number().optional(),
  provider: z.string(),
  rawResponse: z.unknown().optional(),
});
export type OCRResult = z.infer<typeof OCRResultSchema>;

import { OCRResult } from '../types/ocr';

export interface OCROptions {
  languageHints?: string[];
  detectTables?: boolean;
  scenarioId?: string;
}

export interface IOCRProvider {
  readonly name: string;
  extractText(imageBuffer: Buffer, mimeType: string, options?: OCROptions): Promise<OCRResult>;
}

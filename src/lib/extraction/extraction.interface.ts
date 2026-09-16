import { ProductDeclaration } from '../types/extraction';
import { OCRResult } from '../types/ocr';

export interface MultiImageItem {
  buffer: Buffer;
  mimeType?: string;
  label?: string;
}

export interface IAIExtractionProvider {
  readonly name: string;
  extractDeclarations(
    ocrResult: OCRResult,
    categoryHint?: string,
    imageBuffer?: Buffer,
    mimeType?: string,
    additionalImages?: MultiImageItem[]
  ): Promise<ProductDeclaration>;
}

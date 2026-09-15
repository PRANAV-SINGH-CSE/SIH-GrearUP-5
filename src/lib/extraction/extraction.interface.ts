import { ProductDeclaration } from '../types/extraction';
import { OCRResult } from '../types/ocr';

export interface IAIExtractionProvider {
  readonly name: string;
  extractDeclarations(
    ocrResult: OCRResult,
    categoryHint?: string,
    imageBuffer?: Buffer,
    mimeType?: string
  ): Promise<ProductDeclaration>;
}

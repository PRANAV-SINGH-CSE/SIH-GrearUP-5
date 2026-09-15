import { IAIExtractionProvider } from './extraction.interface';
import { ProductDeclaration } from '../types/extraction';
import { OCRResult } from '../types/ocr';
import { DeterministicExtractor } from './deterministic.extractor';

export class MockAIExtractionProvider implements IAIExtractionProvider {
  readonly name = 'mock';

  async extractDeclarations(
    ocrResult: OCRResult,
    _categoryHint?: string,
    _imageBuffer?: Buffer,
    _mimeType?: string
  ): Promise<ProductDeclaration> {
    // Uses deterministic extractor enhanced with simulated AI confidence scoring
    const result = DeterministicExtractor.extract(ocrResult);
    result.extractionMethod = 'mock';
    return result;
  }
}

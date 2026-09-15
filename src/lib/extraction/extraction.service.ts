import { ProductDeclaration } from '../types/extraction';
import { OCRResult } from '../types/ocr';
import { IAIExtractionProvider } from './extraction.interface';
import { DeterministicExtractor } from './deterministic.extractor';
import { MockAIExtractionProvider } from './mock-ai.extractor';
import { GeminiAIExtractionProvider } from './gemini-ai.extractor';
import { GEMINI_API_KEYS } from '../gemini/gemini-client';

export class ExtractionService {
  private aiProvider: IAIExtractionProvider;

  constructor(aiProvider?: IAIExtractionProvider) {
    if (aiProvider) {
      this.aiProvider = aiProvider;
    } else {
      const isTest = process.env.NODE_ENV === 'test';
      const providerType =
        process.env.AI_PROVIDER ||
        (!isTest && GEMINI_API_KEYS.length > 0 ? 'gemini' : 'mock');

      if (
        providerType === 'gemini' &&
        !isTest &&
        (GEMINI_API_KEYS.length > 0 || process.env.GEMINI_API_KEY)
      ) {
        this.aiProvider = new GeminiAIExtractionProvider();
      } else {
        this.aiProvider = new MockAIExtractionProvider();
      }
    }
  }

  /**
   * Orchestrates extraction:
   * 1. If AI provider is available, sends OCR result + raw image to AI model to verify OCR in background and extract all statutory declarations.
   * 2. Fallback to deterministic regex extractor when AI is mock or unavailable.
   */
  async extractDeclarations(
    ocrResult: OCRResult,
    categoryHint?: string,
    imageBuffer?: Buffer,
    mimeType?: string
  ): Promise<ProductDeclaration> {
    if (this.aiProvider.name === 'gemini') {
      try {
        return await this.aiProvider.extractDeclarations(ocrResult, categoryHint, imageBuffer, mimeType);
      } catch (err) {
        console.warn('Gemini extraction failed, falling back to deterministic extractor:', err);
        return DeterministicExtractor.extract(ocrResult);
      }
    }

    // In tests or when mock provider is configured
    return DeterministicExtractor.extract(ocrResult);
  }
}

import { ProductDeclaration } from '../types/extraction';
import { OCRResult } from '../types/ocr';
import { IAIExtractionProvider } from './extraction.interface';
import { DeterministicExtractor } from './deterministic.extractor';
import { MockAIExtractionProvider } from './mock-ai.extractor';
import { GeminiAIExtractionProvider } from './gemini-ai.extractor';
import { NovaAIExtractionProvider } from './nova-ai.extractor';
import { GEMINI_API_KEYS } from '../gemini/gemini-client';
import { isNovaConfigured } from '../ai/openai-client';

export class ExtractionService {
  private aiProvider: IAIExtractionProvider;

  constructor(aiProvider?: IAIExtractionProvider) {
    if (aiProvider) {
      this.aiProvider = aiProvider;
    } else {
      const isTest = process.env.NODE_ENV === 'test';

      // Nova (AICredits) takes priority when its API key is configured,
      // regardless of AI_PROVIDER env var
      if (!isTest && isNovaConfigured()) {
        this.aiProvider = new NovaAIExtractionProvider();
      } else if (
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
    mimeType?: string,
    additionalImages?: { buffer: Buffer; mimeType?: string; label?: string }[]
  ): Promise<ProductDeclaration> {
    if (this.aiProvider.name === 'nova') {
      try {
        return await this.aiProvider.extractDeclarations(ocrResult, categoryHint, imageBuffer, mimeType, additionalImages);
      } catch (err) {
        console.warn('Nova extraction failed, falling back to Deterministic:', err);
        return DeterministicExtractor.extract(ocrResult);
      }
    }

    if (this.aiProvider.name === 'gemini') {
      try {
        return await this.aiProvider.extractDeclarations(ocrResult, categoryHint, imageBuffer, mimeType, additionalImages);
      } catch (err) {
        console.warn('Gemini extraction failed, falling back to deterministic extractor:', err);
        return DeterministicExtractor.extract(ocrResult);
      }
    }

    // In tests or when mock provider is configured
    return DeterministicExtractor.extract(ocrResult);
  }
}

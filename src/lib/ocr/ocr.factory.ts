import { IOCRProvider } from './ocr.interface';
import { MockOCRProvider } from './mock-ocr.provider';
import { GeminiOCRProvider } from './gemini-ocr.provider';
import { NovaOCRProvider } from './nova-ocr.provider';
import { GEMINI_API_KEYS } from '../gemini/gemini-client';
import { isNovaConfigured } from '../ai/openai-client';

let ocrInstance: IOCRProvider | null = null;

export function getOCRProvider(forceType?: string): IOCRProvider {
  if (ocrInstance && !forceType) {
    return ocrInstance;
  }

  const isTest = process.env.NODE_ENV === 'test';

  // Nova (AICredits) takes priority when its API key is configured,
  // regardless of OCR_PROVIDER env var
  if ((forceType === 'nova' || !forceType) && !isTest && isNovaConfigured()) {
    ocrInstance = new NovaOCRProvider();
    return ocrInstance;
  }

  if (
    !isTest &&
    (GEMINI_API_KEYS.length > 0 || process.env.GEMINI_API_KEY)
  ) {
    ocrInstance = new GeminiOCRProvider();
    return ocrInstance;
  }

  ocrInstance = new MockOCRProvider();
  return ocrInstance;
}

export function resetOCRProvider(): void {
  ocrInstance = null;
}

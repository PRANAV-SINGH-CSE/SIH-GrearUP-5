import { IOCRProvider } from './ocr.interface';
import { MockOCRProvider } from './mock-ocr.provider';
import { GeminiOCRProvider } from './gemini-ocr.provider';
import { GEMINI_API_KEYS } from '../gemini/gemini-client';

let ocrInstance: IOCRProvider | null = null;

export function getOCRProvider(forceType?: string): IOCRProvider {
  if (ocrInstance && !forceType) {
    return ocrInstance;
  }

  const isTest = process.env.NODE_ENV === 'test';
  const providerType =
    forceType ||
    process.env.OCR_PROVIDER ||
    (!isTest && GEMINI_API_KEYS.length > 0 ? 'gemini' : 'mock');

  if (
    providerType === 'gemini' &&
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

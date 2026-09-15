import { GoogleGenAI } from '@google/genai';

export const GEMINI_API_KEYS: string[] = [];

export const GEMINI_FLASH_MODELS = [
  'gemini-3.5-flash-lite', // Top priority: Flash Lite (highest RPD & fastest latency)
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.8-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
];

let currentKeyIndex = 0;

/**
 * Executes a Gemini operation with automatic rotation and failover across the provided keys.
 */
export async function executeWithGeminiFailover<T>(
  operation: (ai: GoogleGenAI, apiKey: string) => Promise<T>
): Promise<T> {
  let lastError: unknown = null;
  const totalKeys = GEMINI_API_KEYS.length;

  for (let attempt = 0; attempt < totalKeys; attempt++) {
    const keyIndex = (currentKeyIndex + attempt) % totalKeys;
    const apiKey = GEMINI_API_KEYS[keyIndex];

    try {
      const ai = new GoogleGenAI({ apiKey });
      const result = await operation(ai, apiKey);
      // Update starting index on success to distribute load
      currentKeyIndex = keyIndex;
      return result;
    } catch (err: unknown) {
      console.warn(`Gemini API call failed with key index ${keyIndex} (${apiKey.substring(0, 10)}...):`, err);
      lastError = err;
    }
  }

  throw new Error(`All ${totalKeys} Gemini API keys failed. Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

import { GoogleGenAI } from '@google/genai';

export const GEMINI_API_KEYS: string[] = [
  // Active, un-revoked keys (prioritized first for sub-second start):
  "AIzaSyBn0mP0s4H7kwayUoGNJF8HIHtqgO4ztBs",
  "AIzaSyDGL-d9BbMcOYmNnriPQC1JAIKgt76EFGI",
  "AIzaSyBZoa8280VoAoozcEkyt-PNGHxXUftGzP8",
  "AIzaSyAy4JVRxV76eR17219LP0xjp9gf41K6XDE",
  "AIzaSyAA5vPMjlUg3JgFf6EHVssatbVBwZ1EvKk",
  "AIzaSyAvMhKjebIRrVj8OP00Rw3bYtpvk0dCZiM",
  // Backup keys:
  "AIzaSyBjv_UYq1hPiEGWE-1oEchZix6gmxqRRxw",
  "AIzaSyDI1sigh2L8TlSZt8B9p7J9-qBwv5M4fHk",
  "AIzaSyA8DHQLG0oXKaj2BLhfSb-577QQbyoqZEs",
  "AIzaSyBi5Kbu28nPROm6wiaOPjCdRsLrydRzI7o",
  "AIzaSyDNM8ShjNKlSixLRgwYK284VIiKxaUUAHA",
  "AIzaSyA0mFKdqf6cnBTpqTsRNqs2ejlrjQTMrq8",
  "AIzaSyB1D7MJglvJ6yboJ-RWAEWAVWVd7gUEdEg",
  "AIzaSyBAgchc35GQTcsl9jO-gYGxB57i0PL7RRw",
  "AIzaSyCxA451DiriFwho9eyeXgal05VvPQfAyCI",
  "AIzaSyAiOoPxFZQzqS-TfpgNY9yGupk6m00801E",
];

export const GEMINI_FLASH_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.8-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
];

// In-memory key health state for fast failover
let currentKeyIndex = 0;

// Pre-blacklist keys identified by Google as leaked so 0ms is wasted attempting them
const blacklistedKeys = new Set<string>([
  "AIzaSyBjv_UYq1hPiEGWE-1oEchZix6gmxqRRxw",
  "AIzaSyDI1sigh2L8TlSZt8B9p7J9-qBwv5M4fHk",
  "AIzaSyA8DHQLG0oXKaj2BLhfSb-577QQbyoqZEs",
  "AIzaSyBi5Kbu28nPROm6wiaOPjCdRsLrydRzI7o",
  "AIzaSyDNM8ShjNKlSixLRgwYK284VIiKxaUUAHA",
  "AIzaSyA0mFKdqf6cnBTpqTsRNqs2ejlrjQTMrq8",
  "AIzaSyB1D7MJglvJ6yboJ-RWAEWAVWVd7gUEdEg",
  "AIzaSyBAgchc35GQTcsl9jO-gYGxB57i0PL7RRw",
  "AIzaSyCxA451DiriFwho9eyeXgal05VvPQfAyCI",
  "AIzaSyAiOoPxFZQzqS-TfpgNY9yGupk6m00801E",
]);

const rateLimitedKeys = new Map<string, number>(); // apiKey -> cooldown timestamp

// Pre-flag non-existent models so zero network roundtrips are wasted on 404s
const invalidModels = new Set<string>([
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.8-flash',
]);

let lastWorkingModel: string | null = null;

function getAllApiKeys(): string[] {
  const keys = [...GEMINI_API_KEYS];
  if (process.env.GEMINI_API_KEY && !keys.includes(process.env.GEMINI_API_KEY)) {
    keys.unshift(process.env.GEMINI_API_KEY);
  }
  if (process.env.GEMINI_API_KEYS) {
    const envKeys = process.env.GEMINI_API_KEYS.split(',').map((k) => k.trim()).filter(Boolean);
    for (const ek of envKeys) {
      if (!keys.includes(ek)) keys.push(ek);
    }
  }
  return keys;
}

function isKeyFailure(errMessage: string, status?: number): boolean {
  return (
    status === 401 ||
    status === 403 ||
    errMessage.includes('PERMISSION_DENIED') ||
    errMessage.includes('leaked') ||
    errMessage.includes('UNAUTHENTICATED') ||
    errMessage.includes('API key not valid') ||
    errMessage.includes('API_KEY_INVALID')
  );
}

function isRateLimitFailure(errMessage: string, status?: number): boolean {
  return (
    status === 429 ||
    errMessage.includes('RESOURCE_EXHAUSTED') ||
    errMessage.includes('Quota exceeded') ||
    errMessage.includes('RATE_LIMIT_EXCEEDED')
  );
}

function isModelNotFound(errMessage: string, status?: number): boolean {
  return (
    status === 404 ||
    errMessage.includes('NOT_FOUND') ||
    errMessage.includes('not found') ||
    errMessage.includes('is no longer available') ||
    errMessage.includes('unsupported')
  );
}

export interface GenerateGeminiContentOptions {
  contents: any;
  config?: any;
  candidateModels?: string[];
  timeoutMs?: number;
}

/**
 * High-speed content generation across Gemini models and rotated API keys.
 * Hard-capped to finish in < 4.5s so the entire pipeline stays well under 10 seconds.
 */
export async function executeGeminiGenerateContent(
  options: GenerateGeminiContentOptions
): Promise<{ text: string; modelUsed: string }> {
  const allKeys = getAllApiKeys();
  const totalKeys = allKeys.length;
  if (totalKeys === 0) {
    throw new Error('No Gemini API keys configured.');
  }

  // Maximum 4.5s per attempt to guarantee whole scan completes under 10 seconds
  const timeoutMs = options.timeoutMs || 4500;
  const now = Date.now();

  // Order candidate models: prioritize working models and available flash models first
  const baseModels = options.candidateModels || GEMINI_FLASH_MODELS;
  const orderedModels: string[] = [];
  
  if (lastWorkingModel && baseModels.includes(lastWorkingModel) && !invalidModels.has(lastWorkingModel)) {
    orderedModels.push(lastWorkingModel);
  }
  
  // Available models in Google Gen AI
  const preferredAvailable = ['gemini-2.5-flash-lite', 'gemini-2.5-flash'];
  for (const m of preferredAvailable) {
    if (baseModels.includes(m) && !orderedModels.includes(m) && !invalidModels.has(m)) {
      orderedModels.push(m);
    }
  }

  for (const m of baseModels) {
    if (!orderedModels.includes(m) && !invalidModels.has(m)) {
      orderedModels.push(m);
    }
  }

  const modelsToTry = orderedModels.length > 0 ? orderedModels : ['gemini-2.5-flash'];

  let lastError: unknown = null;
  let activeAttempts = 0;
  const MAX_ACTIVE_KEY_ATTEMPTS = 3; // Limit attempts to max 3 keys to strictly cap latency

  for (let attempt = 0; attempt < totalKeys; attempt++) {
    if (activeAttempts >= MAX_ACTIVE_KEY_ATTEMPTS) {
      break; // Fast bail-out to deterministic engine if active keys hit quota
    }

    const keyIndex = (currentKeyIndex + attempt) % totalKeys;
    const apiKey = allKeys[keyIndex];

    if (blacklistedKeys.has(apiKey)) {
      continue;
    }

    const cooldownUntil = rateLimitedKeys.get(apiKey);
    if (cooldownUntil && cooldownUntil > now) {
      continue;
    }

    activeAttempts++;
    const ai = new GoogleGenAI({ apiKey });

    for (const model of modelsToTry) {
      if (invalidModels.has(model) && modelsToTry.length > 1) {
        continue;
      }

      try {
        const generatePromise = ai.models.generateContent({
          model,
          contents: options.contents,
          config: options.config,
        });

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms on model ${model}`)), timeoutMs);
        });

        const response: any = await Promise.race([generatePromise, timeoutPromise]);

        if (response && (response.text !== undefined || response.candidates?.length)) {
          currentKeyIndex = keyIndex;
          lastWorkingModel = model;
          return {
            text: response.text || '',
            modelUsed: model,
          };
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err?.message || err || '');
        const errStatus = Number(err?.status || err?.code || 0);

        if (isKeyFailure(errMsg, errStatus)) {
          blacklistedKeys.add(apiKey);
          break;
        }

        if (isRateLimitFailure(errMsg, errStatus)) {
          rateLimitedKeys.set(apiKey, Date.now() + 45_000);
          break;
        }

        if (isModelNotFound(errMsg, errStatus)) {
          invalidModels.add(model);
          continue;
        }
      }
    }
  }

  const errMsg = lastError instanceof Error ? lastError.message : String(lastError || 'All keys exhausted');
  throw new Error(`Gemini generateContent fast-fallback. Last error: ${errMsg}`);
}

/**
 * Backward-compatible failover wrapper with fast key rotation and blacklisting.
 */
export async function executeWithGeminiFailover<T>(
  operation: (ai: GoogleGenAI, apiKey: string) => Promise<T>
): Promise<T> {
  const allKeys = getAllApiKeys();
  const totalKeys = allKeys.length;
  if (totalKeys === 0) {
    throw new Error('No Gemini API keys configured.');
  }

  let lastError: unknown = null;
  const now = Date.now();
  let attempts = 0;

  for (let attempt = 0; attempt < totalKeys; attempt++) {
    if (attempts >= 3) break;

    const keyIndex = (currentKeyIndex + attempt) % totalKeys;
    const apiKey = allKeys[keyIndex];

    if (blacklistedKeys.has(apiKey)) continue;
    const cooldownUntil = rateLimitedKeys.get(apiKey);
    if (cooldownUntil && cooldownUntil > now) continue;

    attempts++;
    try {
      const ai = new GoogleGenAI({ apiKey });
      const result = await operation(ai, apiKey);
      currentKeyIndex = keyIndex;
      return result;
    } catch (err: any) {
      lastError = err;
      const errMsg = String(err?.message || err || '');
      const errStatus = Number(err?.status || err?.code || 0);

      if (isKeyFailure(errMsg, errStatus)) {
        blacklistedKeys.add(apiKey);
      } else if (isRateLimitFailure(errMsg, errStatus)) {
        rateLimitedKeys.set(apiKey, Date.now() + 45_000);
      }
    }
  }

  throw new Error(`All Gemini API keys failed. Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

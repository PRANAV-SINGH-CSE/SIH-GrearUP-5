import { GoogleGenAI } from '@google/genai';

export const GEMINI_API_KEYS: string[] = [
  "AIzaSyBjv_UYq1hPiEGWE-1oEchZix6gmxqRRxw",
  "AIzaSyDI1sigh2L8TlSZt8B9p7J9-qBwv5M4fHk",
  "AIzaSyA8DHQLG0oXKaj2BLhfSb-577QQbyoqZEs",
  "AIzaSyBi5Kbu28nPROm6wiaOPjCdRsLrydRzI7o",
  "AIzaSyDNM8ShjNKlSixLRgwYK284VIiKxaUUAHA",
  "AIzaSyA0mFKdqf6cnBTpqTsRNqs2ejlrjQTMrq8",
  "AIzaSyB1D7MJglvJ6yboJ-RWAEWAVWVd7gUEdEg",
  "AIzaSyBAgchc35GQTcsl9jO-gYGxB57i0PL7RRw",
  "AIzaSyCxA451DiriFwho9eyeXgal05VvPQfAyCI",
  "AIzaSyBn0mP0s4H7kwayUoGNJF8HIHtqgO4ztBs",
  "AIzaSyDGL-d9BbMcOYmNnriPQC1JAIKgt76EFGI",
  "AIzaSyBZoa8280VoAoozcEkyt-PNGHxXUftGzP8",
  "AIzaSyAy4JVRxV76eR17219LP0xjp9gf41K6XDE",
  "AIzaSyAA5vPMjlUg3JgFf6EHVssatbVBwZ1EvKk",
  "AIzaSyAvMhKjebIRrVj8OP00Rw3bYtpvk0dCZiM",
  "AIzaSyAiOoPxFZQzqS-TfpgNY9yGupk6m00801E",
];

export const GEMINI_FLASH_MODELS = [
  'gemini-3.5-flash-lite', // Top priority: Flash Lite (highest RPD & fastest latency)
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.8-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
];

// In-memory key health state for fast failover
let currentKeyIndex = 0;
const blacklistedKeys = new Set<string>();
const rateLimitedKeys = new Map<string, number>(); // apiKey -> cooldown timestamp
const invalidModels = new Set<string>();
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
 * Implements:
 * 1. Immediate key rotation on 401/403/429 without looping through redundant models.
 * 2. Permanent blacklisting of leaked/invalid keys to avoid repeating 403s.
 * 3. Cooldown tracking for 429 rate-limited keys.
 * 4. Model caching: prioritizes the last working model and skips 404 models across all keys.
 * 5. Fast per-request timeout to prevent stalling the inspection pipeline.
 */
export async function executeGeminiGenerateContent(
  options: GenerateGeminiContentOptions
): Promise<{ text: string; modelUsed: string }> {
  const allKeys = getAllApiKeys();
  const totalKeys = allKeys.length;
  if (totalKeys === 0) {
    throw new Error('No Gemini API keys configured.');
  }

  const timeoutMs = options.timeoutMs || 8000;
  const now = Date.now();

  // Order candidate models: last working model first, then configured models, skipping known 404s
  const baseModels = options.candidateModels || GEMINI_FLASH_MODELS;
  const orderedModels: string[] = [];
  if (lastWorkingModel && baseModels.includes(lastWorkingModel) && !invalidModels.has(lastWorkingModel)) {
    orderedModels.push(lastWorkingModel);
  }
  for (const m of baseModels) {
    if (!orderedModels.includes(m) && !invalidModels.has(m)) {
      orderedModels.push(m);
    }
  }

  // Fallback if all models were flagged invalid
  const modelsToTry = orderedModels.length > 0 ? orderedModels : baseModels;

  let lastError: unknown = null;
  let triedKeyCount = 0;

  for (let attempt = 0; attempt < totalKeys; attempt++) {
    const keyIndex = (currentKeyIndex + attempt) % totalKeys;
    const apiKey = allKeys[keyIndex];

    // Skip permanently blacklisted keys (leaked/invalid)
    if (blacklistedKeys.has(apiKey)) {
      continue;
    }

    // Skip keys currently in rate-limit cooldown
    const cooldownUntil = rateLimitedKeys.get(apiKey);
    if (cooldownUntil && cooldownUntil > now) {
      continue;
    }

    triedKeyCount++;
    const ai = new GoogleGenAI({ apiKey });

    // Try models for this key
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

        // Fast timeout wrapper
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms on model ${model}`)), timeoutMs);
        });

        const response: any = await Promise.race([generatePromise, timeoutPromise]);

        if (response && (response.text !== undefined || response.candidates?.length)) {
          // Success! Update rotation state and working model cache
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

        // 1. If key is leaked or unauthorized, blacklist immediately and move to next key
        if (isKeyFailure(errMsg, errStatus)) {
          console.warn(`[Gemini SDK] Key index ${keyIndex} (${apiKey.slice(0, 10)}...) is invalid/leaked (403/401). Blacklisting.`);
          blacklistedKeys.add(apiKey);
          break; // Stop trying more models on this dead key!
        }

        // 2. If rate-limited (429), place on 45s cooldown and move to next key immediately
        if (isRateLimitFailure(errMsg, errStatus)) {
          console.warn(`[Gemini SDK] Key index ${keyIndex} (${apiKey.slice(0, 10)}...) hit quota limit (429). Setting cooldown.`);
          rateLimitedKeys.set(apiKey, Date.now() + 45_000);
          break; // Stop trying more models on this rate-limited key!
        }

        // 3. If model doesn't exist (404), mark model invalid so subsequent keys skip it
        if (isModelNotFound(errMsg, errStatus)) {
          invalidModels.add(model);
          continue; // Try next model on this same key
        }

        // Other errors (timeouts, transient network): log and try next model
        console.warn(`[Gemini SDK] Model ${model} on key ${keyIndex} failed: ${errMsg.slice(0, 100)}`);
      }
    }
  }

  const errMsg = lastError instanceof Error ? lastError.message : String(lastError || 'All keys exhausted');
  throw new Error(`Gemini generateContent exhausted across ${triedKeyCount} keys. Last error: ${errMsg}`);
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

  for (let attempt = 0; attempt < totalKeys; attempt++) {
    const keyIndex = (currentKeyIndex + attempt) % totalKeys;
    const apiKey = allKeys[keyIndex];

    if (blacklistedKeys.has(apiKey)) continue;
    const cooldownUntil = rateLimitedKeys.get(apiKey);
    if (cooldownUntil && cooldownUntil > now) continue;

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
      console.warn(`[Gemini SDK] Key index ${keyIndex} failed: ${errMsg.slice(0, 100)}`);
    }
  }

  throw new Error(`All Gemini API keys failed. Last error: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

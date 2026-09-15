import OpenAI from 'openai';

export const AICREDITS_BASE_URL =
  process.env.AICREDITS_BASE_URL || 'https://aicredits.in/v1';

export const AICREDITS_MODEL =
  process.env.AICREDITS_MODEL || 'amazon/nova-lite-v1';

let openaiClientInstance: OpenAI | null = null;

export function getOpenAIClient(): OpenAI | null {
  const apiKey =
    process.env.AICREDITS_API_KEY ||
    process.env.OPENAI_API_KEY ||
    '';

  if (!apiKey || apiKey === 'sk-your-key-here') {
    return null;
  }

  if (!openaiClientInstance) {
    console.log('[OpenAI Client] Creating client with baseURL:', AICREDITS_BASE_URL, 'model:', AICREDITS_MODEL);
    openaiClientInstance = new OpenAI({
      baseURL: AICREDITS_BASE_URL,
      apiKey: apiKey,
      timeout: 120000, // 2 min timeout — vision model image processing needs more time
    });
  }

  return openaiClientInstance;
}

export function isNovaConfigured(): boolean {
  const apiKey = process.env.AICREDITS_API_KEY || process.env.OPENAI_API_KEY;
  return Boolean(apiKey && apiKey !== 'sk-your-key-here');
}

import { IOCRProvider, OCROptions } from './ocr.interface';
import { OCRResult, OCRBlock } from '../types/ocr';
import { executeWithGeminiFailover, GEMINI_FLASH_MODELS } from '../gemini/gemini-client';

export class GeminiOCRProvider implements IOCRProvider {
  readonly name = 'gemini';

  async extractText(
    imageBuffer: Buffer,
    mimeType: string,
    _options?: OCROptions
  ): Promise<OCRResult> {
    const startTime = Date.now();

    const prompt = `You are a high-precision OCR perception engine for Indian packaged commodity labels.
Inspect this image and extract ALL text exactly as printed.
Return a structured JSON object with this exact shape:
{
  "fullText": "complete transcription of all label text, line by line",
  "confidence": 0.95,
  "detectedLanguage": "en",
  "lines": [
    {
      "text": "line text",
      "confidence": 0.95
    }
  ]
}
Do NOT summarize, do NOT correct typos, do NOT invent text. Transcribe verbatim. Return ONLY valid JSON.`;

    return executeWithGeminiFailover(async (ai) => {
      let response;
      for (const model of GEMINI_FLASH_MODELS) {
        try {
          response = await ai.models.generateContent({
            model,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: {
                      data: imageBuffer.toString('base64'),
                      mimeType: mimeType || 'image/jpeg',
                    },
                  },
                  { text: prompt },
                ],
              },
            ],
            config: {
              responseMimeType: 'application/json',
            },
          });
          if (response && response.text) break;
        } catch (err) {
          console.warn(`OCR model ${model} failed, trying next candidate:`, err);
        }
      }

      if (!response) {
        throw new Error('All Flash models failed during OCR extraction');
      }

      const responseText = response.text || '{}';
      let parsed: {
        fullText?: string;
        confidence?: number;
        detectedLanguage?: string;
        lines?: Array<{ text: string; confidence: number }>;
      } = {};

      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = { fullText: responseText, confidence: 0.8, lines: [] };
      }

      const fullText = parsed.fullText || responseText;
      const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.92;
      const rawLines = Array.isArray(parsed.lines)
        ? parsed.lines
        : fullText.split('\n').map((l: string) => ({ text: l, confidence }));

      const blocks: OCRBlock[] = [
        {
          blockType: 'TEXT',
          confidence,
          lines: rawLines.map((line) => ({
            text: line.text || '',
            confidence: line.confidence || confidence,
            words: (line.text || '').split(/\s+/).map((w: string) => ({
              text: w,
              confidence: line.confidence || confidence,
            })),
          })),
        },
      ];

      return {
        fullText,
        blocks,
        confidence,
        detectedLanguage: parsed.detectedLanguage || 'en',
        provider: 'gemini-2.5-flash',
        durationMs: Date.now() - startTime,
        rawResponse: parsed,
      };
    });
  }
}

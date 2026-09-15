import { IOCRProvider, OCROptions } from './ocr.interface';
import { OCRResult, OCRBlock } from '../types/ocr';
import { getOpenAIClient, AICREDITS_MODEL } from '../ai/openai-client';

export class NovaOCRProvider implements IOCRProvider {
  readonly name = 'nova';

  async extractText(
    imageBuffer: Buffer,
    mimeType: string,
    _options?: OCROptions
  ): Promise<OCRResult> {
    const startTime = Date.now();
    const client = getOpenAIClient();

    if (!client) {
      throw new Error('Nova/OpenAI client not configured. Set AICREDITS_API_KEY in .env.local');
    }

    const systemPrompt = `You are a high-precision OCR perception engine for Indian packaged commodity labels.
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

    console.log('[Nova OCR] Sending request to', AICREDITS_MODEL, '...');
    const completion = await client.chat.completions.create({
      model: AICREDITS_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType || 'image/jpeg'};base64,${imageBuffer.toString('base64')}`,
              },
            },
            { type: 'text', text: 'Extract all printed text on this label verbatim in the specified JSON format.' },
          ] as any,
        },
      ],
      temperature: 0.1,
    });
    console.log('[Nova OCR] Response received successfully');

    const rawResponseText = completion.choices[0]?.message?.content || '{}';

    // Some models wrap JSON in markdown code fences — extract it
    let responseText = rawResponseText.trim();
    const jsonBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlockMatch) {
      responseText = jsonBlockMatch[1].trim();
    }

    let parsed: {
      fullText?: string;
      confidence?: number;
      detectedLanguage?: string;
      lines?: Array<{ text: string; confidence: number }>;
    } = {};

    try {
      parsed = JSON.parse(responseText);
    } catch {
      // If JSON parsing fails, use the raw text as fullText
      parsed = { fullText: rawResponseText, confidence: 0.85, lines: [] };
    }

    const fullText = parsed.fullText || rawResponseText;
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
      provider: AICREDITS_MODEL,
      durationMs: Date.now() - startTime,
      rawResponse: parsed,
    };
  }
}

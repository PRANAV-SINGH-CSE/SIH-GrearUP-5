import { IAIExtractionProvider } from './extraction.interface';
import { ProductDeclaration, ProductDeclarationSchema } from '../types/extraction';
import { OCRResult } from '../types/ocr';
import { DeterministicExtractor } from './deterministic.extractor';
import { getOpenAIClient, AICREDITS_MODEL } from '../ai/openai-client';

export class NovaAIExtractionProvider implements IAIExtractionProvider {
  readonly name = 'nova';

  async extractDeclarations(
    ocrResult: OCRResult,
    categoryHint?: string,
    imageBuffer?: Buffer,
    mimeType?: string
  ): Promise<ProductDeclaration> {
    const client = getOpenAIClient();
    if (!client) {
      throw new Error('Nova/OpenAI client not configured. Set AICREDITS_API_KEY in .env.local');
    }

    const systemPrompt = `You are an expert Legal Metrology verification auditor for Indian packaged commodities under the Legal Metrology (Packaged Commodities) Rules, 2011.
Extract all statutory mandatory declarations into valid JSON format.
If a field is not present or cannot be found, set value to null. Do NOT hallucinate.
Strictly return valid JSON adhering to this exact schema:
{
  "productName": { "value": "string or null", "confidence": 0.95, "rawText": "string" },
  "genericName": { "value": "string or null", "confidence": 0.95, "rawText": "string" },
  "manufacturer": { "value": { "name": "...", "address": "..." }, "confidence": 0.95 },
  "packer": { "value": { "name": "...", "address": "..." }, "confidence": 0.95 },
  "importer": { "value": { "name": "...", "address": "..." }, "confidence": 0.95 },
  "netQuantity": { "value": { "value": 200, "unit": "g", "rawUnit": "g", "isValidUnit": true }, "confidence": 0.95, "rawText": "string" },
  "mrp": { "value": { "amount": 50, "currency": "INR", "isTaxInclusive": true }, "confidence": 0.95, "rawText": "string" },
  "unitSalePrice": { "value": { "amount": 0.25, "perUnit": "g", "currency": "INR" }, "confidence": 0.90 },
  "countryOfOrigin": { "value": "India", "confidence": 0.95 },
  "manufactureDate": { "value": { "month": 2, "year": 2026, "rawText": "02/2026", "isAmbiguous": false }, "confidence": 0.95 },
  "packingDate": { "value": null, "confidence": 0 },
  "bestBefore": { "value": "string or null", "confidence": 0.90 },
  "expiryDate": { "value": null, "confidence": 0 },
  "consumerCare": { "value": { "phone": "...", "email": "...", "address": "..." }, "confidence": 0.95 },
  "batchNumber": { "value": "string or null", "confidence": 0.95 },
  "overallConfidence": 0.95
}
Return ONLY valid JSON. Do not wrap in markdown code fences.`;

    const userContent: Array<
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string } }
    > = [];

    if (imageBuffer && imageBuffer.length > 0) {
      userContent.push({
        type: 'image_url',
        image_url: {
          url: `data:${mimeType || 'image/jpeg'};base64,${imageBuffer.toString('base64')}`,
        },
      });
    }

    userContent.push({
      type: 'text',
      text: `Category Hint: ${categoryHint || 'GENERIC_PACKAGED_COMMODITY'}\n\nOCR Transcript:\n${ocrResult.fullText || '(No OCR text found)'}\n\nPlease inspect the image and OCR transcript, and extract the statutory declarations strictly in valid JSON.`,
    });

    try {
      console.log('[Nova Extraction] Sending request to', AICREDITS_MODEL, '...');
      const completion = await client.chat.completions.create({
        model: AICREDITS_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent as any },
        ],
        temperature: 0.1,
      });
      console.log('[Nova Extraction] Response received successfully');

      const rawText = completion.choices[0]?.message?.content || '{}';

      // Some models wrap JSON in markdown code fences — extract it
      let text = rawText.trim();
      const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonBlockMatch) {
        text = jsonBlockMatch[1].trim();
      }

      const parsed = JSON.parse(text);

      const validated = ProductDeclarationSchema.safeParse({
        ...parsed,
        extractionMethod: imageBuffer ? 'hybrid' : 'ai',
      });

      if (validated.success) {
        return validated.data;
      } else {
        console.warn('Nova extraction schema mismatch, falling back to deterministic:', validated.error);
        return DeterministicExtractor.extract(ocrResult);
      }
    } catch (err) {
      console.warn('Nova extraction call failed:', err);
      throw err;
    }
  }
}

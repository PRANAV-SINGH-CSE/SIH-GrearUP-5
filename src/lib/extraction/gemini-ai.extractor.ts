import { IAIExtractionProvider } from './extraction.interface';
import { ProductDeclaration, ProductDeclarationSchema } from '../types/extraction';
import { OCRResult } from '../types/ocr';
import { DeterministicExtractor } from './deterministic.extractor';
import { executeWithGeminiFailover, GEMINI_FLASH_MODELS } from '../gemini/gemini-client';

export class GeminiAIExtractionProvider implements IAIExtractionProvider {
  readonly name = 'gemini';

  async extractDeclarations(
    ocrResult: OCRResult,
    categoryHint?: string,
    imageBuffer?: Buffer,
    mimeType?: string
  ): Promise<ProductDeclaration> {
    const systemInstructions = `You are an expert Legal Metrology verification perception auditor for Indian packaged commodities under the Legal Metrology (Packaged Commodities) Rules, 2011.

You are given:
1. The photograph of the packaged product label.
2. The initial OCR perception transcript extracted from the label.

YOUR STEP-BY-STEP TASK:
STEP 1: BACKGROUND OCR VERIFICATION & CORRECTION
- Cross-check the OCR transcript against the actual visible text on the product image.
- Detect any blurred, misspelled, or hallucinated numbers, letters, symbols, or missing words.
- Specifically verify:
  * Numbers in Net Quantity (e.g. 50g vs 500g, 150ml vs 15Oml)
  * Metric unit symbols (is it "g" or prohibited "gms"? is it "ml" or "ltr"?)
  * Maximum Retail Price (MRP) digits and whether "(incl. of all taxes)" or "inclusive of all taxes" is present.
  * Dates of manufacture/packing and expiry/best before.
  * Manufacturer name and complete address including PIN code.
  * Consumer care email/phone numbers.

STEP 2: STATUTORY DECLARATION EXTRACTION
Extract all mandatory declarations into the specified JSON format.
If a field is not printed or cannot be seen, set value to null. Do NOT invent information.
Category hint: ${categoryHint || 'GENERIC_PACKAGED_COMMODITY'}.

Return ONLY valid JSON with this exact schema:
{
  "productName": { "value": "string or null", "confidence": 0.95, "rawText": "string" },
  "genericName": { "value": "string or null", "confidence": 0.95, "rawText": "string" },
  "manufacturer": { "value": { "name": "...", "address": "..." }, "confidence": 0.95, "rawText": "string" },
  "packer": { "value": { "name": "...", "address": "..." }, "confidence": 0.95 },
  "importer": { "value": { "name": "...", "address": "..." }, "confidence": 0.95 },
  "netQuantity": { "value": { "value": 200, "unit": "g", "rawUnit": "g", "isValidUnit": true }, "confidence": 0.95, "rawText": "string" },
  "mrp": { "value": { "amount": 50, "currency": "INR", "isTaxInclusive": true, "rawWording": "string" }, "confidence": 0.95, "rawText": "string" },
  "unitSalePrice": { "value": { "amount": 0.25, "perUnit": "g", "currency": "INR" }, "confidence": 0.90 },
  "countryOfOrigin": { "value": "India", "confidence": 0.95, "rawText": "string" },
  "manufactureDate": { "value": { "month": 2, "year": 2026, "rawText": "02/2026", "isAmbiguous": false }, "confidence": 0.95 },
  "packingDate": { "value": null, "confidence": 0 },
  "bestBefore": { "value": "string or null", "confidence": 0.90 },
  "expiryDate": { "value": null, "confidence": 0 },
  "consumerCare": { "value": { "name": "...", "phone": "...", "email": "...", "address": "..." }, "confidence": 0.95 },
  "batchNumber": { "value": "string or null", "confidence": 0.95 },
  "overallConfidence": 0.95
}`;

    try {
      return await executeWithGeminiFailover(async (ai) => {
        const parts: any[] = [];

        // Attach image if available
        if (imageBuffer && imageBuffer.length > 0) {
          parts.push({
            inlineData: {
              data: imageBuffer.toString('base64'),
              mimeType: mimeType || 'image/jpeg',
            },
          });
        }

        parts.push({
          text: `${systemInstructions}\n\nHere is the initial OCR transcript from the image:\n---\n${ocrResult.fullText || '(No OCR text found)'}\n---\nPlease verify OCR against the image, correct any discrepancies, and extract the full statutory declarations in valid JSON.`,
        });

        let response;
        const candidateModels = GEMINI_FLASH_MODELS;

        for (const candidateModel of candidateModels) {
          try {
            response = await ai.models.generateContent({
              model: candidateModel,
              contents: [{ role: 'user', parts }],
              config: {
                responseMimeType: 'application/json',
              },
            });
            if (response && response.text) break;
          } catch (modelErr) {
            console.warn(`Model ${candidateModel} call failed, trying next fallback:`, modelErr);
          }
        }

        if (!response) {
          throw new Error('Failed to generate extraction content across candidate models');
        }

        const jsonStr = response.text || '{}';
        const parsed = JSON.parse(jsonStr);

        const validated = ProductDeclarationSchema.safeParse({
          ...parsed,
          extractionMethod: imageBuffer ? 'hybrid' : 'ai',
        });

        if (validated.success) {
          return validated.data;
        } else {
          console.warn('AI Extraction schema mismatch:', validated.error);
          return DeterministicExtractor.extract(ocrResult);
        }
      });
    } catch (err) {
      console.warn('Gemini extraction failover exhausted, falling back to deterministic extraction:', err);
      return DeterministicExtractor.extract(ocrResult);
    }
  }
}

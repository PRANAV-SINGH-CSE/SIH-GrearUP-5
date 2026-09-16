import { IAIExtractionProvider, MultiImageItem } from './extraction.interface';
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
    mimeType?: string,
    additionalImages?: MultiImageItem[]
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

STEP 3: QUANTITY-TO-LABEL SIZE PERMISSION IN INDIA (ROUGH APPROXIMATION)
As soon as you detect the Net Quantity (e.g. 41.5g, 50g, 200ml, 1kg):
1. Refer to Indian Legal Metrology (Packaged Commodities) Rules, 2011 permissions:
   - Rule 9 & 10 and Schedule I (First Schedule) numeral height limits:
     * <= 50g/ml: minimum numeral height is 1.0 mm (embossed: 2.0 mm)
     * 50g/ml < Net Qty <= 200g/ml: minimum numeral height is 2.0 mm (embossed: 4.0 mm)
     * 200g/ml < Net Qty <= 1kg/l: minimum numeral height is 4.0 mm (embossed: 6.0 mm)
     * > 1kg/l: minimum numeral height is 6.0 mm (embossed: 8.0 mm)
   - Principal Display Panel (PDP) permission (at least 40% of package face for rectangular packets).
2. Make a very rough approximation / sanity check:
   - Does this physical packet in the photo look roughly consistent with that declared quantity in India? (e.g., A ~40g biscuit pack looks like a single-serve ~120x60mm sachet, not a 500g family pack).
   - Rate the rough approximation from 1 to 10.
   - State whether it is roughly correct (true/false) and provide a rough plain-English explanation.

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
  "quantitySizeApproximation": {
    "declaredQuantity": "string",
    "standardTierIndia": "string (e.g. '<=50g single-serve sachet tier under LMPC Schedule I')",
    "minPermittedNumeralHeightMm": 1.0,
    "minPermittedPdpRatio": "40% of package face",
    "roughSizeScore": 8,
    "isRoughlyCorrect": true,
    "roughExplanation": "string (e.g. 'Roughly consistent: A 41.5g biscuit packet matches typical ~120x65mm single-serve packaging in India. Required min numeral height is 1.0mm. Current label size and font appear roughly permitted under Indian LMPC rules.')"
  },
  "overallConfidence": 0.95
}`;

    try {
      return await executeWithGeminiFailover(async (ai) => {
        const parts: any[] = [];

        // Attach primary image (Panel 1: Front PDP)
        if (imageBuffer && imageBuffer.length > 0) {
          parts.push({ text: 'Packaging Image 1 (Front Principal Display Panel):' });
          parts.push({
            inlineData: {
              data: imageBuffer.toString('base64'),
              mimeType: mimeType || 'image/jpeg',
            },
          });
        }

        // Attach additional images (up to 2 more, e.g. Back Panel, Side/MRP Panel)
        if (additionalImages && additionalImages.length > 0) {
          additionalImages.slice(0, 2).forEach((img, idx) => {
            if (img.buffer && img.buffer.length > 0) {
              const label = img.label || (idx === 0 ? 'Back / Information Panel' : 'Side / MRP & Dates Panel');
              parts.push({ text: `Packaging Image ${idx + 2} (${label}):` });
              parts.push({
                inlineData: {
                  data: img.buffer.toString('base64'),
                  mimeType: img.mimeType || 'image/jpeg',
                },
              });
            }
          });
        }

        parts.push({
          text: `${systemInstructions}\n\nHere is the initial OCR transcript from the package image(s):\n---\n${ocrResult.fullText || '(No OCR text found)'}\n---\nPlease cross-examine the image(s) across all visible panels, verify OCR against the physical labels, correct any discrepancies, and extract the full statutory declarations in valid JSON.`,
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

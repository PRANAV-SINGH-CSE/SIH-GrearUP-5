import { IAIExtractionProvider, MultiImageItem } from './extraction.interface';
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
    mimeType?: string,
    additionalImages?: MultiImageItem[]
  ): Promise<ProductDeclaration> {
    const client = getOpenAIClient();
    if (!client) {
      throw new Error('Nova/OpenAI client not configured. Set AICREDITS_API_KEY in .env.local');
    }

    const systemPrompt = `You are an expert Legal Metrology verification auditor for Indian packaged commodities under the Legal Metrology (Packaged Commodities) Rules, 2011.
Extract all statutory mandatory declarations into valid JSON format.
If a field is not present or cannot be found, set value to null. Do NOT hallucinate.

QUANTITY-TO-LABEL SIZE PERMISSION IN INDIA (ROUGH APPROXIMATION):
As soon as you detect the Net Quantity (e.g. 41.5g, 50g, 200ml, 1kg):
1. Refer to Indian Legal Metrology (Packaged Commodities) Rules, 2011 permissions:
   - Rule 9 & 10 and Schedule I (First Schedule) numeral height limits:
     * <= 50g/ml: minimum numeral height is 1.0 mm (embossed: 2.0 mm)
     * 50g/ml < Net Qty <= 200g/ml: minimum numeral height is 2.0 mm (embossed: 4.0 mm)
     * 200g/ml < Net Qty <= 1kg/l: minimum numeral height is 4.0 mm (embossed: 6.0 mm)
     * > 1kg/l: minimum numeral height is 6.0 mm (embossed: 8.0 mm)
   - Principal Display Panel (PDP) permission (at least 40% of package face for rectangular packets).
2. Make a very rough approximation / sanity check:
   - Does this physical packet in the photo look roughly consistent with that declared quantity in India?
   - Rate the rough approximation from 1 to 10.
   - State whether it is roughly correct (true/false) and provide a rough plain-English explanation.

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
}
Return ONLY valid JSON. Do not wrap in markdown code fences.`;

    const userContent: Array<
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string } }
    > = [];

    // Attach primary image (Panel 1)
    if (imageBuffer && imageBuffer.length > 0) {
      userContent.push({
        type: 'text',
        text: 'Packaging Image 1 (Front Principal Display Panel):',
      });
      userContent.push({
        type: 'image_url',
        image_url: {
          url: `data:${mimeType || 'image/jpeg'};base64,${imageBuffer.toString('base64')}`,
        },
      });
    }

    // Attach additional images (up to 2 more, e.g. Back Panel, Side/MRP Panel)
    if (additionalImages && additionalImages.length > 0) {
      additionalImages.slice(0, 2).forEach((img, idx) => {
        if (img.buffer && img.buffer.length > 0) {
          const label = img.label || (idx === 0 ? 'Back / Information Panel' : 'Side / MRP & Dates Panel');
          userContent.push({
            type: 'text',
            text: `Packaging Image ${idx + 2} (${label}):`,
          });
          userContent.push({
            type: 'image_url',
            image_url: {
              url: `data:${img.mimeType || 'image/jpeg'};base64,${img.buffer.toString('base64')}`,
            },
          });
        }
      });
    }

    userContent.push({
      type: 'text',
      text: `Category Hint: ${categoryHint || 'GENERIC_PACKAGED_COMMODITY'}\n\nOCR Transcript from all package faces:\n${ocrResult.fullText || '(No OCR text found)'}\n\nPlease cross-examine the image(s) across all visible panels, verify OCR against the physical labels, correct any discrepancies, and extract the full statutory declarations strictly in valid JSON.`,
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

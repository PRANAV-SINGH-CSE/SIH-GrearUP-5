import { ProductDeclaration } from '../types/extraction';
import { OCRResult } from '../types/ocr';
import { CurrencyNormalizer } from '../normalization/currency.normalizer';
import { QuantityNormalizer } from '../normalization/quantity.normalizer';
import { DateNormalizer } from '../normalization/date.normalizer';
import { ContactNormalizer } from '../normalization/contact.normalizer';

export class DeterministicExtractor {
  /**
   * Performs zero-cost, deterministic rule-based extraction from raw OCR text.
   */
  static extract(ocrResult: OCRResult): ProductDeclaration {
    const text = ocrResult.fullText;
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

    // 1. Product Name
    let productNameVal: string | null = null;
    let productNameRaw: string | undefined;
    const prodMatch = text.match(/(?:PRODUCT|ITEM|NAME)\s*[:\-]\s*([^\n]+)/i);
    if (prodMatch) {
      productNameVal = prodMatch[1].trim();
      productNameRaw = prodMatch[0];
    } else if (lines.length > 0 && !lines[0].includes(':')) {
      productNameVal = lines[0];
      productNameRaw = lines[0];
    }

    // 2. Generic Name
    let genericNameVal: string | null = null;
    let genericNameRaw: string | undefined;
    const genMatch = text.match(/(?:GENERIC\s*NAME|COMMON\s*NAME|COMMODITY)\s*[:\-]\s*([^\n]+)/i);
    if (genMatch) {
      genericNameVal = genMatch[1].trim();
      genericNameRaw = genMatch[0];
    }

    // 3. Manufacturer / Packer / Importer
    let manufacturerVal: { name?: string; address?: string } | null = null;
    let manufacturerRaw: string | undefined;
    const mfgMatch = text.match(
      /(?:MANUFACTURED\s*(?:&|AND)?\s*PACKED\s*BY|MANUFACTURED\s*BY|MFD\.?\s*BY)\s*[:\-]\s*([^\n]+)/i
    );
    if (mfgMatch) {
      const full = mfgMatch[1].trim();
      const parts = full.split(/,\s*/);
      manufacturerVal = {
        name: parts[0],
        address: parts.slice(1).join(', ') || full,
      };
      manufacturerRaw = mfgMatch[0];
    }

    let packerVal: { name?: string; address?: string } | null = null;
    const pkrMatch = text.match(/PACKED\s*BY\s*[:\-]\s*([^\n]+)/i);
    if (pkrMatch && !mfgMatch) {
      packerVal = { name: pkrMatch[1].trim() };
    }

    let importerVal: { name?: string; address?: string } | null = null;
    const impMatch = text.match(/IMPORTED\s*BY\s*[:\-]\s*([^\n]+)/i);
    if (impMatch) {
      importerVal = { name: impMatch[1].trim() };
    }

    // 4. Net Quantity
    let netQtyVal: any = null;
    let netQtyRaw: string | undefined;
    const qtyMatch = text.match(
      /(?:NET\s*(?:QUANTITY|QTY|WT\.?|WEIGHT)|NET\s*CONTENT)\s*[:\-]?\s*([^\n,]+)/i
    );
    if (qtyMatch) {
      netQtyRaw = qtyMatch[0];
      netQtyVal = QuantityNormalizer.normalizeQuantity(qtyMatch[0]);
    } else {
      // Fallback search for standalone weight/volume pattern: e.g. "1 kg" or "500 ml"
      for (const line of lines) {
        if (/UNIT\s*SALE|PRICE|MRP|USP|RS\.?|₹|PER\s|DATE|PKD|MFD/i.test(line)) {
          continue;
        }
        const parsed = QuantityNormalizer.normalizeQuantity(line);
        if (parsed) {
          netQtyVal = parsed;
          netQtyRaw = line;
          break;
        }
      }
    }

    // 5. Maximum Retail Price (MRP)
    let mrpVal: any = null;
    let mrpRaw: string | undefined;
    const mrpMatch = text.match(/(?:MAXIMUM\s*RETAIL\s*PRICE|MRP)\s*[:\-]?\s*([^\n]+)/i);
    if (mrpMatch) {
      mrpRaw = mrpMatch[0];
      const normalized = CurrencyNormalizer.normalizeMRP(mrpMatch[0]);
      if (normalized.amount !== null) {
        mrpVal = {
          amount: normalized.amount,
          currency: normalized.currency,
          isTaxInclusive: normalized.isTaxInclusive,
          rawWording: normalized.rawText,
        };
      }
    } else {
      // Fallback search for "Rs." or "₹"
      const rsMatch = text.match(/(?:Rs\.?|₹)\s*[0-9]+(?:\.[0-9]{2})?/i);
      if (rsMatch) {
        mrpRaw = rsMatch[0];
        const normalized = CurrencyNormalizer.normalizeMRP(rsMatch[0]);
        if (normalized.amount !== null) {
          mrpVal = {
            amount: normalized.amount,
            currency: normalized.currency,
            isTaxInclusive: normalized.isTaxInclusive,
            rawWording: normalized.rawText,
          };
        }
      }
    }

    // 6. Unit Sale Price (USP)
    let uspVal: any = null;
    let uspRaw: string | undefined;
    const uspMatch = text.match(
      /(?:UNIT\s*SALE\s*PRICE|USP)\s*[:\-]?\s*(?:Rs\.?|₹)?\s*([0-9]+(?:\.[0-9]+)?)\s*[\/\-]\s*([a-zA-Z]+)/i
    );
    if (uspMatch) {
      uspRaw = uspMatch[0];
      uspVal = {
        amount: parseFloat(uspMatch[1]),
        perUnit: uspMatch[2].toLowerCase(),
        currency: 'INR',
      };
    }

    // 7. Country of Origin
    let cooVal: string | null = null;
    let cooRaw: string | undefined;
    const cooMatch = text.match(/(?:COUNTRY\s*OF\s*ORIGIN|MADE\s*IN)\s*[:\-]?\s*([a-zA-Z\s]+)/i);
    if (cooMatch) {
      cooVal = cooMatch[1].trim();
      cooRaw = cooMatch[0];
    }

    // 8. Manufacture / Packing Date
    let mfgDateVal: any = null;
    let mfgDateRaw: string | undefined;
    const mfgDateMatch = text.match(
      /(?:DATE\s*OF\s*(?:MANUFACTURE|MFG|PACKING|PKD)|MFD\.?|PKD\.?|MONTH\s*&\s*YEAR\s*OF\s*(?:MFG|PACKING))\s*[:\-]?\s*([^\n]+)/i
    );
    if (mfgDateMatch) {
      mfgDateRaw = mfgDateMatch[0];
      mfgDateVal = DateNormalizer.normalizeDate(mfgDateMatch[1]);
    }

    let pkgDateVal: any = null;
    let pkgDateRaw: string | undefined;
    const pkgDateMatch = text.match(/(?:DATE\s*OF\s*PACKING|PKD\.?)\s*[:\-]?\s*([^\n]+)/i);
    if (pkgDateMatch) {
      pkgDateRaw = pkgDateMatch[0];
      pkgDateVal = DateNormalizer.normalizeDate(pkgDateMatch[1]);
    }

    // 9. Best Before / Expiry
    let bestBeforeVal: string | null = null;
    const bbMatch = text.match(/BEST\s*BEFORE\s*[:\-]?\s*([^\n]+)/i);
    if (bbMatch) {
      bestBeforeVal = bbMatch[1].trim();
    }

    let expiryDateVal: any = null;
    let expiryDateRaw: string | undefined;
    const expMatch = text.match(/(?:EXPIRY\s*DATE|EXP\.?|USE\s*BY\s*DATE|USE\s*BY)\s*[:\-]?\s*([^\n]+)/i);
    if (expMatch) {
      expiryDateRaw = expMatch[0];
      expiryDateVal = DateNormalizer.normalizeDate(expMatch[1]);
    }

    // 10. Consumer Care
    let ccVal: any = null;
    let ccRaw: string | undefined;
    const ccMatch = text.match(
      /(?:CONSUMER\s*CARE|CUSTOMER\s*CARE|HELPLINE|FEEDBACK|GRIEVANCE)\s*[:\-]?\s*([\s\S]+?)(?:BATCH|MRP|$)/i
    );
    if (ccMatch) {
      ccRaw = ccMatch[0].trim();
      ccVal = ContactNormalizer.extractConsumerCare(ccMatch[0]);
    } else {
      // General contact extraction from whole text
      const fallbackCC = ContactNormalizer.extractConsumerCare(text);
      if (fallbackCC) {
        ccVal = fallbackCC;
        ccRaw = 'Auto-detected contact details in label text';
      }
    }

    // 11. Batch / Lot Number
    let batchVal: string | null = null;
    const batchMatch = text.match(/(?:BATCH\s*NO\.?|LOT\s*NO\.?|B\.NO\.?)\s*[:\-]?\s*([a-zA-Z0-9\-_]+)/i);
    if (batchMatch) {
      batchVal = batchMatch[1].trim();
    }

    const conf = ocrResult.confidence;

    return {
      productName: {
        value: productNameVal,
        rawText: productNameRaw,
        confidence: productNameVal ? conf : 0,
        extractionMethod: 'deterministic',
      },
      genericName: {
        value: genericNameVal,
        rawText: genericNameRaw,
        confidence: genericNameVal ? conf : 0,
        extractionMethod: 'deterministic',
      },
      manufacturer: {
        value: manufacturerVal,
        rawText: manufacturerRaw,
        confidence: manufacturerVal ? conf : 0,
        extractionMethod: 'deterministic',
      },
      packer: {
        value: packerVal,
        confidence: packerVal ? conf : 0,
        extractionMethod: 'deterministic',
      },
      importer: {
        value: importerVal,
        confidence: importerVal ? conf : 0,
        extractionMethod: 'deterministic',
      },
      netQuantity: {
        value: netQtyVal,
        rawText: netQtyRaw,
        confidence: netQtyVal ? conf : 0,
        extractionMethod: 'deterministic',
      },
      mrp: {
        value: mrpVal,
        rawText: mrpRaw,
        confidence: mrpVal ? conf : 0,
        extractionMethod: 'deterministic',
      },
      unitSalePrice: {
        value: uspVal,
        rawText: uspRaw,
        confidence: uspVal ? conf : 0,
        extractionMethod: 'deterministic',
      },
      countryOfOrigin: {
        value: cooVal,
        rawText: cooRaw,
        confidence: cooVal ? conf : 0,
        extractionMethod: 'deterministic',
      },
      manufactureDate: {
        value: mfgDateVal,
        rawText: mfgDateRaw,
        confidence: mfgDateVal ? conf : 0,
        extractionMethod: 'deterministic',
      },
      packingDate: {
        value: pkgDateVal,
        rawText: pkgDateRaw,
        confidence: pkgDateVal ? conf : 0,
        extractionMethod: 'deterministic',
      },
      bestBefore: {
        value: bestBeforeVal,
        confidence: bestBeforeVal ? conf : 0,
        extractionMethod: 'deterministic',
      },
      expiryDate: {
        value: expiryDateVal,
        rawText: expiryDateRaw,
        confidence: expiryDateVal ? conf : 0,
        extractionMethod: 'deterministic',
      },
      consumerCare: {
        value: ccVal,
        rawText: ccRaw,
        confidence: ccVal ? conf : 0,
        extractionMethod: 'deterministic',
      },
      batchNumber: {
        value: batchVal,
        confidence: batchVal ? conf : 0,
        extractionMethod: 'deterministic',
      },
      rawFields: {},
      overallConfidence: conf,
      extractionMethod: 'deterministic',
    };
  }
}

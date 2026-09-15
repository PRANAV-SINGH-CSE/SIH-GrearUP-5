export interface NormalizedMRP {
  amount: number | null;
  currency: string;
  isTaxInclusive: boolean;
  rawText: string;
  isAmbiguous: boolean;
  confidence: number;
}

export class CurrencyNormalizer {
  /**
   * Normalizes MRP declarations and inspects mandatory "inclusive of all taxes" declaration.
   * Preserves ambiguous OCR readings (e.g., 'O' vs '0').
   */
  static normalizeMRP(raw: string): NormalizedMRP {
    if (!raw || typeof raw !== 'string') {
      return {
        amount: null,
        currency: 'INR',
        isTaxInclusive: false,
        rawText: raw || '',
        isAmbiguous: false,
        confidence: 0,
      };
    }

    const trimmed = raw.trim();
    let isAmbiguous = false;
    let confidence = 0.95;

    // Check for tax inclusion wording under LMPC Rule 6(1)(e)
    const taxRegex = /(incl\.?|inclusive)\s*(of)?\s*all\s*taxes/i;
    const isTaxInclusive = taxRegex.test(trimmed);

    // Look for price pattern: Rs. / ₹ / INR followed by digits or possible 'O'
    // E.g., "Rs. 150.00", "₹ 99", "15O/-"
    let cleanedPriceStr = trimmed;

    // Check if letter 'O' appears where a digit would be expected in a price
    if (/[1-9]O[\.\-\/]/.test(trimmed) || /Rs\.?\s*\d+O/i.test(trimmed)) {
      isAmbiguous = true;
      confidence = 0.75;
      cleanedPriceStr = cleanedPriceStr.replace(/([1-9])O/g, '$10');
    }

    // Match currency amounts: ₹, Rs., Rs, INR
    const match = cleanedPriceStr.match(/(?:Rs\.?|₹|INR)?\s*([0-9]+(?:\.[0-9]{1,2})?)/i);
    let amount: number | null = null;

    if (match && match[1]) {
      const parsedNum = parseFloat(match[1]);
      if (!isNaN(parsedNum) && parsedNum > 0) {
        amount = parsedNum;
      }
    }

    return {
      amount,
      currency: 'INR',
      isTaxInclusive,
      rawText: trimmed,
      isAmbiguous,
      confidence: amount !== null ? confidence : 0.3,
    };
  }
}

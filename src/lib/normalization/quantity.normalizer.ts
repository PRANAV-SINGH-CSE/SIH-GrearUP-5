import { NetQuantityDetail } from '../types/extraction';

// Standard metric unit symbols explicitly approved under LMPC Rule 7 & Schedule II
export const APPROVED_STANDARD_UNITS = new Set([
  'g',
  'kg',
  'mg',
  't',
  'ml',
  'l',
  'L',
  'm',
  'cm',
  'mm',
  'N',
  'U',
]);

// Non-standard symbols that commonly appear but violate LMPC Rule 7 & Schedule II
export const PROHIBITED_NON_STANDARD_UNITS: Record<string, string> = {
  gms: 'g',
  gm: 'g',
  'g.m.': 'g',
  kilos: 'kg',
  kgs: 'kg',
  'k.g.': 'kg',
  ltrs: 'l',
  ltr: 'l',
  'l.t.r.': 'l',
  'ml.': 'ml',
  nos: 'N',
  no: 'N',
};

export class QuantityNormalizer {
  /**
   * Parses and normalizes quantity strings into numeric values and metric units.
   * Strictly flags non-standard symbols as invalid under LMPC Rule 7.
   */
  static normalizeQuantity(raw: string): NetQuantityDetail | null {
    if (!raw || typeof raw !== 'string') return null;

    const trimmed = raw.trim();

    // Regex to match quantity: e.g. "Net Wt. 200 g", "1.5 kg", "500 gms", "10 N", "750ml"
    const match = trimmed.match(
      /(?:Net\s*(?:Qty|Quantity|Wt\.?|Weight)\s*[:\-\s]*)?([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z\.\/]+)/i
    );

    if (!match) return null;

    const numericVal = parseFloat(match[1]);
    const rawUnit = match[2].trim();
    const lowerUnit = rawUnit.toLowerCase().replace(/\.$/, '');

    if (isNaN(numericVal) || numericVal <= 0) return null;

    // Check if it is an approved standard unit
    let isValidUnit = false;
    let normalizedUnit = rawUnit;

    if (APPROVED_STANDARD_UNITS.has(rawUnit) || APPROVED_STANDARD_UNITS.has(lowerUnit)) {
      isValidUnit = true;
      normalizedUnit = APPROVED_STANDARD_UNITS.has(rawUnit) ? rawUnit : lowerUnit;
    } else if (PROHIBITED_NON_STANDARD_UNITS[lowerUnit]) {
      // It is a known prohibited variation!
      isValidUnit = false;
      normalizedUnit = PROHIBITED_NON_STANDARD_UNITS[lowerUnit];
    } else {
      isValidUnit = false;
    }

    return {
      value: numericVal,
      unit: normalizedUnit,
      rawUnit,
      isValidUnit,
      normalizedUnit,
    };
  }
}

import { describe, it, expect } from 'vitest';
import {
  Rule06ManufacturerPacker,
  Rule06GenericName,
  Rule06NetQuantityPresence,
  Rule07StandardMetricUnit,
  Rule06MRP,
  Rule06MfgPackingDate,
  Rule06CountryOfOrigin,
  Rule06ConsumerCare,
  Rule06UnitSalePrice,
  Rule09PDPProminence,
  Rule06FoodExpiry,
} from '@/lib/compliance/rules/lmpc-2011-rules';
import { ProductDeclaration } from '@/lib/types/extraction';

function createMockProduct(overrides: Partial<ProductDeclaration> = {}): ProductDeclaration {
  return {
    productName: { value: 'Basmati Rice', confidence: 0.95, extractionMethod: 'deterministic' },
    genericName: { value: 'Rice', confidence: 0.95, extractionMethod: 'deterministic' },
    manufacturer: {
      value: { name: 'Himalayan Agri', address: 'Karnal, Haryana' },
      confidence: 0.95,
      extractionMethod: 'deterministic',
    },
    packer: { value: null, confidence: 0, extractionMethod: 'deterministic' },
    importer: { value: null, confidence: 0, extractionMethod: 'deterministic' },
    netQuantity: {
      value: { value: 1, unit: 'kg', rawUnit: 'kg', isValidUnit: true },
      confidence: 0.95,
      extractionMethod: 'deterministic',
    },
    mrp: {
      value: { amount: 150, currency: 'INR', isTaxInclusive: true },
      confidence: 0.95,
      extractionMethod: 'deterministic',
    },
    unitSalePrice: {
      value: { amount: 150, perUnit: 'kg', currency: 'INR' },
      confidence: 0.9,
      extractionMethod: 'deterministic',
    },
    countryOfOrigin: { value: 'India', confidence: 0.95, extractionMethod: 'deterministic' },
    manufactureDate: {
      value: { month: 2, year: 2026, rawText: '02/2026', isAmbiguous: false },
      confidence: 0.95,
      extractionMethod: 'deterministic',
    },
    packingDate: { value: null, confidence: 0, extractionMethod: 'deterministic' },
    bestBefore: { value: '12 months', confidence: 0.9, extractionMethod: 'deterministic' },
    expiryDate: { value: null, confidence: 0, extractionMethod: 'deterministic' },
    consumerCare: {
      value: { phone: '1800-111-222', email: 'care@test.com' },
      confidence: 0.95,
      extractionMethod: 'deterministic',
    },
    batchNumber: { value: 'B-123', confidence: 0.95, extractionMethod: 'deterministic' },
    rawFields: {},
    overallConfidence: 0.95,
    extractionMethod: 'deterministic',
    ...overrides,
  };
}

describe('LMPC 2011 Legal Rules', () => {
  const baseContext = {
    category: 'GENERIC_PACKAGED_COMMODITY',
    rulesetVersion: 'LMPC-2011.v2026',
  };

  it('LMPC-R06-MFG-01 passes when manufacturer is present, fails when absent', () => {
    const rule = new Rule06ManufacturerPacker();

    // Valid
    const passResult = rule.evaluate({ ...baseContext, product: createMockProduct() });
    expect(passResult.status).toBe('PASS');

    // Missing
    const failProduct = createMockProduct({
      manufacturer: { value: null, confidence: 0, extractionMethod: 'deterministic' },
    });
    const failResult = rule.evaluate({ ...baseContext, product: failProduct });
    expect(failResult.status).toBe('FAIL');
    expect(failResult.message).toContain('was not detected');

    // Low confidence OCR -> UNVERIFIABLE
    const unvResult = rule.evaluate({
      ...baseContext,
      product: failProduct,
      ocrResult: { fullText: '', blocks: [], confidence: 0.35, provider: 'mock', detectedLanguage: 'en' },
    });
    expect(unvResult.status).toBe('UNVERIFIABLE');
  });

  it('LMPC-R07-UNIT-01 passes standard metric units and fails prohibited unit symbols', () => {
    const rule = new Rule07StandardMetricUnit();

    // Valid standard 'kg'
    const passResult = rule.evaluate({ ...baseContext, product: createMockProduct() });
    expect(passResult.status).toBe('PASS');

    // Invalid 'gms'
    const invalidProduct = createMockProduct({
      netQuantity: {
        value: { value: 500, unit: 'g', rawUnit: 'gms', isValidUnit: false },
        confidence: 0.95,
        extractionMethod: 'deterministic',
      },
    });
    const failResult = rule.evaluate({ ...baseContext, product: invalidProduct });
    expect(failResult.status).toBe('FAIL');
    expect(failResult.message).toContain("Non-standard unit symbol 'gms' detected");
  });

  it('LMPC-R06-MRP-01 verifies price and flags warning if tax inclusion is missing', () => {
    const rule = new Rule06MRP();

    // Valid with taxes
    const passResult = rule.evaluate({ ...baseContext, product: createMockProduct() });
    expect(passResult.status).toBe('PASS');

    // Present but missing 'inclusive of all taxes'
    const warnProduct = createMockProduct({
      mrp: {
        value: { amount: 120, currency: 'INR', isTaxInclusive: false },
        confidence: 0.9,
        extractionMethod: 'deterministic',
      },
    });
    const warnResult = rule.evaluate({ ...baseContext, product: warnProduct });
    expect(warnResult.status).toBe('WARNING');

    // Completely missing MRP
    const failProduct = createMockProduct({
      mrp: { value: null, confidence: 0, extractionMethod: 'deterministic' },
    });
    const failResult = rule.evaluate({ ...baseContext, product: failProduct });
    expect(failResult.status).toBe('FAIL');
  });

  it('LMPC-R09-PDP-01 marks physical font height as UNVERIFIABLE requiring human check', () => {
    const rule = new Rule09PDPProminence();
    const result = rule.evaluate({ ...baseContext, product: createMockProduct() });
    expect(result.status).toBe('UNVERIFIABLE');
    expect(result.humanVerificationRequired).toBe(true);
  });

  it('LMPC-R06-EXP-01 evaluates food expiry on FOOD_PRODUCT and is NOT_APPLICABLE on generic', () => {
    const rule = new Rule06FoodExpiry();

    // Not applicable on generic commodity
    const naResult = rule.evaluate({
      ...baseContext,
      category: 'GENERIC_PACKAGED_COMMODITY',
      product: createMockProduct(),
    });
    expect(naResult.status).toBe('NOT_APPLICABLE');

    // Applicable on FOOD_PRODUCT: Passes when expiry is present
    const passFood = rule.evaluate({
      ...baseContext,
      category: 'FOOD_PRODUCT',
      product: createMockProduct({
        expiryDate: {
          value: { month: 12, year: 2026, rawText: '12/2026', isAmbiguous: false },
          confidence: 0.95,
          extractionMethod: 'deterministic',
        },
      }),
    });
    expect(passFood.status).toBe('PASS');

    // Fails on FOOD_PRODUCT when expiry and best before are absent
    const failFood = rule.evaluate({
      ...baseContext,
      category: 'FOOD_PRODUCT',
      product: createMockProduct({
        bestBefore: { value: null, confidence: 0, extractionMethod: 'deterministic' },
        expiryDate: { value: null, confidence: 0, extractionMethod: 'deterministic' },
      }),
    });
    expect(failFood.status).toBe('FAIL');
  });
});

import { describe, it, expect } from 'vitest';
import { CurrencyNormalizer } from '@/lib/normalization/currency.normalizer';
import { QuantityNormalizer } from '@/lib/normalization/quantity.normalizer';
import { DateNormalizer } from '@/lib/normalization/date.normalizer';
import { ContactNormalizer } from '@/lib/normalization/contact.normalizer';

describe('CurrencyNormalizer', () => {
  it('correctly normalizes standard MRP with tax inclusion', () => {
    const res = CurrencyNormalizer.normalizeMRP('MRP Rs. 150.00 (inclusive of all taxes)');
    expect(res.amount).toBe(150.0);
    expect(res.currency).toBe('INR');
    expect(res.isTaxInclusive).toBe(true);
    expect(res.isAmbiguous).toBe(false);
  });

  it('detects missing tax inclusion declaration', () => {
    const res = CurrencyNormalizer.normalizeMRP('MRP ₹ 249.50');
    expect(res.amount).toBe(249.5);
    expect(res.isTaxInclusive).toBe(false);
  });

  it('handles ambiguous letter O instead of digit 0 in price', () => {
    const res = CurrencyNormalizer.normalizeMRP('MRP Rs. 15O/- (INCL. OF ALL TAXES)');
    expect(res.amount).toBe(150);
    expect(res.isAmbiguous).toBe(true);
    expect(res.isTaxInclusive).toBe(true);
  });
});

describe('QuantityNormalizer', () => {
  it('accepts standard metric unit "g" and normalizes', () => {
    const res = QuantityNormalizer.normalizeQuantity('Net Weight: 500 g');
    expect(res).not.toBeNull();
    expect(res?.value).toBe(500);
    expect(res?.unit).toBe('g');
    expect(res?.isValidUnit).toBe(true);
  });

  it('accepts standard metric unit "kg"', () => {
    const res = QuantityNormalizer.normalizeQuantity('Net Qty: 1.5 kg');
    expect(res).not.toBeNull();
    expect(res?.value).toBe(1.5);
    expect(res?.unit).toBe('kg');
    expect(res?.isValidUnit).toBe(true);
  });

  it('accepts standard metric units "ml" and "l"', () => {
    const res1 = QuantityNormalizer.normalizeQuantity('750 ml');
    expect(res1?.isValidUnit).toBe(true);

    const res2 = QuantityNormalizer.normalizeQuantity('Net Volume: 1 L');
    expect(res2?.isValidUnit).toBe(true);
  });

  it('rejects prohibited non-standard unit "gms" under LMPC Rule 7 & Schedule II', () => {
    const res = QuantityNormalizer.normalizeQuantity('Net Wt. 200 gms');
    expect(res).not.toBeNull();
    expect(res?.value).toBe(200);
    expect(res?.rawUnit).toBe('gms');
    expect(res?.isValidUnit).toBe(false);
    expect(res?.normalizedUnit).toBe('g');
  });

  it('rejects prohibited unit "kilos" and "ltrs"', () => {
    const res1 = QuantityNormalizer.normalizeQuantity('2 kilos');
    expect(res1?.isValidUnit).toBe(false);

    const res2 = QuantityNormalizer.normalizeQuantity('5 ltrs');
    expect(res2?.isValidUnit).toBe(false);
  });
});

describe('DateNormalizer', () => {
  it('parses numeric MM/YYYY packing date', () => {
    const res = DateNormalizer.normalizeDate('03/2026');
    expect(res).not.toBeNull();
    expect(res?.month).toBe(3);
    expect(res?.year).toBe(2026);
    expect(res?.isoString).toBe('2026-03');
    expect(res?.isAmbiguous).toBe(false);
  });

  it('parses textual month and year', () => {
    const res = DateNormalizer.normalizeDate('FEB 2026');
    expect(res).not.toBeNull();
    expect(res?.month).toBe(2);
    expect(res?.year).toBe(2026);
    expect(res?.isoString).toBe('2026-02');
  });

  it('flags ambiguous date when both day and month are <= 12', () => {
    const res = DateNormalizer.normalizeDate('05/06/2026');
    expect(res).not.toBeNull();
    expect(res?.isAmbiguous).toBe(true);
  });
});

describe('ContactNormalizer', () => {
  it('extracts toll-free phone, email, and postal address', () => {
    const raw =
      'Customer Grievance Cell: Manager at Plot 42 Industrial Area, Karnal. Toll Free: 1800-180-1234, Email: care@agrifoods.in';
    const res = ContactNormalizer.extractConsumerCare(raw);
    expect(res).not.toBeNull();
    expect(res?.phone).toContain('1800-180-1234');
    expect(res?.email).toBe('care@agrifoods.in');
  });
});

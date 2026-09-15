import { describe, it, expect, beforeEach } from 'vitest';
import sharp from 'sharp';
import { CompliScanPipeline } from '@/lib/pipeline/pipeline.service';
import { MemoryScanRepository } from '@/lib/repository/memory-scan.repository';
import { LocalStorageProvider } from '@/lib/storage/local-storage.provider';
import { MockOCRProvider } from '@/lib/ocr/mock-ocr.provider';
import { ExtractionService } from '@/lib/extraction/extraction.service';
import { MockAIExtractionProvider } from '@/lib/extraction/mock-ai.extractor';
import { OfflineSyncService } from '@/lib/offline/sync.service';

describe('Synthetic Test Scenarios (Section 36 Compliance)', () => {
  let pipeline: CompliScanPipeline;
  let repository: MemoryScanRepository;

  // Helper to generate a valid test image buffer
  async function createTestImage(tag: string): Promise<Buffer> {
    const svg = `<svg width="600" height="600"><text x="20" y="40">${tag}</text></svg>`;
    return sharp(Buffer.from(svg)).png().toBuffer();
  }

  beforeEach(() => {
    repository = new MemoryScanRepository();
    const storage = new LocalStorageProvider();
    const ocr = new MockOCRProvider();
    const extractionService = new ExtractionService(new MockAIExtractionProvider());
    pipeline = new CompliScanPipeline(repository, storage, ocr, extractionService);
  });

  it('Scenario 1: Fully compliant commodity achieves COMPLIANT_WITH_WARNINGS or COMPLIANT', async () => {
    const img = await createTestImage('COMPLIANT_COMMODITY');
    const { scan, report } = await pipeline.processScan(img, 'compliant.png', 'image/png');

    expect(scan.status).toBe('COMPLETED');
    expect(['COMPLIANT', 'COMPLIANT_WITH_WARNINGS']).toContain(report.overallStatus);
    expect(report.findings.violations.length).toBe(0);
    expect(report.findings.passed.length).toBeGreaterThanOrEqual(6);
  });

  it('Scenario 2: Label missing MRP results in NON_COMPLIANT with ERR_MISSING_MRP', async () => {
    const img = await createTestImage('MISSING_MRP');
    const { report } = await pipeline.processScan(img, 'no_mrp.png', 'image/png', {
      scenarioId: 'MISSING_MRP',
    });

    expect(report.overallStatus).toBe('NON_COMPLIANT');
    const mrpViolation = report.findings.violations.find((v) => v.ruleId === 'LMPC-R06-MRP-01');
    expect(mrpViolation).toBeDefined();
    expect(mrpViolation?.status).toBe('FAIL');
  });

  it('Scenario 3: Label missing net quantity results in NON_COMPLIANT with ERR_MISSING_NET_QTY', async () => {
    const img = await createTestImage('MISSING_NET_QUANTITY');
    const { report } = await pipeline.processScan(img, 'no_qty.png', 'image/png', {
      scenarioId: 'MISSING_NET_QUANTITY',
    });

    expect(report.overallStatus).toBe('NON_COMPLIANT');
    const qtyViolation = report.findings.violations.find((v) => v.ruleId === 'LMPC-R06-QTY-01');
    expect(qtyViolation).toBeDefined();
  });

  it('Scenario 4: Label missing manufacturer results in NON_COMPLIANT with ERR_MISSING_MANUFACTURER', async () => {
    const img = await createTestImage('MISSING_MANUFACTURER');
    const { report } = await pipeline.processScan(img, 'no_mfg.png', 'image/png', {
      scenarioId: 'MISSING_MANUFACTURER',
    });

    expect(report.overallStatus).toBe('NON_COMPLIANT');
    const mfgViolation = report.findings.violations.find((v) => v.ruleId === 'LMPC-R06-MFG-01');
    expect(mfgViolation).toBeDefined();
  });

  it('Scenario 5: Label missing country of origin results in NON_COMPLIANT with ERR_MISSING_COUNTRY_OF_ORIGIN', async () => {
    const img = await createTestImage('MISSING_COUNTRY_OF_ORIGIN');
    const { report } = await pipeline.processScan(img, 'no_coo.png', 'image/png', {
      scenarioId: 'MISSING_COUNTRY_OF_ORIGIN',
    });

    expect(report.overallStatus).toBe('NON_COMPLIANT');
    const cooViolation = report.findings.violations.find((v) => v.ruleId === 'LMPC-R06-COO-01');
    expect(cooViolation).toBeDefined();
  });

  it('Scenario 6: Label missing consumer care results in NON_COMPLIANT with ERR_MISSING_CONSUMER_CARE', async () => {
    const img = await createTestImage('MISSING_CONSUMER_CARE');
    const { report } = await pipeline.processScan(img, 'no_care.png', 'image/png', {
      scenarioId: 'MISSING_CONSUMER_CARE',
    });

    expect(report.overallStatus).toBe('NON_COMPLIANT');
    const ccViolation = report.findings.violations.find((v) => v.ruleId === 'LMPC-R06-CC-01');
    expect(ccViolation).toBeDefined();
  });

  it('Scenario 7: Prohibited unit symbol "gms" triggers legal violation under LMPC Rule 7', async () => {
    const img = await createTestImage('INVALID_UNIT_SYMBOL');
    const { report } = await pipeline.processScan(img, 'invalid_unit.png', 'image/png', {
      scenarioId: 'INVALID_UNIT_SYMBOL',
    });

    expect(report.overallStatus).toBe('NON_COMPLIANT');
    const unitViolation = report.findings.violations.find((v) => v.ruleId === 'LMPC-R07-UNIT-01');
    expect(unitViolation).toBeDefined();
    expect(unitViolation?.extractedValue).toBe('gms');
  });

  it('Scenario 8: Poor OCR / low image confidence yields NEEDS_REVIEW rather than false NON_COMPLIANT', async () => {
    const img = await createTestImage('POOR_OCR_CORRUPTED');
    const { report } = await pipeline.processScan(img, 'poor_ocr.png', 'image/png', {
      scenarioId: 'POOR_OCR_CORRUPTED',
    });

    // System must distinguish UNVERIFIABLE from FAIL on bad OCR
    expect(report.findings.unverifiable.length).toBeGreaterThan(0);
    expect(report.overallStatus).toBe('NEEDS_REVIEW');
  });

  it('Scenario 9: Ambiguous date triggers advisory warning with explanation', async () => {
    const img = await createTestImage('AMBIGUOUS_DECLARATION');
    const { report } = await pipeline.processScan(img, 'ambiguous.png', 'image/png', {
      scenarioId: 'AMBIGUOUS_DECLARATION',
    });

    const dateWarning = report.findings.warnings.find((w) => w.ruleId === 'LMPC-R06-DATE-01');
    expect(dateWarning).toBeDefined();
    expect(dateWarning?.message).toContain('ambiguous');
  });

  it('Scenario 10: Category-specific food declaration evaluates expiry date', async () => {
    const img = await createTestImage('FOOD_PRODUCT_WITH_EXPIRY');
    const { report } = await pipeline.processScan(img, 'milk.png', 'image/png', {
      category: 'FOOD_PRODUCT',
      scenarioId: 'FOOD_PRODUCT_WITH_EXPIRY',
    });

    const expCheck = report.findings.passed.find((p) => p.ruleId === 'LMPC-R06-EXP-01');
    expect(expCheck).toBeDefined();
    expect(expCheck?.status).toBe('PASS');
  });

  it('Scenario 11: Offline synchronization processes offline inspection batches and handles conflicts', async () => {
    const syncService = new OfflineSyncService(repository);
    const mockBatch = {
      deviceId: 'INSPECTOR-TAB-09',
      clientTimestamp: new Date().toISOString(),
      items: [
        {
          offlineClientId: '8b7f8e87-63a2-4a0e-9b2f-912837461234',
          capturedAt: new Date().toISOString(),
          category: 'GENERIC_PACKAGED_COMMODITY',
          localRulesetVersion: 'LMPC-2011.v2024', // Outdated client ruleset!
          extractedDeclarations: {
            productName: { value: 'Basmati Rice', confidence: 0.95, extractionMethod: 'deterministic' as const },
            genericName: { value: 'Rice', confidence: 0.95, extractionMethod: 'deterministic' as const },
            manufacturer: { value: { name: 'Agro Ltd' }, confidence: 0.95, extractionMethod: 'deterministic' as const },
            packer: { value: null, confidence: 0, extractionMethod: 'deterministic' as const },
            importer: { value: null, confidence: 0, extractionMethod: 'deterministic' as const },
            netQuantity: { value: { value: 1, unit: 'kg', rawUnit: 'kg', isValidUnit: true }, confidence: 0.95, extractionMethod: 'deterministic' as const },
            mrp: { value: { amount: 120, currency: 'INR', isTaxInclusive: true }, confidence: 0.95, extractionMethod: 'deterministic' as const },
            unitSalePrice: { value: { amount: 120, perUnit: 'kg', currency: 'INR' }, confidence: 0.9, extractionMethod: 'deterministic' as const },
            countryOfOrigin: { value: 'India', confidence: 0.95, extractionMethod: 'deterministic' as const },
            manufactureDate: { value: { month: 1, year: 2026, rawText: '01/2026', isAmbiguous: false }, confidence: 0.95, extractionMethod: 'deterministic' as const },
            packingDate: { value: null, confidence: 0, extractionMethod: 'deterministic' as const },
            bestBefore: { value: '12 months', confidence: 0.9, extractionMethod: 'deterministic' as const },
            expiryDate: { value: null, confidence: 0, extractionMethod: 'deterministic' as const },
            consumerCare: { value: { phone: '1800-111-222', email: 'care@agro.in' }, confidence: 0.95, extractionMethod: 'deterministic' as const },
            batchNumber: { value: 'B-1', confidence: 0.95, extractionMethod: 'deterministic' as const },
            rawFields: {},
            overallConfidence: 0.95,
            extractionMethod: 'deterministic' as const,
          },
          imageHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        },
      ],
    };

    const res = await syncService.processSyncBatch(mockBatch);
    expect(res.success).toBe(true);
    expect(res.results[0].syncStatus).toBe('CONFLICT_RULES_UPDATED');
    expect(res.results[0].serverScanId).toBeDefined();

    // Verify stored scan can be retrieved
    const saved = await repository.getScanById(res.results[0].serverScanId);
    expect(saved).not.toBeNull();
    expect(saved?.rulesetVersion).toBe('LMPC-2011.v2026');
  });

  it('Scenario 12: Hindi multilingual report generation translates explanations and legal remedies', async () => {
    const img = await createTestImage('INVALID_UNIT_SYMBOL');
    const { report } = await pipeline.processScan(img, 'hindi_test.png', 'image/png', {
      scenarioId: 'INVALID_UNIT_SYMBOL',
      locale: 'hi',
    });

    expect(report.locale).toBe('hi');
    const unitViolation = report.findings.violations.find((v) => v.ruleId === 'LMPC-R07-UNIT-01');
    expect(unitViolation).toBeDefined();
    // Verify Hindi translation is applied
    expect(unitViolation?.localizedExplanation).toContain('मानक मीट्रिक प्रतीकों');
  });
});

import { describe, it, expect } from 'vitest';
import { validateCorners } from '@/lib/measurement/corner-validation';
import { computeHomography, applyHomographyToPoint, computeReprojectionError } from '@/lib/measurement/perspective';
import { estimateMeasurementUncertainty, determineTechnicalQualityGrade } from '@/lib/measurement/uncertainty';
import { undistortPoints } from '@/lib/measurement/lens-distortion';
import { Rule09PDPProminence, Rule10NumeralHeightInfo } from '@/lib/compliance/rules/lmpc-2011-rules';
import { Quadrilateral, ReferenceConfig, LensDistortionParams, MeasurementMetadata } from '@/lib/measurement/measurement.types';
import { ProductDeclaration } from '@/lib/types/extraction';

function createMockProduct(): ProductDeclaration {
  return {
    productName: { value: 'Test Product', confidence: 0.95, extractionMethod: 'deterministic' },
    genericName: { value: 'Commodity', confidence: 0.95, extractionMethod: 'deterministic' },
    manufacturer: { value: { name: 'ABC Foods', address: 'Delhi' }, confidence: 0.95, extractionMethod: 'deterministic' },
    packer: { value: null, confidence: 0, extractionMethod: 'deterministic' },
    importer: { value: null, confidence: 0, extractionMethod: 'deterministic' },
    netQuantity: { value: { value: 500, unit: 'g', rawUnit: 'g', isValidUnit: true }, confidence: 0.95, extractionMethod: 'deterministic' },
    mrp: { value: { amount: 80, currency: 'INR', isTaxInclusive: true }, confidence: 0.95, extractionMethod: 'deterministic' },
    unitSalePrice: { value: { amount: 0.16, perUnit: 'g', currency: 'INR' }, confidence: 0.95, extractionMethod: 'deterministic' },
    countryOfOrigin: { value: 'India', confidence: 0.95, extractionMethod: 'deterministic' },
    manufactureDate: { value: { month: 1, year: 2026, rawText: '01/2026', isAmbiguous: false }, confidence: 0.95, extractionMethod: 'deterministic' },
    packingDate: { value: null, confidence: 0, extractionMethod: 'deterministic' },
    bestBefore: { value: '6 months', confidence: 0.9, extractionMethod: 'deterministic' },
    expiryDate: { value: null, confidence: 0, extractionMethod: 'deterministic' },
    consumerCare: { value: { phone: '1800000000' }, confidence: 0.95, extractionMethod: 'deterministic' },
    batchNumber: { value: 'BATCH1', confidence: 0.95, extractionMethod: 'deterministic' },
    rawFields: {},
    overallConfidence: 0.95,
    extractionMethod: 'deterministic',
  };
}

describe('Corner Placement Validation', () => {
  const refConfig: ReferenceConfig = { widthMm: 85.6, heightMm: 53.98, label: 'Credit Card' };

  it('accepts a valid convex quadrilateral in clockwise order', () => {
    const corners: Quadrilateral = {
      topLeft: { x: 100, y: 100 },
      topRight: { x: 400, y: 100 },
      bottomRight: { x: 400, y: 300 },
      bottomLeft: { x: 100, y: 300 },
    };

    const res = validateCorners(corners, 800, 600, refConfig);
    expect(res.valid).toBe(true);
    expect(res.errors.length).toBe(0);
    expect(res.correctedCorners).toBeDefined();
  });

  it('rejects a self-intersecting bowtie quadrilateral', () => {
    // Cross edges: TL -> BR, TR -> BL
    const corners: Quadrilateral = {
      topLeft: { x: 100, y: 100 },
      topRight: { x: 400, y: 300 },
      bottomRight: { x: 100, y: 300 },
      bottomLeft: { x: 400, y: 100 },
    };

    const res = validateCorners(corners, 800, 600, refConfig);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.code === 'REFERENCE_CORNERS_INVALID')).toBe(true);
  });

  it('rejects a concave polygon', () => {
    // Inward dent on one corner
    const corners: Quadrilateral = {
      topLeft: { x: 100, y: 100 },
      topRight: { x: 400, y: 100 },
      bottomRight: { x: 200, y: 150 }, // dent inside the triangle (100,100)-(400,100)-(100,300)
      bottomLeft: { x: 100, y: 300 },
    };

    const res = validateCorners(corners, 800, 600, refConfig);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.code === 'REFERENCE_NOT_CONVEX')).toBe(true);
  });

  it('rejects an impossibly tiny reference selection', () => {
    const tinyCorners: Quadrilateral = {
      topLeft: { x: 100, y: 100 },
      topRight: { x: 105, y: 100 },
      bottomRight: { x: 105, y: 105 },
      bottomLeft: { x: 100, y: 105 },
    };

    const res = validateCorners(tinyCorners, 1920, 1080, refConfig);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.code === 'REFERENCE_TOO_SMALL')).toBe(true);
  });
});

describe('Homography & Perspective Transformation', () => {
  it('computes projective homography and transforms points accurately', () => {
    const src: [any, any, any, any] = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    // Scale by 2x and shift by (10, 20)
    const dst: [any, any, any, any] = [
      { x: 10, y: 20 },
      { x: 210, y: 20 },
      { x: 210, y: 220 },
      { x: 10, y: 220 },
    ];

    const H = computeHomography(src, dst);
    expect(H).not.toBeNull();

    if (H) {
      const pTrans = applyHomographyToPoint({ x: 50, y: 50 }, H);
      // Center (50, 50) scaled by 2x is (100, 100), shifted by (10, 20) is (110, 120)
      expect(pTrans.x).toBeCloseTo(110, 1);
      expect(pTrans.y).toBeCloseTo(120, 1);

      const reproj = computeReprojectionError(src, dst, H);
      expect(reproj).toBeLessThan(0.01);
    }
  });
});

describe('Lens Distortion Correction', () => {
  it('shifts off-center points outward or inward according to Brown-Conrady coefficients', () => {
    const params: LensDistortionParams = {
      k1: -0.1, // barrel distortion correction
      k2: 0,
      cx: 0.5,
      cy: 0.5,
    };
    const pts = [
      { x: 100, y: 100 },
      { x: 500, y: 500 }, // image center for 1000x1000
    ];

    const undistorted = undistortPoints(pts, params, 1000, 1000);
    expect(undistorted.length).toBe(2);
    // Center point should not shift
    expect(undistorted[1].x).toBeCloseTo(500, 1);
    expect(undistorted[1].y).toBeCloseTo(500, 1);
  });
});

describe('Measurement Uncertainty & Quality Grading', () => {
  it('estimates error bounds combining resolution, homography and boundary confidence', () => {
    const meas = estimateMeasurementUncertainty(
      50.0, // 50 mm measured
      250,  // 250 px
      0.2,  // 0.2 mm/px scale factor
      0.5,  // 0.5 px homography reprojection error
      'contour',
      0.95
    );

    expect(meas.valueMm).toBe(50.0);
    expect(meas.estimatedErrorMm).toBeGreaterThan(0);
    expect(meas.estimatedErrorMm).toBeLessThan(5.0); // realistic sub-millimeter / low millimeter uncertainty
    expect(meas.confidenceScore).toBeGreaterThan(0.8);
  });

  it('determines technical quality grade correctly', () => {
    const gradeHigh = determineTechnicalQualityGrade(0.8, 0.95, 'contour', 10);
    expect(gradeHigh).toBe('HIGH');

    const gradeLow = determineTechnicalQualityGrade(4.5, 0.55, 'bounding_box', 25);
    expect(['ACCEPTABLE', 'LOW']).toContain(gradeLow);

    const gradeUnreliable = determineTechnicalQualityGrade(12.0, 0.3, 'bounding_box', 50);
    expect(gradeUnreliable).toBe('UNRELIABLE');
  });
});

describe('Compliance Rules with Calibrated Measurement Data', () => {
  const rule09 = new Rule09PDPProminence();
  const rule10 = new Rule10NumeralHeightInfo();
  const mockProduct = createMockProduct();

  it('returns UNVERIFIABLE for Rule09 when no measurementData is present (uncalibrated baseline)', () => {
    const res = rule09.evaluate({
      product: mockProduct,
      category: 'GENERIC_PACKAGED_COMMODITY',
      rulesetVersion: '2026.01',
    });

    expect(res.status).toBe('UNVERIFIABLE');
    expect(res.humanVerificationRequired).toBe(true);
  });

  it('returns UNVERIFIABLE when measurementData has UNRELIABLE qualityGrade', () => {
    const unMeas: MeasurementMetadata = {
      pdpBoundingWidthMm: 80,
      pdpBoundingHeightMm: 60,
      qualityGrade: 'UNRELIABLE',
      boundaryType: 'bounding_box',
      coplanarityAssumed: true,
      disclaimer: 'test disclaimer',
    };

    const res = rule09.evaluate({
      product: mockProduct,
      category: 'GENERIC_PACKAGED_COMMODITY',
      rulesetVersion: '2026.01',
      measurementData: unMeas,
    });

    expect(res.status).toBe('UNVERIFIABLE');
    expect(res.errorCode).toBe('MEASUREMENT_QUALITY_UNRELIABLE');
  });

  it('returns WARNING with PDP area and required numeral height when measurementData is ACCEPTABLE/HIGH', () => {
    // 80mm x 50mm = 4000 mm² = 40 cm² (<= 50 cm² -> min numeral 1.0mm)
    const measData: MeasurementMetadata = {
      pdpBoundingWidthMm: 80,
      pdpBoundingHeightMm: 50,
      pdpBoundingAreaMm2: 4000,
      widthErrorMm: 1.2,
      heightErrorMm: 1.0,
      qualityGrade: 'HIGH',
      boundaryType: 'contour',
      coplanarityAssumed: true,
      disclaimer: 'test disclaimer',
    };

    const res09 = rule09.evaluate({
      product: mockProduct,
      category: 'GENERIC_PACKAGED_COMMODITY',
      rulesetVersion: '2026.01',
      measurementData: measData,
    });

    expect(res09.status).toBe('WARNING');
    expect(res09.message).toContain('40.0 cm²');
    expect(res09.message).toContain('1 mm');
    expect(res09.humanVerificationRequired).toBe(true);

    const res10 = rule10.evaluate({
      product: mockProduct,
      category: 'GENERIC_PACKAGED_COMMODITY',
      rulesetVersion: '2026.01',
      measurementData: measData,
    });

    expect(res10.status).toBe('UNVERIFIABLE');
    expect(res10.message).toContain('1 mm');
    expect(res10.humanVerificationRequired).toBe(true);
  });
});

describe('AI Text Size & Numeral Height Inspection Pipeline', () => {
  const rule09 = new Rule09PDPProminence();
  const rule10 = new Rule10NumeralHeightInfo();
  const mockProduct = createMockProduct();

  it('determines statutory minimum numeral height correctly across all Schedule I area brackets', async () => {
    const { getStatutoryMinNumeralHeight } = await import('@/lib/compliance/text-size/text-size.types');
    expect(getStatutoryMinNumeralHeight(40)).toBe(1.0);  // <= 50 cm²
    expect(getStatutoryMinNumeralHeight(50)).toBe(1.0);  // <= 50 cm²
    expect(getStatutoryMinNumeralHeight(75)).toBe(1.5);  // 50 < A <= 100 cm²
    expect(getStatutoryMinNumeralHeight(250)).toBe(2.0); // 100 < A <= 500 cm²
    expect(getStatutoryMinNumeralHeight(1000)).toBe(4.0);// 500 < A <= 2500 cm²
    expect(getStatutoryMinNumeralHeight(3000)).toBe(6.0);// > 2500 cm²

    // Blown / moulded on container
    expect(getStatutoryMinNumeralHeight(40, true)).toBe(1.5);
    expect(getStatutoryMinNumeralHeight(75, true)).toBe(2.0);
    expect(getStatutoryMinNumeralHeight(250, true)).toBe(4.0);
    expect(getStatutoryMinNumeralHeight(1000, true)).toBe(6.0);
  });

  it('evaluates text sizes and returns PASS when numeral height meets or exceeds statutory limit', async () => {
    const { AITextSizeInspectionService } = await import('@/lib/compliance/text-size/text-size-inspection.service');
    const service = new AITextSizeInspectionService();

    // PDP area 80 cm² -> min required numeral height is 1.5 mm
    const measData: MeasurementMetadata = {
      pdpBoundingWidthMm: 100,
      pdpBoundingHeightMm: 80,
      pdpBoundingAreaMm2: 8000, // 80 cm²
      qualityGrade: 'HIGH',
      boundaryType: 'bounding_box',
      coplanarityAssumed: true,
      disclaimer: 'test',
    };

    const inspection = await service.inspectTextSize({
      product: mockProduct,
      measurementData: measData,
    });

    expect(inspection.pdpAreaCm2).toBe(80);
    expect(inspection.minRequiredHeightMm).toBe(1.5);
    expect(inspection.items.length).toBeGreaterThan(0);

    // Evaluate in Rule10 with compliant inspection result
    const passInspection = {
      ...inspection,
      overallCompliance: 'PASS' as const,
      items: [
        {
          field: 'netQuantity' as const,
          label: 'Net Quantity Numeral',
          printedText: '500 g',
          measuredHeightMm: 2.2, // 2.2mm > 1.5mm
          minRequiredHeightMm: 1.5,
          meetsLimit: true,
          aspectRatio: 1.6,
          aspectRatioValid: true,
          contrastAdequate: true,
          remarks: 'Compliant',
        },
      ],
    };

    const res10 = rule10.evaluate({
      product: mockProduct,
      category: 'GENERIC_PACKAGED_COMMODITY',
      rulesetVersion: '2026.01',
      textSizeResult: passInspection,
    });

    expect(res10.status).toBe('PASS');
    expect(res10.message).toContain('COMPLIES');
    expect(res10.message).toContain('2.2 mm');
    expect(res10.humanVerificationRequired).toBe(false);

    const res09 = rule09.evaluate({
      product: mockProduct,
      category: 'GENERIC_PACKAGED_COMMODITY',
      rulesetVersion: '2026.01',
      textSizeResult: passInspection,
    });

    expect(res09.status).toBe('PASS');
  });

  it('evaluates text sizes and returns FAIL (violation) when numeral height is below statutory limit', async () => {
    // PDP area 200 cm² -> min required numeral height is 2.0 mm
    // Numeral height printed is only 1.2 mm -> VIOLATION
    const failInspection = {
      pdpAreaCm2: 200,
      minRequiredHeightMm: 2.0,
      isBlownOrMoulded: false,
      overallCompliance: 'FAIL' as const,
      method: 'ai_multimodal' as const,
      confidence: 0.92,
      summaryExplanation: 'Numeral height 1.2mm is below required 2.0mm',
      legalReference: 'LMPC Schedule I',
      items: [
        {
          field: 'netQuantity' as const,
          label: 'Net Quantity Numeral',
          printedText: '1 kg',
          measuredHeightMm: 1.2, // DEFICIENT: 1.2 mm < 2.0 mm required
          minRequiredHeightMm: 2.0,
          meetsLimit: false,
          aspectRatio: 1.5,
          aspectRatioValid: true,
          contrastAdequate: true,
          remarks: 'Numeral height 1.2mm is deficient.',
        },
      ],
    };

    const res10 = rule10.evaluate({
      product: mockProduct,
      category: 'GENERIC_PACKAGED_COMMODITY',
      rulesetVersion: '2026.01',
      textSizeResult: failInspection,
    });

    expect(res10.status).toBe('FAIL');
    expect(res10.severity).toBe('ERROR');
    expect(res10.message).toContain('DEFICIENT');
    expect(res10.message).toContain('1.2 mm');
    expect(res10.errorCode).toBe('ERR_DEFICIENT_NUMERAL_HEIGHT');
    expect(res10.humanVerificationRequired).toBe(false);
  });
});

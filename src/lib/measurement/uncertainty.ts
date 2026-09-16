/**
 * CompliScan — Measurement Uncertainty Estimation
 *
 * Computes ± error bounds for each measurement by combining
 * multiple error sources via root-sum-of-squares (RSS).
 *
 * Every measurement is reported as: value ± estimatedError mm
 */

import type { MeasurementValue, BoundaryType } from './measurement.types';

// ---------------------------------------------------------------------------
// Error Source Definitions
// ---------------------------------------------------------------------------

/**
 * Pixel quantization error contribution.
 * Any pixel measurement has an inherent ±0.5 pixel uncertainty.
 */
function pixelQuantizationErrorMm(scaleMmPerPx: number): number {
  return 0.5 * scaleMmPerPx;
}

/**
 * Homography residual error contribution.
 * The reprojection error (in pixels) translates directly to measurement error.
 */
function homographyResidualErrorMm(
  reprojectionErrorPx: number,
  scaleMmPerPx: number
): number {
  return reprojectionErrorPx * scaleMmPerPx;
}

/**
 * Detection boundary uncertainty.
 * Bounding boxes have higher uncertainty than contours because the
 * object may not fill the bounding box entirely.
 */
function boundaryUncertaintyPx(boundaryType: BoundaryType): number {
  switch (boundaryType) {
    case 'bounding_box':
      return 3.0; // ±3px — object may not fill box
    case 'contour':
      return 1.5; // ±1.5px — edge detection precision
    case 'user_adjusted':
      return 1.0; // ±1px — human precision with draggable handles
  }
}

/**
 * Scale calibration uncertainty.
 * The reference dimensions provided by the user may have some error,
 * and the scale factor depends on reference detection quality.
 */
function scaleCalibrationFraction(): number {
  // Assume the user's declared reference dimensions have ~1% uncertainty
  return 0.01;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compute a MeasurementValue with uncertainty for a single measurement.
 *
 * Error sources are combined via RSS (root-sum-of-squares) assuming
 * they are independent:
 *   total_error = sqrt(e1² + e2² + e3² + e4²)
 *
 * @param valueMm - The raw measured value in millimeters
 * @param pixelCount - Number of pixels corresponding to this measurement
 * @param scaleMmPerPx - Calibration scale (mm per pixel)
 * @param reprojectionErrorPx - Homography reprojection error (pixels)
 * @param boundaryType - How the object boundary was determined
 * @param detectionConfidence - Detection confidence (0-1)
 */
export function estimateMeasurementUncertainty(
  valueMm: number,
  pixelCount: number,
  scaleMmPerPx: number,
  reprojectionErrorPx: number,
  boundaryType: BoundaryType,
  detectionConfidence: number
): MeasurementValue {
  // 1. Pixel quantization (always present)
  const e1 = pixelQuantizationErrorMm(scaleMmPerPx);

  // 2. Homography residual
  const e2 = homographyResidualErrorMm(reprojectionErrorPx, scaleMmPerPx);

  // 3. Boundary uncertainty
  const e3 = boundaryUncertaintyPx(boundaryType) * scaleMmPerPx;

  // 4. Scale calibration uncertainty
  const e4 = valueMm * scaleCalibrationFraction();

  // Combine via RSS
  const totalError = Math.sqrt(e1 * e1 + e2 * e2 + e3 * e3 + e4 * e4);

  // Confidence: combination of detection confidence and calibration quality
  // Detection confidence directly affects how much we trust the measurement
  const calibrationQuality = Math.max(0, 1 - reprojectionErrorPx / 10);
  const confidenceScore = Math.min(1, detectionConfidence * 0.7 + calibrationQuality * 0.3);

  return {
    valueMm: round2(valueMm),
    estimatedErrorMm: round2(Math.max(totalError, 0.1)), // minimum 0.1mm error
    confidenceScore: round2(confidenceScore),
  };
}

/**
 * Determine the technical quality grade based on measurement parameters.
 *
 * These grades indicate how reliable the CV measurement is technically.
 * They are NOT compliance determinations — a 'HIGH' grade doesn't mean
 * the measurement is legally usable, and a 'LOW' grade doesn't mean
 * the product is non-compliant.
 */
export function determineTechnicalQualityGrade(
  reprojectionErrorPx: number,
  detectionConfidence: number,
  boundaryType: BoundaryType,
  estimatedAngleDeg: number
): 'HIGH' | 'ACCEPTABLE' | 'LOW' | 'UNRELIABLE' {
  // Strict technical thresholds — independent of compliance significance
  if (
    reprojectionErrorPx < 2 &&
    detectionConfidence > 0.85 &&
    boundaryType !== 'bounding_box' &&
    estimatedAngleDeg < 15
  ) {
    return 'HIGH';
  }

  if (
    reprojectionErrorPx < 5 &&
    detectionConfidence > 0.6 &&
    estimatedAngleDeg < 30
  ) {
    return 'ACCEPTABLE';
  }

  if (
    reprojectionErrorPx < 10 &&
    detectionConfidence > 0.4 &&
    estimatedAngleDeg < 45
  ) {
    return 'LOW';
  }

  return 'UNRELIABLE';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * CompliScan — Measurement Engine (Orchestrator)
 *
 * Main entry point for the browser-based CV measurement pipeline.
 * Orchestrates: quality check → corner validation → lens correction →
 * homography → perspective warp → object detection → measurement →
 * uncertainty estimation → annotation.
 *
 * All processing happens client-side in the browser.
 */

import type {
  Quadrilateral,
  ReferenceConfig,
  LensDistortionParams,
  MeasurementResult,
  MeasurementError,
  MeasurementStage,
  MeasurementQuality,
  BBox,
  Point2D,
} from './measurement.types';
import { MEASUREMENT_DISCLAIMER, COPLANARITY_NOTICE } from './measurement.types';
import { assessImageQuality } from './image-quality';
import { validateCorners } from './corner-validation';
import { undistortPoints } from './lens-distortion';
import { computeHomography, warpPerspective, computeReprojectionError } from './perspective';
import { ObjectDetectorRegistry, createDefaultDetectorRegistry } from './detector';
import { estimateMeasurementUncertainty, determineTechnicalQualityGrade } from './uncertainty';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface MeasureOptions {
  /** Optional lens distortion coefficients */
  lensDistortion?: LensDistortionParams;
  /**
   * User-adjusted object boundary (overrides auto-detection).
   * Coordinates are in the RECTIFIED image space.
   */
  manualObjectBoundary?: BBox;
}

export type StageCallback = (stage: MeasurementStage) => void;

export class MeasurementEngine {
  private detectorRegistry: ObjectDetectorRegistry | null = null;

  constructor(
    private onStage?: StageCallback
  ) {}

  /**
   * Run the complete measurement pipeline.
   *
   * @param imageElement - Source image (HTMLImageElement or HTMLCanvasElement)
   * @param referenceCorners - User-selected 4 corners of the reference area
   * @param referenceConfig - Known physical dimensions of the reference
   * @param options - Optional lens correction and manual boundary override
   * @returns MeasurementResult on success, MeasurementError on failure
   */
  async measure(
    imageElement: HTMLImageElement | HTMLCanvasElement,
    referenceCorners: Quadrilateral,
    referenceConfig: ReferenceConfig,
    options?: MeasureOptions
  ): Promise<MeasurementResult | MeasurementError> {
    try {
      // --- Step 1: Validate image quality ---
      this.emitStage('validating_image');
      const quality = assessImageQuality(imageElement);
      if (!quality.acceptable) {
        this.emitStage('failed');
        return quality.errors[0]; // Return first error
      }

      // --- Step 2: Validate corners ---
      this.emitStage('validating_corners');
      const imgW = 'naturalWidth' in imageElement
        ? (imageElement as HTMLImageElement).naturalWidth
        : imageElement.width;
      const imgH = 'naturalHeight' in imageElement
        ? (imageElement as HTMLImageElement).naturalHeight
        : imageElement.height;

      const cornerResult = validateCorners(referenceCorners, imgW, imgH, referenceConfig);
      if (!cornerResult.valid) {
        this.emitStage('failed');
        return cornerResult.errors[0];
      }

      const corners = cornerResult.correctedCorners;

      // --- Step 3: Get image data ---
      const canvas = document.createElement('canvas');
      canvas.width = imgW;
      canvas.height = imgH;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        this.emitStage('failed');
        return {
          code: 'CALIBRATION_FAILED',
          message: 'Could not create canvas context.',
          suggestion: 'Try a different browser.',
        };
      }
      ctx.drawImage(imageElement, 0, 0, imgW, imgH);
      const sourceImageData = ctx.getImageData(0, 0, imgW, imgH);

      // --- Step 4: Optional lens distortion correction ---
      let srcPoints: [Point2D, Point2D, Point2D, Point2D] = [
        corners.topLeft,
        corners.topRight,
        corners.bottomRight,
        corners.bottomLeft,
      ];

      let lensDistortionCorrected = false;
      if (options?.lensDistortion) {
        this.emitStage('correcting_lens_distortion');
        const undistorted = undistortPoints(srcPoints, options.lensDistortion, imgW, imgH);
        srcPoints = undistorted as [Point2D, Point2D, Point2D, Point2D];
        lensDistortionCorrected = true;
      }

      // --- Step 5: Compute homography ---
      this.emitStage('computing_homography');

      // Determine output size: maintain resolution proportional to reference
      const refAspect = referenceConfig.widthMm / referenceConfig.heightMm;
      const avgEdgeLength = (
        dist(srcPoints[0], srcPoints[1]) +
        dist(srcPoints[1], srcPoints[2]) +
        dist(srcPoints[2], srcPoints[3]) +
        dist(srcPoints[3], srcPoints[0])
      ) / 4;

      // Use ~2x the average edge length for output resolution
      const outputWidth = Math.round(avgEdgeLength * Math.sqrt(refAspect) * 1.5);
      const outputHeight = Math.round(outputWidth / refAspect);

      const dstPoints: [Point2D, Point2D, Point2D, Point2D] = [
        { x: 0, y: 0 },
        { x: outputWidth - 1, y: 0 },
        { x: outputWidth - 1, y: outputHeight - 1 },
        { x: 0, y: outputHeight - 1 },
      ];

      const H = computeHomography(srcPoints, dstPoints);
      if (!H) {
        this.emitStage('failed');
        return {
          code: 'HOMOGRAPHY_FAILED',
          message: 'Could not compute perspective transformation.',
          suggestion: 'Check that the reference corners are placed correctly.',
        };
      }

      // Compute reprojection error
      const reprojError = computeReprojectionError(srcPoints, dstPoints, H);

      // --- Step 6: Warp perspective ---
      this.emitStage('correcting_perspective');
      const rectifiedImageData = warpPerspective(sourceImageData, H, outputWidth, outputHeight);
      if (!rectifiedImageData) {
        this.emitStage('failed');
        return {
          code: 'HOMOGRAPHY_FAILED',
          message: 'Perspective correction failed.',
          suggestion: 'Try selecting the reference corners more precisely.',
        };
      }

      // --- Step 7: Detect object ---
      this.emitStage('detecting_object');

      let detection;
      if (options?.manualObjectBoundary) {
        // User overrode auto-detection
        detection = {
          boundingBox: options.manualObjectBoundary,
          contourPoints: null,
          boundaryType: 'user_adjusted' as const,
          detectionConfidence: 0.95,
          detectorId: 'manual',
        };
      } else {
        // Auto-detect using the detector registry
        if (!this.detectorRegistry) {
          this.detectorRegistry = await createDefaultDetectorRegistry();
        }

        detection = await this.detectorRegistry.detect(
          rectifiedImageData,
          referenceConfig.widthMm,
          referenceConfig.heightMm
        );

        if (!detection) {
          this.emitStage('failed');
          return {
            code: 'OBJECT_NOT_DETECTED',
            message: 'No object could be detected in the reference area.',
            suggestion: 'Ensure the object is clearly visible within the reference area with good contrast against the background.',
          };
        }
      }

      // Validate object is inside reference
      const bb = detection.boundingBox;
      if (bb.x < 0 || bb.y < 0 || bb.x + bb.width > outputWidth || bb.y + bb.height > outputHeight) {
        // Partially outside — clip and warn
        detection.boundingBox = {
          x: Math.max(0, bb.x),
          y: Math.max(0, bb.y),
          width: Math.min(bb.width, outputWidth - Math.max(0, bb.x)),
          height: Math.min(bb.height, outputHeight - Math.max(0, bb.y)),
        };
      }

      // --- Step 8: Calculate measurements ---
      this.emitStage('calculating_dimensions');

      const scaleXMmPerPx = referenceConfig.widthMm / outputWidth;
      const scaleYMmPerPx = referenceConfig.heightMm / outputHeight;

      // Pixel measurements in rectified space
      const objBB = detection.boundingBox;
      const boundingWidthPx = objBB.width;
      const boundingHeightPx = objBB.height;
      const distTopPx = objBB.y;
      const distBottomPx = outputHeight - (objBB.y + objBB.height);
      const distLeftPx = objBB.x;
      const distRightPx = outputWidth - (objBB.x + objBB.width);

      // Convert to mm
      const boundingWidthMm = boundingWidthPx * scaleXMmPerPx;
      const boundingHeightMm = boundingHeightPx * scaleYMmPerPx;
      const distTopMm = distTopPx * scaleYMmPerPx;
      const distBottomMm = distBottomPx * scaleYMmPerPx;
      const distLeftMm = distLeftPx * scaleXMmPerPx;
      const distRightMm = distRightPx * scaleXMmPerPx;

      // --- Step 9: Estimate uncertainty ---
      this.emitStage('estimating_uncertainty');

      const boundaryType = detection.boundaryType;
      const detConf = detection.detectionConfidence;

      const boundingWidth = estimateMeasurementUncertainty(boundingWidthMm, boundingWidthPx, scaleXMmPerPx, reprojError, boundaryType, detConf);
      const boundingHeight = estimateMeasurementUncertainty(boundingHeightMm, boundingHeightPx, scaleYMmPerPx, reprojError, boundaryType, detConf);
      const distanceTop = estimateMeasurementUncertainty(distTopMm, distTopPx, scaleYMmPerPx, reprojError, boundaryType, detConf);
      const distanceBottom = estimateMeasurementUncertainty(distBottomMm, distBottomPx, scaleYMmPerPx, reprojError, boundaryType, detConf);
      const distanceLeft = estimateMeasurementUncertainty(distLeftMm, distLeftPx, scaleXMmPerPx, reprojError, boundaryType, detConf);
      const distanceRight = estimateMeasurementUncertainty(distRightMm, distRightPx, scaleXMmPerPx, reprojError, boundaryType, detConf);

      // Contour dimensions (only if contour is available)
      let contourWidth = null;
      let contourHeight = null;
      if (detection.contourPoints && detection.contourPoints.length >= 4) {
        const cBounds = computeContourBounds(detection.contourPoints);
        const cwMm = cBounds.width * scaleXMmPerPx;
        const chMm = cBounds.height * scaleYMmPerPx;
        contourWidth = estimateMeasurementUncertainty(cwMm, cBounds.width, scaleXMmPerPx, reprojError, 'contour', detConf);
        contourHeight = estimateMeasurementUncertainty(chMm, cBounds.height, scaleYMmPerPx, reprojError, 'contour', detConf);
      }

      // --- Step 10: Assess quality ---
      const grade = determineTechnicalQualityGrade(
        reprojError,
        detConf,
        boundaryType,
        cornerResult.estimatedAngleDeg
      );

      const warnings: string[] = [];
      if (cornerResult.estimatedAngleDeg > 30) {
        warnings.push(`Significant perspective distortion (~${Math.round(cornerResult.estimatedAngleDeg)}°). Measurements may be less accurate.`);
      }
      if (reprojError > 3) {
        warnings.push(`Homography reprojection error is elevated (${reprojError.toFixed(1)}px). Consider re-selecting reference corners.`);
      }
      if (boundaryType === 'bounding_box') {
        warnings.push('Object boundary is a bounding box approximation. Actual object dimensions may be smaller.');
      }
      warnings.push(COPLANARITY_NOTICE);

      const measurementQuality: MeasurementQuality = {
        grade,
        coplanarityWarning: true, // always true for 2D photo measurement
        estimatedPerspectiveAngleDeg: cornerResult.estimatedAngleDeg,
        lensDistortionCorrected,
        warnings,
      };

      // Generate rectified image data URL for display
      this.emitStage('generating_annotation');
      let rectifiedImageDataUrl: string | undefined;
      try {
        const rectCanvas = document.createElement('canvas');
        rectCanvas.width = outputWidth;
        rectCanvas.height = outputHeight;
        const rectCtx = rectCanvas.getContext('2d');
        if (rectCtx) {
          rectCtx.putImageData(rectifiedImageData, 0, 0);
          rectifiedImageDataUrl = rectCanvas.toDataURL('image/png');
        }
      } catch {
        // Non-critical
      }

      this.emitStage('complete');

      return {
        boundingWidth,
        boundingHeight,
        contourWidth,
        contourHeight,
        distanceTop,
        distanceBottom,
        distanceLeft,
        distanceRight,
        calibration: {
          scaleXMmPerPx,
          scaleYMmPerPx,
          referenceConfig,
          reprojectionErrorPx: Math.round(reprojError * 100) / 100,
        },
        detection,
        quality: measurementQuality,
        rectifiedImageDataUrl,
        disclaimer: MEASUREMENT_DISCLAIMER,
      };
    } catch (err) {
      this.emitStage('failed');
      return {
        code: 'CALIBRATION_FAILED',
        message: `Measurement failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        suggestion: 'Try capturing a clearer image with less perspective distortion.',
      };
    }
  }

  private emitStage(stage: MeasurementStage): void {
    this.onStage?.(stage);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dist(a: Point2D, b: Point2D): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

function computeContourBounds(points: Point2D[]): { width: number; height: number } {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { width: maxX - minX, height: maxY - minY };
}

/**
 * Helper: Check if a measurement result is an error.
 */
export function isMeasurementError(
  result: MeasurementResult | MeasurementError
): result is MeasurementError {
  return 'code' in result && 'suggestion' in result;
}

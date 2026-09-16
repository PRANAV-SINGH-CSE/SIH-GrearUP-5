/**
 * CompliScan — Browser-Based CV Measurement Type System
 *
 * All types for the client-side measurement pipeline.
 * These are NEVER sent to the server as-is; only a serializable
 * MeasurementMetadata subset is attached to scan submissions.
 */

// ---------------------------------------------------------------------------
// Geometry Primitives
// ---------------------------------------------------------------------------

/** A 2D point in pixel coordinates */
export interface Point2D {
  x: number;
  y: number;
}

/** Four corners defining a quadrilateral (clockwise from top-left) */
export interface Quadrilateral {
  topLeft: Point2D;
  topRight: Point2D;
  bottomRight: Point2D;
  bottomLeft: Point2D;
}

/** Axis-aligned bounding box */
export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Reference Configuration
// ---------------------------------------------------------------------------

/** Known physical dimensions of the reference area */
export interface ReferenceConfig {
  widthMm: number;
  heightMm: number;
  /** User-supplied label for the reference (e.g. "Package front face") */
  label?: string;
  /** Whether this is an auto-calibrated package without a rigid reference card */
  isAuto?: boolean;
}

/** Common reference presets */
export const REFERENCE_PRESETS: { label: string; widthMm: number; heightMm: number; isAuto?: boolean }[] = [
  { label: '⚡ Auto-Detected Package PDP (Standard)', widthMm: 160, heightMm: 240, isAuto: true },
  { label: 'Standard Snack Pouch / Chips Bag', widthMm: 160, heightMm: 240, isAuto: true },
  { label: 'FMCG Carton / Box (120 × 180 mm)', widthMm: 120, heightMm: 180, isAuto: true },
  { label: 'Beverage Can / Bottle (65 × 180 mm)', widthMm: 65, heightMm: 180, isAuto: true },
  { label: 'Credit Card / ID Card (ISO 7810)', widthMm: 85.6, heightMm: 53.98 },
  { label: 'A4 Paper (297 × 210 mm)', widthMm: 297, heightMm: 210 },
  { label: 'A5 Paper (210 × 148 mm)', widthMm: 210, heightMm: 148 },
  { label: '10 cm × 10 cm Square', widthMm: 100, heightMm: 100 },
];

// ---------------------------------------------------------------------------
// Lens Distortion (optional)
// ---------------------------------------------------------------------------

/** Radial lens distortion coefficients (Brown-Conrady model) */
export interface LensDistortionParams {
  /** First radial distortion coefficient */
  k1: number;
  /** Second radial distortion coefficient */
  k2: number;
  /** Optical center X (normalized 0-1 of image width) */
  cx: number;
  /** Optical center Y (normalized 0-1 of image height) */
  cy: number;
}

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

/** How the object boundary was determined */
export type BoundaryType = 'bounding_box' | 'contour' | 'user_adjusted';

/** Detected object boundary */
export interface DetectedObject {
  /** Bounding box in rectified pixel coordinates */
  boundingBox: BBox;
  /** Contour points if reliably detected (null if only bounding box) */
  contourPoints: Point2D[] | null;
  /** How the boundary was determined */
  boundaryType: BoundaryType;
  /** Detection confidence (0-1) */
  detectionConfidence: number;
  /** Which detector produced this result */
  detectorId: string;
}

/**
 * Pluggable object detector interface.
 * Implementations are registered with the ObjectDetectorRegistry
 * and tried in priority order (lower number = higher priority).
 */
export interface IObjectDetector {
  readonly id: string;
  readonly name: string;
  /** Priority: lower number = tried first */
  readonly priority: number;
  /** Whether this detector is ready (model loaded, etc.) */
  isReady(): Promise<boolean>;
  /**
   * Detect the primary object in the given rectified region.
   * @param imageData - Rectified (perspective-corrected) region pixel data
   * @param regionWidthMm - Physical width of the region in mm
   * @param regionHeightMm - Physical height of the region in mm
   * @returns Detected object or null if nothing found
   */
  detect(
    imageData: ImageData,
    regionWidthMm: number,
    regionHeightMm: number
  ): Promise<DetectedObject | null>;
}

// ---------------------------------------------------------------------------
// Measurements
// ---------------------------------------------------------------------------

/** A single measurement with uncertainty (± error) */
export interface MeasurementValue {
  /** The measured value in millimeters */
  valueMm: number;
  /** Estimated error bound (±) in millimeters */
  estimatedErrorMm: number;
  /** Confidence score for this specific measurement (0-1) */
  confidenceScore: number;
}

/** Complete measurement result */
export interface MeasurementResult {
  // --- Object dimensions ---

  /** Object bounding-box dimensions (always available) */
  boundingWidth: MeasurementValue;
  boundingHeight: MeasurementValue;

  /** Contour-fitted dimensions (only if contour was reliably detected) */
  contourWidth: MeasurementValue | null;
  contourHeight: MeasurementValue | null;

  // --- Edge distances ---

  distanceTop: MeasurementValue;
  distanceBottom: MeasurementValue;
  distanceLeft: MeasurementValue;
  distanceRight: MeasurementValue;

  // --- Calibration info ---

  calibration: {
    scaleXMmPerPx: number;
    scaleYMmPerPx: number;
    referenceConfig: ReferenceConfig;
    /** Residual reprojection error of homography (lower = better) */
    reprojectionErrorPx: number;
  };

  // --- Detection details ---

  detection: DetectedObject;

  // --- Quality assessment ---

  quality: MeasurementQuality;

  /** The rectified reference region as a data URL (for annotation display) */
  rectifiedImageDataUrl?: string;

  /** Explicit disclaimer — always present */
  disclaimer: string;
}

/** Quality assessment for the entire measurement */
export interface MeasurementQuality {
  /**
   * Technical quality grade.
   * This is NOT a compliance determination — it indicates how reliable
   * the CV measurement itself is, independent of legal significance.
   */
  grade: 'HIGH' | 'ACCEPTABLE' | 'LOW' | 'UNRELIABLE';
  /** Whether the coplanarity assumption is likely satisfied */
  coplanarityWarning: boolean;
  /** Estimated camera angle from perpendicular (degrees) */
  estimatedPerspectiveAngleDeg: number;
  /** Whether lens distortion correction was applied */
  lensDistortionCorrected: boolean;
  /** Human-readable warnings */
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/** Typed error codes for measurement failures */
export type MeasurementErrorCode =
  | 'REFERENCE_CORNERS_INVALID'
  | 'REFERENCE_NOT_CONVEX'
  | 'REFERENCE_CORNERS_WRONG_ORDER'
  | 'REFERENCE_TOO_SMALL'
  | 'REFERENCE_ASPECT_RATIO_MISMATCH'
  | 'IMAGE_TOO_BLURRY'
  | 'IMAGE_RESOLUTION_TOO_LOW'
  | 'IMAGE_POOR_LIGHTING'
  | 'PERSPECTIVE_TOO_EXTREME'
  | 'REFERENCE_PARTIALLY_VISIBLE'
  | 'OBJECT_NOT_DETECTED'
  | 'OBJECT_OUTSIDE_REFERENCE'
  | 'OBJECT_PARTIALLY_OUTSIDE'
  | 'COPLANARITY_UNLIKELY'
  | 'CALIBRATION_FAILED'
  | 'HOMOGRAPHY_FAILED';

/** Structured measurement error */
export interface MeasurementError {
  code: MeasurementErrorCode;
  message: string;
  suggestion: string;
}

// ---------------------------------------------------------------------------
// Image Quality (pre-measurement)
// ---------------------------------------------------------------------------

/** Image quality assessment before measurement begins */
export interface ImageQualityAssessment {
  acceptable: boolean;
  blurScore: number;       // 0 = sharp, 1 = very blurry
  resolution: { width: number; height: number };
  brightnessScore: number; // 0 = very dark, 1 = very bright
  contrastScore: number;   // 0 = flat/uniform, 1 = high contrast
  errors: MeasurementError[];
}

// ---------------------------------------------------------------------------
// Processing Stages (for UI progress)
// ---------------------------------------------------------------------------

export type MeasurementStage =
  | 'validating_image'
  | 'validating_corners'
  | 'correcting_lens_distortion'
  | 'computing_homography'
  | 'correcting_perspective'
  | 'detecting_object'
  | 'calculating_dimensions'
  | 'estimating_uncertainty'
  | 'generating_annotation'
  | 'complete'
  | 'failed';

export const MEASUREMENT_STAGE_LABELS: Record<MeasurementStage, string> = {
  validating_image: 'Validating image quality…',
  validating_corners: 'Validating reference corners…',
  correcting_lens_distortion: 'Correcting lens distortion…',
  computing_homography: 'Computing perspective transform…',
  correcting_perspective: 'Correcting perspective…',
  detecting_object: 'Detecting object…',
  calculating_dimensions: 'Calculating dimensions…',
  estimating_uncertainty: 'Estimating measurement uncertainty…',
  generating_annotation: 'Generating annotated image…',
  complete: 'Measurement complete',
  failed: 'Measurement failed',
};

// ---------------------------------------------------------------------------
// Compliance Integration — Serializable Metadata
// ---------------------------------------------------------------------------

/**
 * Serializable measurement metadata that can be attached to a scan submission.
 * This is the ONLY measurement data that crosses the client→server boundary.
 */
export interface MeasurementMetadata {
  /** PDP bounding dimensions in mm */
  pdpBoundingWidthMm?: number;
  pdpBoundingHeightMm?: number;
  pdpBoundingAreaMm2?: number;
  /** Contour-fitted dimensions if available */
  pdpContourWidthMm?: number;
  pdpContourHeightMm?: number;
  pdpContourAreaMm2?: number;
  /** Uncertainty bounds */
  widthErrorMm?: number;
  heightErrorMm?: number;
  /** Technical quality grade from the measurement system */
  qualityGrade: 'HIGH' | 'ACCEPTABLE' | 'LOW' | 'UNRELIABLE';
  /** How the object boundary was determined */
  boundaryType: BoundaryType;
  /** Coplanarity was assumed (always true for 2D photo measurement) */
  coplanarityAssumed: boolean;
  /** Source disclaimer */
  disclaimer: string;
}

// ---------------------------------------------------------------------------
// Measurement Disclaimer Constants
// ---------------------------------------------------------------------------

export const MEASUREMENT_DISCLAIMER =
  'These are computer-vision estimates derived from a 2D photograph, not physical ' +
  'measurements. Accuracy depends on image quality, camera angle, reference calibration, ' +
  'and the assumption that the object and reference surface are coplanar. ' +
  'Legal/enforcement verification requires physical inspection with calibrated instruments.';

export const COPLANARITY_NOTICE =
  'Measurements assume the object and reference surface are on the same plane. ' +
  'Objects raised above or recessed below the reference surface will have ' +
  'measurement error proportional to their offset from the reference plane.';
